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

    // Delete existing questions
    await prisma.assessmentQuestion.deleteMany({
      where: { assessmentId }
    });

    // Create new ones with clamping and sanitization
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q || typeof q !== 'object') continue;
        const cleanPrompt = typeof q.prompt === 'string' ? q.prompt.replace(/<[^>]*>?/gm, "").trim() : "Pertanyaan";
        const cleanExplanation = typeof q.explanation === 'string' ? q.explanation.replace(/<[^>]*>?/gm, "").trim() : null;
        const clampedPoints = Math.max(1, Math.min(100, Math.round(Number(q.points) || 10)));

        await prisma.assessmentQuestion.create({
          data: {
            assessmentId,
            type: Object.values(QuestionType).includes(q.type as QuestionType) ? (q.type as QuestionType) : QuestionType.MULTIPLE_CHOICE,
            prompt: cleanPrompt || "Pertanyaan",
            options: q.options ? JSON.stringify(q.options) : null,
            correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : '',
            points: clampedPoints,
            explanation: cleanExplanation,
            order: i
          }
        });
      }
    }

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
