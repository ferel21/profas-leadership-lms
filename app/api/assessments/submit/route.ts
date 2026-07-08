/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { finalizeCourseCompletion } from "@/lib/completion";
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  try {
    const contentType = request.headers.get('content-type') || '';
    let assessmentId = '';
    let answers: Record<string, any> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      assessmentId = formData.get('assessmentId') as string;
      
      const answersStr = formData.get('answers') as string;
      if (answersStr) {
        answers = JSON.parse(answersStr);
      }

      // Handle file uploads dengan Fallback ke /tmp untuk Vercel Serverless
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('file_')) {
          const questionId = key.replace('file_', '');
          const file = value as File;
          const ext = path.extname(file.name);
          const fileName = `${assessmentId}_${user.id}_${questionId}_${Date.now()}${ext}`;
          const buffer = Buffer.from(await file.arrayBuffer());

          try {
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'assignments');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
          } catch {
            const tmpDir = path.join('/tmp', 'uploads', 'assignments');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
            fs.writeFileSync(path.join(tmpDir, fileName), buffer);
          }
          
          answers[questionId] = {
            ...answers[questionId],
            fileUrl: `/api/uploads/assignments/${fileName}`
          };
        }
      }
    } else {
      const json = await request.json();
      assessmentId = json.assessmentId;
      answers = json.answers || {};
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
    const submittedQuestionIds = Object.keys(answers);
    const hasInvalidQuestionId = submittedQuestionIds.some(id => !validQuestionIds.has(id));
    if (hasInvalidQuestionId && assessment.questions.length > 0) {
      return NextResponse.json({ message: "ID pertanyaan dalam jawaban tidak valid." }, { status: 400 });
    }

    let correct = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;
    let needsManualGrading = false;
    const attemptAnswers = [];

    for (const q of assessment.questions) {
      maxPossibleScore += q.points;
      const userAns = answers[q.id];
      
      let answerText = null;
      let fileUrl = null;
      let questionScore = 0;

      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        // userAns is expected to be index or text
        const isCorrect = String(userAns) === String(q.correctAnswer);
        if (isCorrect) {
          correct++;
          questionScore = q.points;
          totalScore += q.points;
        }
        answerText = String(userAns);
      } else if (q.type === 'SHORT_ANSWER') {
        const isCorrect = String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
        if (isCorrect) {
          correct++;
          questionScore = q.points;
          totalScore += q.points;
        }
        answerText = String(userAns);
      } else if (q.type === 'ESSAY') {
        needsManualGrading = true;
        answerText = typeof userAns === 'object' ? userAns.text : String(userAns);
      } else if (q.type === 'FILE_UPLOAD') {
        needsManualGrading = true;
        fileUrl = typeof userAns === 'object' ? userAns.fileUrl : null;
      }

      attemptAnswers.push({
        questionId: q.id,
        answerText,
        fileUrl,
        score: needsManualGrading ? 0 : questionScore
      });
    }

    const normalizedScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    const passed = !needsManualGrading && (assessment.type === "PRETEST" || normalizedScore >= assessment.passingScore);
    const status = needsManualGrading ? "PENDING_GRADE" : "GRADED"; // assuming non-manual are graded instantly

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        userId: user.id,
        assessmentId,
        score: needsManualGrading ? 0 : normalizedScore, // wait for grading if needed
        passed: passed,
        status: status,
        answers: {
          create: attemptAnswers
        }
      }
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "SUBMIT_ASSESSMENT", metadata: JSON.stringify({ assessmentId, score: normalizedScore, passed, needsManualGrading }) }
    });

    if (passed && assessment.type !== "PRETEST" && !needsManualGrading) {
      const points = assessment.type === "FINAL" ? 50 : 20 + (normalizedScore >= 90 ? 10 : 0);
      await prisma.xPLog.upsert({
        where: { userId_source_sourceId: { userId: user.id, source: `${assessment.type}_PASSED`, sourceId: assessment.id } },
        update: {},
        create: { userId: user.id, points, source: `${assessment.type}_PASSED`, sourceId: assessment.id }
      });
    }

    // MASTER SKILL: Tandai modul Kuis / Tugas sebagai selesai di NodeProgress agar progres kelas bisa mencapai 100%!
    if (passed || needsManualGrading) {
      const node = await prisma.courseNode.findFirst({ where: { OR: [{ id: assessmentId }, { assessmentId: assessmentId }], courseId: assessment.course.id } });
      if (node) {
        await prisma.nodeProgress.upsert({
          where: { userId_nodeId: { userId: user.id, nodeId: node.id } },
          update: { completedAt: new Date() },
          create: { userId: user.id, nodeId: node.id, completedAt: new Date() }
        }).catch(() => {});
      }
    }

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
      feedback: needsManualGrading ? "Tugas berhasil dikirim dan menunggu penilaian mentor." : (normalizedScore >= 90 ? "Luar biasa! Pemahaman Anda sangat kuat." : passed ? "Bagus! Anda siap melanjutkan ke tahap berikutnya." : "Tinjau kembali materi inti, lalu coba sekali lagi."),
      questions: reviewQuestions
    });
  } catch (error) {
    console.error("[ASSESSMENT_SUBMIT_ERROR]", error);
    return NextResponse.json({ message: "Gagal memproses evaluasi." }, { status: 500 });
  }
}
