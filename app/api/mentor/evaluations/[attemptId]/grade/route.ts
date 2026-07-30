import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { getCurrentUser } from '@/services/auth';
import { rateLimit } from '@/services/rate-limit';
import { finalizeCourseCompletion } from '@/services/completion';
import { syncAssessmentAchievement } from '@/services/assessment-achievement';

const gradeLimiter = rateLimit({ limit: 60, windowMs: 60 * 1000 });

export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const ipCheck = gradeLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan penilaian. Silakan tunggu 1 menit.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Silakan masuk.' }, { status: 401 });
    if (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
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
    if (attempt.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Evaluasi belum dikirim oleh peserta dan belum dapat dinilai.' },
        { status: 409 },
      );
    }

    const questionMap = new Map(attempt.assessment.questions.map(q => [q.id, q]));
    const maxPossibleScore = attempt.assessment.questions.reduce((acc, q) => acc + q.points, 0);

    const updatedAttempt = await prisma.$transaction(async (tx) => {
      // Update individual answer scores if provided with server clamping and XSS sanitization
      if (answersScores && Array.isArray(answersScores)) {
        for (const ans of (answersScores as unknown[])) {
          if (!ans || typeof ans !== 'object' || !('questionId' in ans) || typeof (ans as { questionId?: unknown }).questionId !== 'string') continue;
          const q = questionMap.get((ans as { questionId: string }).questionId);
          const maxPoints = q ? q.points : 100;
          const ansObj = ans as { score?: unknown; feedback?: unknown; questionId: string };
          const clampedAnsScore = Math.max(0, Math.min(maxPoints, Math.round(Number(ansObj.score) || 0)));
          const cleanAnsFeedback = typeof ansObj.feedback === 'string' ? ansObj.feedback.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000) : null;

          await tx.attemptAnswer.updateMany({
            where: { attemptId, questionId: ansObj.questionId },
            data: {
              score: clampedAnsScore,
              feedback: cleanAnsFeedback
            }
          });
        }
      }

      // Recalculate total score from updated or existing answers
      const updatedAnswers = await tx.attemptAnswer.findMany({
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
      const savedAttempt = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          score: finalScore,
          passed: serverPassed,
          feedback: cleanFeedback,
          status: 'GRADED',
          gradedAt: new Date()
        }
      });

      await tx.notification.create({
        data: {
          userId: attempt.userId,
          title: serverPassed ? 'Tugas Anda Telah Dinilai ✅' : 'Tugas Anda Telah Dinilai',
          message: serverPassed
            ? `Selamat! Tugas "${attempt.assessment.title}" pada program ${attempt.assessment.course.title} telah dinilai dan Anda dinyatakan lulus dengan skor ${finalScore}.`
            : `Tugas "${attempt.assessment.title}" pada program ${attempt.assessment.course.title} telah dinilai dengan skor ${finalScore}. Silakan cek catatan mentor pada riwayat pembelajaran Anda.`,
          type: 'ASSESSMENT_GRADED',
          link: '/riwayat'
        }
      });

      await syncAssessmentAchievement(tx, {
        userId: attempt.userId,
        assessmentId: attempt.assessmentId,
        courseId: attempt.assessment.course.id,
        assessmentType: attempt.assessment.type,
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "GRADE_EVALUATION",
          metadata: JSON.stringify({ attemptId, studentId: attempt.userId, score: finalScore, passed: serverPassed })
        }
      });

      return savedAttempt;
    });

    if (attempt.assessment.type !== 'PRETEST') {
      await finalizeCourseCompletion(attempt.userId, attempt.assessment.course.id).catch(() => null);
    }

    return NextResponse.json(updatedAttempt);
  } catch (error: unknown) {
    console.error('Error grading attempt:', error);
    return NextResponse.json({ error: "Gagal memproses penilaian." }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const ipCheck = gradeLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan data penilaian. Silakan tunggu sebentar.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Silakan masuk.' }, { status: 401 });
    if (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { attemptId } = await params;
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: { include: { course: true, questions: { orderBy: { order: 'asc' } } } },
        answers: true,
        user: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });

    if (!attempt || (user.role !== 'SUPER_ADMIN' && attempt.assessment.course.mentorId !== user.id)) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(attempt);
  } catch (error: unknown) {
    console.error('Error fetching attempt:', error);
    return NextResponse.json({ error: 'Gagal mengambil data evaluasi' }, { status: 500 });
  }
}
