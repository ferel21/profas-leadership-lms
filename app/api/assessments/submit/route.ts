/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { finalizeCourseCompletion } from "@/services/completion";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { getWritableUploadRoots, resolveUploadPath } from "@/services/upload-storage";
import { validateFileMagicBytes } from "@/services/file-security";
import { rateLimit } from "@/services/rate-limit";
import { syncAssessmentAchievement } from "@/services/assessment-achievement";
import { getObjectStorageMode } from "@/services/object-storage";
import { validateUploadMetadata } from "@/services/upload-policy";
import { verifyCommittedAssignmentTicket } from "@/services/upload-tickets";
import { accessibleEnrollmentWhere } from "@/services/enrollment-access";

const submitLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });
const SUBMISSION_GRACE_MS = 10_000;

function parseChoiceOptions(value: string | null) {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every(option => typeof option === "string" && option.trim())) {
      return null;
    }
    return parsed as string[];
  } catch {
    return null;
  }
}

function normalizeChoiceIndex(value: unknown, optionsLength: number) {
  const answer = typeof value === "number"
    ? String(value)
    : typeof value === "string"
      ? value.trim()
      : "";

  if (!/^(0|[1-9]\d*)$/.test(answer)) return null;
  const index = Number(answer);
  return Number.isSafeInteger(index) && index < optionsLength ? String(index) : null;
}

function normalizeAssignmentFileUrl(value: unknown) {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 2048) return null;

  const localPrefix = "/api/uploads/assignments/";
  if (candidate.startsWith(localPrefix)) {
    const pathSegments = candidate.slice(localPrefix.length).split("/");
    const hasSafePath = pathSegments.length > 0 && pathSegments.every(segment => (
      segment !== "."
      && segment !== ".."
      && /^[A-Za-z0-9._-]+$/.test(segment)
    ));
    return hasSafePath ? candidate : null;
  }

  return null;
}

export async function POST(request: Request) {
  const submissionReceivedAt = new Date();
  const ipCheck = submitLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak pengumpulan tugas/kuis. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let assessmentId = '';
    let attemptId = '';
    let answers: Record<string, any> = {};
    const pendingFiles: Array<{ questionId: string; file: File }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const assessmentValue = formData.get('assessmentId');
      assessmentId = typeof assessmentValue === "string" ? assessmentValue.trim() : "";
      const attemptValue = formData.get("attemptId");
      attemptId = typeof attemptValue === "string" ? attemptValue.trim() : "";
      
      const answersValue = formData.get('answers');
      if (typeof answersValue === "string" && answersValue.trim()) {
        let parsedAnswers: unknown;
        try {
          parsedAnswers = JSON.parse(answersValue);
        } catch {
          return NextResponse.json({ message: "Jawaban evaluasi tidak valid." }, { status: 400 });
        }
        if (!parsedAnswers || typeof parsedAnswers !== "object" || Array.isArray(parsedAnswers)) {
          return NextResponse.json({ message: "Jawaban evaluasi tidak valid." }, { status: 400 });
        }
        answers = parsedAnswers as Record<string, any>;
      }

      // Kumpulkan dulu file. Validasi ID pertanyaan dilakukan setelah asesmen
      // dimuat, sebelum ada byte apa pun yang ditulis ke filesystem.
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('file_')) {
          const questionId = key.replace('file_', '');
          if (!(value instanceof File)) {
            return NextResponse.json({ message: "Berkas evaluasi tidak valid." }, { status: 400 });
          }
          pendingFiles.push({ questionId, file: value });
        }
      }
    } else {
      const json = await request.json() as { assessmentId?: unknown; attemptId?: unknown; answers?: unknown };
      assessmentId = typeof json.assessmentId === "string" ? json.assessmentId.trim() : "";
      attemptId = typeof json.attemptId === "string" ? json.attemptId.trim() : "";
      if (json.answers !== undefined) {
        if (!json.answers || typeof json.answers !== "object" || Array.isArray(json.answers)) {
          return NextResponse.json({ message: "Jawaban evaluasi tidak valid." }, { status: 400 });
        }
        answers = json.answers as Record<string, any>;
      }
    }

    if (!assessmentId || !attemptId) {
      return NextResponse.json({ message: "Jawaban evaluasi tidak valid." }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: { orderBy: { order: "asc" } }, course: { select: { id: true, published: true } } }
    });

    if (!assessment || !assessment.course.published) return NextResponse.json({ message: "Asesmen tidak ditemukan." }, { status: 404 });
    if (assessment.questions.length === 0) {
      return NextResponse.json({ message: "Asesmen belum memiliki soal yang dapat dikerjakan." }, { status: 409 });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: accessibleEnrollmentWhere(user.id, assessment.course.id),
      select: { id: true }
    });

    if (!enrollment) {
      return NextResponse.json({ message: "Anda belum terdaftar di program ini." }, { status: 403 });
    }

    const now = submissionReceivedAt;
    const attemptSession = await prisma.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        userId: user.id,
        assessmentId,
      },
      select: {
        id: true,
        expiresAt: true,
        status: true,
        score: true,
        passed: true,
        feedback: true,
        answers: {
          select: {
            questionId: true,
            score: true,
          },
        },
      },
    });
    if (!attemptSession) {
      return NextResponse.json(
        { code: "ATTEMPT_NOT_ACTIVE", message: "Sesi evaluasi tidak aktif." },
        { status: 409 },
      );
    }

    if (attemptSession.status !== "IN_PROGRESS") {
      const needsManualGrading = attemptSession.status === "PENDING_GRADE"
        || attemptSession.status === "SUBMITTED";
      const scoreByQuestion = new Map(
        attemptSession.answers.map(answer => [answer.questionId, answer.score]),
      );
      const correct = assessment.questions.filter(question => (
        (
          question.type === "MULTIPLE_CHOICE"
          || question.type === "TRUE_FALSE"
          || question.type === "SHORT_ANSWER"
        )
        && scoreByQuestion.get(question.id) === question.points
      )).length;
      const hasManualQuestions = assessment.questions.some(question => (
        question.type === "ESSAY" || question.type === "FILE_UPLOAD"
      ));
      const certificate = attemptSession.passed && assessment.type !== "PRETEST"
        ? await prisma.certificate.findUnique({
            where: {
              userId_courseId: {
                userId: user.id,
                courseId: assessment.course.id,
              },
            },
            select: { uniqueNumber: true },
          })
        : null;

      return NextResponse.json({
        attemptId: attemptSession.id,
        score: attemptSession.score,
        passed: attemptSession.passed,
        needsManualGrading,
        status: attemptSession.status,
        correct,
        total: assessment.questions.length,
        passingScore: assessment.passingScore,
        certificateNumber: certificate?.uniqueNumber ?? null,
        feedback: attemptSession.feedback ?? (
          needsManualGrading
            ? "Tugas berhasil dikirim dan menunggu penilaian mentor."
            : "Evaluasi telah selesai."
        ),
        questions: needsManualGrading || hasManualQuestions
          ? undefined
          : assessment.questions.map(question => ({
              id: question.id,
              prompt: question.prompt,
              options: question.options,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              type: question.type,
            })),
      });
    }

    if (
      (
        assessment.deadline
        && assessment.deadline.getTime() + SUBMISSION_GRACE_MS < now.getTime()
      )
      || !attemptSession.expiresAt
      || attemptSession.expiresAt.getTime() + SUBMISSION_GRACE_MS < now.getTime()
    ) {
      await prisma.assessmentAttempt.updateMany({
        where: { id: attemptId, status: "IN_PROGRESS" },
        data: {
          status: "GRADED",
          score: 0,
          passed: false,
          feedback: "Waktu pengerjaan evaluasi telah berakhir.",
          submittedAt: now,
          gradedAt: now,
        },
      });
      return NextResponse.json(
        { code: "ATTEMPT_EXPIRED", message: "Waktu pengerjaan evaluasi telah berakhir." },
        { status: 410 },
      );
    }

    const validQuestionIds = new Set(assessment.questions.map(q => q.id));
    const questionById = new Map(assessment.questions.map(question => [question.id, question]));
    const submittedQuestionIds = Object.keys(answers);
    const hasInvalidQuestionId = submittedQuestionIds.some(id => !validQuestionIds.has(id));
    if (hasInvalidQuestionId) {
      return NextResponse.json({ message: "ID pertanyaan dalam jawaban tidak valid." }, { status: 400 });
    }

    for (const question of assessment.questions) {
      if (question.type !== "MULTIPLE_CHOICE" && question.type !== "TRUE_FALSE") continue;

      const options = parseChoiceOptions(question.options);
      const correctIndex = options ? normalizeChoiceIndex(question.correctAnswer, options.length) : null;
      if (!options || options.length < 2 || correctIndex === null) {
        console.error("[ASSESSMENT_CONFIGURATION_ERROR]", { assessmentId, questionId: question.id });
        return NextResponse.json({ message: "Konfigurasi soal evaluasi tidak valid. Hubungi mentor." }, { status: 409 });
      }

      const submittedAnswer = answers[question.id];
      if (
        submittedAnswer !== undefined
        && submittedAnswer !== null
        && submittedAnswer !== ""
        && normalizeChoiceIndex(submittedAnswer, options.length) === null
      ) {
        return NextResponse.json({ message: "Indeks pilihan jawaban tidak valid." }, { status: 400 });
      }
    }

    for (const pending of pendingFiles) {
      const question = questionById.get(pending.questionId);
      if (!question || question.type !== "FILE_UPLOAD") {
        return NextResponse.json({ message: "Berkas hanya boleh dikirim untuk pertanyaan unggah berkas yang valid." }, { status: 400 });
      }
      const validation = validateUploadMetadata({
        purpose: "assignment",
        fileName: pending.file.name,
        fileSize: pending.file.size,
        mimeType: pending.file.type,
      });
      if (!validation.ok) return NextResponse.json({ message: validation.message }, { status: 400 });
    }

    if (pendingFiles.length > 0) {
      const storage = getObjectStorageMode();
      if (storage.mode === "supabase") {
        return NextResponse.json({ message: "Unggahan evaluasi di Vercel harus menggunakan alur unggahan langsung." }, { status: 409 });
      }
      if (storage.mode === "unavailable") {
        return NextResponse.json({ message: storage.message }, { status: 503 });
      }
    }

    // Simpan dengan nama acak dan ekstensi dari MIME type yang diizinkan.
    // ID dari request tidak pernah dipakai sebagai bagian path filesystem.
    const serverStoredFileUrls = new Set<string>();
    for (const pending of pendingFiles) {
      const validation = validateUploadMetadata({
        purpose: "assignment",
        fileName: pending.file.name,
        fileSize: pending.file.size,
        mimeType: pending.file.type,
      });
      if (!validation.ok) return NextResponse.json({ message: validation.message }, { status: 400 });
      const fileName = `${randomUUID()}${validation.value.descriptor.extension}`;
      const buffer = Buffer.from(await pending.file.arrayBuffer());

      if (!validateFileMagicBytes(buffer, validation.value.mimeType)) {
        return NextResponse.json({ message: "Format isi berkas evaluasi tidak sesuai dengan jenis MIME (Magic Byte Validation failed)." }, { status: 400 });
      }

      let stored = false;
      for (const root of getWritableUploadRoots()) {
        try {
          const segments = ["assignments", attemptId, pending.questionId];
          await mkdir(resolveUploadPath(root, segments), { recursive: true });
          await writeFile(resolveUploadPath(root, [...segments, fileName]), buffer);
          stored = true;
          break;
        } catch {
          // Try the next configured root, normally /tmp on serverless runtimes.
        }
      }
      if (!stored) return NextResponse.json({ message: "Penyimpanan berkas evaluasi sedang tidak tersedia." }, { status: 503 });

      const existingAnswer = answers[pending.questionId];
      const answerObject = existingAnswer && typeof existingAnswer === "object" && !Array.isArray(existingAnswer)
        ? existingAnswer as Record<string, unknown>
        : {};
      const fileUrl = `/api/uploads/assignments/${attemptId}/${pending.questionId}/${fileName}`;
      answers[pending.questionId] = {
        ...answerObject,
        fileUrl,
      };
      serverStoredFileUrls.add(fileUrl);
    }

    const verifiedAssignmentFiles = new Map<string, string>();
    for (const question of assessment.questions) {
      if (question.type !== "FILE_UPLOAD") continue;
      const submitted = answers[question.id];
      if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) continue;
      const record = submitted as Record<string, unknown>;
      const fileUrl = normalizeAssignmentFileUrl(record.fileUrl);
      if (!record.fileUrl) continue;
      if (!fileUrl) {
        return NextResponse.json({ message: "Referensi berkas evaluasi tidak valid." }, { status: 400 });
      }
      if (serverStoredFileUrls.has(fileUrl)) {
        verifiedAssignmentFiles.set(question.id, fileUrl);
        continue;
      }
      if (typeof record.uploadToken !== "string") {
        return NextResponse.json({ message: "Token verifikasi berkas evaluasi diperlukan." }, { status: 400 });
      }
      try {
        const upload = await verifyCommittedAssignmentTicket(record.uploadToken);
        const expectedUrl = `/api/uploads/${upload.objectPath}`;
        if (
          upload.userId !== user.id ||
          upload.assessmentId !== assessmentId ||
          upload.attemptId !== attemptId ||
          upload.questionId !== question.id ||
          expectedUrl !== fileUrl
        ) {
          return NextResponse.json({ message: "Token berkas evaluasi tidak sesuai dengan sesi." }, { status: 403 });
        }
        verifiedAssignmentFiles.set(question.id, fileUrl);
      } catch {
        return NextResponse.json({ message: "Token berkas evaluasi tidak valid atau telah kedaluwarsa." }, { status: 401 });
      }
    }

    let correct = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;
    let needsManualGrading = false;
    const attemptAnswers: Array<{ questionId: string; answerText: string | null; fileUrl: string | null; score: number }> = [];

    for (const q of assessment.questions) {
      maxPossibleScore += q.points;
      const userAns = answers[q.id];
      
      let answerText = null;
      let fileUrl = null;
      let questionScore = 0;

      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const options = parseChoiceOptions(q.options);
        const userAnsStr = options ? normalizeChoiceIndex(userAns, options.length) : null;
        const correctAnsStr = options ? normalizeChoiceIndex(q.correctAnswer, options.length) : null;
        const isCorrect = userAnsStr !== null && correctAnsStr !== null && userAnsStr === correctAnsStr;
        if (isCorrect) {
          correct++;
          questionScore = q.points;
          totalScore += q.points;
        }
        answerText = userAnsStr;
      } else if (q.type === 'SHORT_ANSWER') {
        const userAnsStr = userAns == null ? "" : String(userAns).trim().toLowerCase();
        const correctAnsStr = q.correctAnswer == null ? "" : String(q.correctAnswer).trim().toLowerCase();
        const isCorrect = userAnsStr !== "" && userAnsStr === correctAnsStr;
        if (isCorrect) {
          correct++;
          questionScore = q.points;
          totalScore += q.points;
        }
        answerText = (userAns == null ? "" : String(userAns).trim()).replace(/<[^>]*>?/gm, "").slice(0, 5000);
      } else if (q.type === 'ESSAY') {
        needsManualGrading = true;
        const rawEssay = typeof userAns === 'object' && userAns !== null ? String(userAns.text || "") : (userAns == null ? "" : String(userAns));
        answerText = rawEssay.replace(/<[^>]*>?/gm, "").slice(0, 20000);
      } else if (q.type === 'FILE_UPLOAD') {
        needsManualGrading = true;
        fileUrl = verifiedAssignmentFiles.get(q.id) ?? null;
      }

      attemptAnswers.push({
        questionId: q.id,
        answerText,
        fileUrl,
        score: q.type === 'ESSAY' || q.type === 'FILE_UPLOAD' ? 0 : questionScore
      });
    }

    const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passed = !needsManualGrading && (assessment.type === "PRETEST" || normalizedScore >= assessment.passingScore);
    const status = needsManualGrading ? "PENDING_GRADE" : "GRADED"; // assuming non-manual are graded instantly
    const feedback = needsManualGrading
      ? "Tugas berhasil dikirim dan menunggu penilaian mentor."
      : (normalizedScore >= 90
        ? "Luar biasa! Pemahaman Anda sangat kuat."
        : passed
          ? "Bagus! Anda siap melanjutkan ke tahap berikutnya."
          : "Tinjau kembali materi inti, lalu coba sekali lagi.");

    const attempt = await prisma.$transaction(async (tx) => {
      const claimed = await tx.assessmentAttempt.updateMany({
        where: {
          id: attemptId,
          userId: user.id,
          assessmentId,
          status: "IN_PROGRESS",
          expiresAt: {
            gte: new Date(now.getTime() - SUBMISSION_GRACE_MS),
          },
        },
        data: {
          score: needsManualGrading ? 0 : normalizedScore,
          passed,
          status,
          feedback,
          submittedAt: now,
          gradedAt: needsManualGrading ? null : now,
        },
      });
      if (claimed.count !== 1) {
        throw new Error("ASSESSMENT_ATTEMPT_ALREADY_SUBMITTED");
      }
      if (attemptAnswers.length > 0) {
        await tx.attemptAnswer.createMany({
          data: attemptAnswers.map(answer => ({ attemptId, ...answer })),
        });
      }

      await tx.activityLog.create({
        data: { userId: user.id, action: "SUBMIT_ASSESSMENT", metadata: JSON.stringify({ assessmentId, score: normalizedScore, passed, needsManualGrading }) }
      });

      if (!needsManualGrading) {
        await syncAssessmentAchievement(tx, {
          userId: user.id,
          assessmentId,
          courseId: assessment.course.id,
          assessmentType: assessment.type,
          completedAt: now,
        });
      }

      return tx.assessmentAttempt.findUniqueOrThrow({ where: { id: attemptId } });
    });

    const completion = (!needsManualGrading && assessment.type !== "PRETEST")
      ? await finalizeCourseCompletion(user.id, assessment.course.id)
      : null;
    
    return NextResponse.json({
      attemptId: attempt.id,
      score: needsManualGrading ? 0 : normalizedScore,
      passed,
      needsManualGrading,
      status,
      correct,
      total: assessment.questions.length,
      passingScore: assessment.passingScore,
      certificateNumber: completion?.certificateNumber ?? null,
      feedback,
      questions: needsManualGrading
        ? undefined
        : assessment.questions.map(question => ({
            id: question.id,
            prompt: question.prompt,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            type: question.type,
          })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ASSESSMENT_ATTEMPT_ALREADY_SUBMITTED") {
      return NextResponse.json(
        { code: "ATTEMPT_NOT_ACTIVE", message: "Evaluasi ini sudah dikirim." },
        { status: 409 },
      );
    }
    console.error("[ASSESSMENT_SUBMIT_ERROR]", error);
    return NextResponse.json({ message: "Gagal memproses evaluasi." }, { status: 500 });
  }
}
