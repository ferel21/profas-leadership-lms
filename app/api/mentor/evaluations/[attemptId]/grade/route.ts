import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { finalizeCourseCompletion } from '@/lib/completion';

const gradeLimiter = rateLimit({ limit: 60, windowMs: 60 * 1000 });

export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const ipCheck = gradeLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan penilaian. Silakan tunggu 1 menit.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Data penilaian tidak valid.' }, { status: 400 });
    }

    const { score: inputScore, feedback, answersScores } = body;

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: { include: { course: true, questions: true } },
        answers: true
      }
    });

    if (!attempt || (user.role !== 'SUPER_ADMIN' && attempt.assessment.course.mentorId !== user.id)) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 });
    }

    const questionMap = new Map(attempt.assessment.questions.map(q => [q.id, q]));
    const maxPossibleScore = attempt.assessment.questions.reduce((acc, q) => acc + q.points, 0);

    // Update individual answer scores if provided with server clamping and XSS sanitization
    if (answersScores && Array.isArray(answersScores)) {
      for (const ans of (answersScores as unknown[])) {
        if (!ans || typeof ans !== 'object' || !('questionId' in ans) || typeof (ans as { questionId?: unknown }).questionId !== 'string') continue;
        const q = questionMap.get((ans as { questionId: string }).questionId);
        const maxPoints = q ? q.points : 100;
        const ansObj = ans as { score?: unknown; feedback?: unknown; questionId: string };
        const clampedAnsScore = Math.max(0, Math.min(maxPoints, Math.round(Number(ansObj.score) || 0)));
        const cleanFeedback = typeof ansObj.feedback === 'string' ? ansObj.feedback.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000) : null;

        await prisma.attemptAnswer.updateMany({
          where: { attemptId, questionId: ansObj.questionId },
          data: {
            score: clampedAnsScore,
            feedback: cleanFeedback
          }
        });
      }
    }

    // Recalculate total score from updated or existing answers
    const updatedAnswers = await prisma.attemptAnswer.findMany({
      where: { attemptId }
    });

    let finalScore = 0;
    if (updatedAnswers.length > 0 && maxPossibleScore > 0) {
      const totalEarned = updatedAnswers.reduce((acc, a) => acc + (typeof a.score === 'number' ? a.score : 0), 0);
      finalScore = Math.round((totalEarned / maxPossibleScore) * 100);
    } else {
      finalScore = Math.round(Number(inputScore) || 0);
    }
    finalScore = Math.max(0, Math.min(100, finalScore));

    const serverPassed = (attempt.assessment.type === 'PRETEST' || finalScore >= attempt.assessment.passingScore);
    const cleanFeedback = typeof feedback === 'string'
      ? feedback.replace(/<[^>]*>?/gm, "").trim().slice(0, 2000)
      : (serverPassed ? "Selamat, tugas Anda telah dinilai dan dinyatakan lulus!" : "Silakan perbaiki tugas Anda sesuai catatan evaluasi.");

    // Update attempt
    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: finalScore,
        passed: serverPassed,
        feedback: cleanFeedback,
        status: 'GRADED',
        gradedAt: new Date()
      }
    });

    // If passed, award XP and mark completion
    if (serverPassed && !attempt.passed) {
      await prisma.xPLog.upsert({
        where: {
          userId_source_sourceId: {
            userId: attempt.userId,
            source: 'ASSESSMENT',
            sourceId: attempt.assessmentId
          }
        },
        create: {
          userId: attempt.userId,
          points: 50,
          source: 'ASSESSMENT',
          sourceId: attempt.assessmentId
        },
        update: {}
      }).catch(() => {});

      // Find node that has this assessment
      const node = await prisma.courseNode.findFirst({
        where: { OR: [{ id: attempt.assessmentId }, { assessmentId: attempt.assessmentId }], courseId: attempt.assessment.course.id }
      });

      if (node) {
        await prisma.nodeProgress.upsert({
          where: {
            userId_nodeId: {
              userId: attempt.userId,
              nodeId: node.id
            }
          },
          create: {
            userId: attempt.userId,
            nodeId: node.id,
            completedAt: new Date()
          },
          update: { completedAt: new Date() }
        }).catch(() => {});
      }

      if (attempt.assessment.type !== 'PRETEST') {
        await finalizeCourseCompletion(attempt.userId, attempt.assessment.course.id).catch(() => null);
      }
    }

    return NextResponse.json(updatedAttempt);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses penilaian";
    console.error('Error grading attempt:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
