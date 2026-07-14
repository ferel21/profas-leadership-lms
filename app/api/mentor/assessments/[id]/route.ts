import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { QuestionType } from '@prisma/client';

const putLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ipCheck = putLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan penyimpanan soal. Silakan tunggu sebentar.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Data soal tidak valid.' }, { status: 400 });
    }

    const { questions } = body;
    if (questions && Array.isArray(questions) && questions.length > 100) {
      return NextResponse.json({ error: 'Maksimal 100 soal per evaluasi.' }, { status: 400 });
    }

    let assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { course: true }
    });

    if (!assessment) {
      // MASTER SKILL: Self-Healing Auto-Create Assessment in PUT route to survive ephemeral Vercel container resets!
      const node = await prisma.courseNode.findFirst({ where: { OR: [{ id: assessmentId }, { assessmentId: assessmentId }] } });
      const courseIdToUse = node ? node.courseId : (await prisma.course.findFirst({ where: { ...(user.role === 'MENTOR' ? { mentorId: user.id } : {}) } }))?.id;

      if (!courseIdToUse) {
        return NextResponse.json({ error: 'Course not found for mentor' }, { status: 404 });
      }

      const course = await prisma.course.findUnique({ where: { id: courseIdToUse } });
      if (!course || (user.role !== 'SUPER_ADMIN' && course.mentorId !== user.id)) {
        return NextResponse.json({ error: 'Unauthorized course' }, { status: 401 });
      }

      assessment = await prisma.assessment.create({
        data: {
          id: assessmentId,
          courseId: courseIdToUse,
          title: node ? node.title : "Evaluasi / Kuis",
          type: (node && node.type === "ASSIGNMENT") ? "FINAL" : "MODULE",
          isAssignment: node ? node.type === "ASSIGNMENT" : false,
          passingScore: 70,
          timeLimitMin: 30
        },
        include: { course: true }
      });

      if (node && !node.assessmentId) {
        await prisma.courseNode.update({ where: { id: node.id }, data: { assessmentId: assessment.id } }).catch(() => {});
      }
    }

    if (user.role !== 'SUPER_ADMIN' && assessment.course.mentorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized assessment' }, { status: 401 });
    }

    await prisma.$transaction(async (tx) => {
      // Delete existing questions
      await tx.assessmentQuestion.deleteMany({
        where: { assessmentId }
      });

      // Create new ones with clamping and sanitization
      if (questions && Array.isArray(questions) && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q || typeof q !== 'object') continue;
          const cleanPrompt = typeof q.prompt === 'string' ? q.prompt.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000) : "Pertanyaan";
          const cleanExplanation = typeof q.explanation === 'string' ? q.explanation.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000) : null;
          const clampedPoints = Math.max(1, Math.min(100, Math.round(Number(q.points) || 10)));
          const qType = typeof q.type === 'string' && Object.values(QuestionType).includes(q.type as QuestionType) ? (q.type as QuestionType) : QuestionType.MULTIPLE_CHOICE;

          let cleanOptionsStr: string | null = null;
          if (Array.isArray(q.options)) {
            const arr = q.options.slice(0, 10).map((opt: unknown) => typeof opt === 'string' ? opt.replace(/<[^>]*>?/gm, "").trim().slice(0, 300) : "").filter(Boolean);
            if (arr.length > 0) cleanOptionsStr = JSON.stringify(arr);
          } else if (typeof q.options === 'string' && q.options.trim()) {
            cleanOptionsStr = q.options.trim();
          }

          const cleanAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer.replace(/<[^>]*>?/gm, "").trim().slice(0, 300) : '';

          if (qType === QuestionType.MULTIPLE_CHOICE) {
            let parsedArr: string[] = [];
            if (cleanOptionsStr) {
              try { parsedArr = JSON.parse(cleanOptionsStr); } catch {}
            }
            if (!Array.isArray(parsedArr) || parsedArr.length < 2) {
              throw new Error(`Soal nomor ${i + 1} (Pilihan Ganda) harus memiliki minimal 2 opsi jawaban yang valid.`);
            }
            if (!cleanAnswer || !parsedArr.includes(cleanAnswer)) {
              throw new Error(`Soal nomor ${i + 1} (Pilihan Ganda) harus memiliki jawaban benar yang cocok dengan opsi.`);
            }
          }

          await tx.assessmentQuestion.create({
            data: {
              assessmentId,
              type: qType,
              prompt: cleanPrompt || "Pertanyaan",
              options: cleanOptionsStr,
              correctAnswer: cleanAnswer,
              points: clampedPoints,
              explanation: cleanExplanation,
              order: i
            }
          });
        }
      }

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_ASSESSMENT_QUESTIONS",
          metadata: JSON.stringify({ assessmentId, questionsCount: questions?.length || 0 })
        }
      });
    });

    revalidatePath(`/evaluasi/${assessmentId}`);
    revalidatePath(`/kuis/${assessmentId}`);
    revalidatePath(`/belajar/${assessment.course.slug}`);
    revalidatePath(`/belajar/${assessment.courseId}`);
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/evaluasi');
    revalidatePath(`/mentor/evaluasi/${assessmentId}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan asesmen";
    console.error("Error saving assessment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ipCheck = putLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan evaluasi.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        course: { select: { id: true, title: true, mentorId: true } },
        questions: { orderBy: { order: 'asc' } }
      }
    });

    if (!assessment || (user.role !== 'SUPER_ADMIN' && assessment.course.mentorId !== user.id)) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(assessment);
  } catch (error: unknown) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json({ error: 'Gagal mengambil data evaluasi.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ipCheck = putLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan penghapusan evaluasi.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { course: { select: { id: true, mentorId: true, slug: true } } }
    });

    if (!assessment || (user.role !== 'SUPER_ADMIN' && assessment.course.mentorId !== user.id)) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.assessmentQuestion.deleteMany({ where: { assessmentId } });
      await tx.assessmentAttempt.deleteMany({ where: { assessmentId } });
      await tx.courseNode.updateMany({
        where: { assessmentId },
        data: { assessmentId: null }
      });
      await tx.assessment.delete({ where: { id: assessmentId } });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "DELETE_ASSESSMENT",
          metadata: JSON.stringify({ assessmentId, courseId: assessment.course.id })
        }
      });
    });

    revalidatePath(`/belajar/${assessment.course.slug}`);
    revalidatePath(`/belajar/${assessment.course.id}`);
    revalidatePath('/dashboard/evaluasi');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json({ error: 'Gagal menghapus evaluasi.' }, { status: 500 });
  }
}
