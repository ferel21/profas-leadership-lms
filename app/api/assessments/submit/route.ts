/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { finalizeCourseCompletion } from "@/lib/completion";
import fs from 'fs';
import { randomUUID } from "node:crypto";
import { getWritableUploadRoots, resolveUploadPath } from "@/lib/upload-storage";
import { validateFileMagicBytes } from "@/lib/file-security";
import { rateLimit } from "@/lib/rate-limit";

const submitLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

const MAX_SUBMISSION_FILE_SIZE = 20 * 1024 * 1024;
const SUBMISSION_FILE_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "text/plain": ".txt",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
};

export async function POST(request: Request) {
  const ipCheck = submitLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak pengumpulan tugas/kuis. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let assessmentId = '';
    let answers: Record<string, any> = {};
    const pendingFiles: Array<{ questionId: string; file: File }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const assessmentValue = formData.get('assessmentId');
      assessmentId = typeof assessmentValue === "string" ? assessmentValue.trim() : "";
      
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
      const json = await request.json() as { assessmentId?: unknown; answers?: unknown };
      assessmentId = typeof json.assessmentId === "string" ? json.assessmentId.trim() : "";
      if (json.answers !== undefined) {
        if (!json.answers || typeof json.answers !== "object" || Array.isArray(json.answers)) {
          return NextResponse.json({ message: "Jawaban evaluasi tidak valid." }, { status: 400 });
        }
        answers = json.answers as Record<string, any>;
      }
    }

    if (!assessmentId) {
      return NextResponse.json({ message: "Jawaban evaluasi tidak valid." }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: { orderBy: { order: "asc" } }, course: { select: { id: true, published: true } } }
    });

    if (!assessment || !assessment.course.published) return NextResponse.json({ message: "Asesmen tidak ditemukan." }, { status: 404 });

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: assessment.course.id } },
      select: { id: true }
    });

    if (!enrollment) return NextResponse.json({ message: "Anda belum terdaftar di program ini." }, { status: 403 });

    const validQuestionIds = new Set(assessment.questions.map(q => q.id));
    const questionById = new Map(assessment.questions.map(question => [question.id, question]));
    const submittedQuestionIds = Object.keys(answers);
    const hasInvalidQuestionId = submittedQuestionIds.some(id => !validQuestionIds.has(id));
    if (hasInvalidQuestionId && assessment.questions.length > 0) {
      return NextResponse.json({ message: "ID pertanyaan dalam jawaban tidak valid." }, { status: 400 });
    }

    for (const pending of pendingFiles) {
      const question = questionById.get(pending.questionId);
      if (!question || question.type !== "FILE_UPLOAD") {
        return NextResponse.json({ message: "Berkas hanya boleh dikirim untuk pertanyaan unggah berkas yang valid." }, { status: 400 });
      }
      if (pending.file.size > MAX_SUBMISSION_FILE_SIZE) {
        return NextResponse.json({ message: "Ukuran berkas evaluasi maksimal 20MB." }, { status: 400 });
      }
      if (!SUBMISSION_FILE_TYPES[pending.file.type]) {
        return NextResponse.json({ message: "Format berkas evaluasi tidak didukung." }, { status: 400 });
      }
    }

    // Simpan dengan nama acak dan ekstensi dari MIME type yang diizinkan.
    // ID dari request tidak pernah dipakai sebagai bagian path filesystem.
    for (const pending of pendingFiles) {
      const fileName = `${randomUUID()}${SUBMISSION_FILE_TYPES[pending.file.type]}`;
      const buffer = Buffer.from(await pending.file.arrayBuffer());

      if (!validateFileMagicBytes(buffer, pending.file.type)) {
        return NextResponse.json({ message: "Format isi berkas evaluasi tidak sesuai dengan jenis MIME (Magic Byte Validation failed)." }, { status: 400 });
      }

      let stored = false;
      for (const root of getWritableUploadRoots()) {
        try {
          const uploadsDir = resolveUploadPath(root, ["assignments"]);
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          fs.writeFileSync(resolveUploadPath(root, ["assignments", fileName]), buffer);
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
      answers[pending.questionId] = {
        ...answerObject,
        fileUrl: `/api/uploads/assignments/${fileName}`,
      };
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
        const userAnsStr = userAns == null ? "" : String(userAns).trim();
        const correctAnsStr = q.correctAnswer == null ? "" : String(q.correctAnswer).trim();
        const isCorrect = userAnsStr !== "" && userAnsStr === correctAnsStr;
        if (isCorrect) {
          correct++;
          questionScore = q.points;
          totalScore += q.points;
        }
        answerText = userAnsStr.replace(/<[^>]*>?/gm, "").slice(0, 2000);
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
        const rawUrl = typeof userAns === 'object' && userAns !== null ? String(userAns.fileUrl || "") : "";
        fileUrl = rawUrl && (rawUrl.startsWith('/api/uploads/assignments/') || rawUrl.startsWith('https://')) ? rawUrl.slice(0, 500) : null;
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
      const createdAttempt = await tx.assessmentAttempt.create({
        data: {
          userId: user.id,
          assessmentId,
          score: needsManualGrading ? 0 : normalizedScore, // wait for grading if needed
          passed: passed,
          status: status,
          feedback,
          answers: {
            create: attemptAnswers
          }
        }
      });

      await tx.activityLog.create({
        data: { userId: user.id, action: "SUBMIT_ASSESSMENT", metadata: JSON.stringify({ assessmentId, score: normalizedScore, passed, needsManualGrading }) }
      });

      if (passed && assessment.type !== "PRETEST" && !needsManualGrading) {
        const points = assessment.type === "FINAL" ? 50 : 20 + (normalizedScore >= 90 ? 10 : 0);
        await tx.xPLog.upsert({
          where: { userId_source_sourceId: { userId: user.id, source: `${assessment.type}_PASSED`, sourceId: assessment.id } },
          update: {},
          create: { userId: user.id, points, source: `${assessment.type}_PASSED`, sourceId: assessment.id }
        });
      }

      // MASTER SKILL: Tandai modul Kuis / Tugas sebagai selesai di NodeProgress agar progres kelas bisa mencapai 100%!
      if (passed || needsManualGrading) {
        const node = await tx.courseNode.findFirst({ where: { OR: [{ id: assessmentId }, { assessmentId: assessmentId }], courseId: assessment.course.id } });
        if (node) {
          await tx.nodeProgress.upsert({
            where: { userId_nodeId: { userId: user.id, nodeId: node.id } },
            update: { completedAt: new Date() },
            create: { userId: user.id, nodeId: node.id, completedAt: new Date() }
          }).catch(() => {});
        }
      }

      return createdAttempt;
    });

    const completion = (passed && assessment.type !== "PRETEST" && !needsManualGrading) ? await finalizeCourseCompletion(user.id, assessment.course.id) : null;
    
    // Convert to old format for response compatibility
    const reviewQuestions = assessment.questions.map(q => ({ id: q.id, prompt: q.prompt, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation, type: q.type }));

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
      questions: reviewQuestions
    });
  } catch (error) {
    console.error("[ASSESSMENT_SUBMIT_ERROR]", error);
    return NextResponse.json({ message: "Gagal memproses evaluasi." }, { status: 500 });
  }
}
