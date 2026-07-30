import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/services/prisma';
import { getCurrentUser } from '@/services/auth';
import { rateLimit } from '@/services/rate-limit';
import { QuestionType } from '@prisma/client';

const putLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

type NormalizedQuestion = {
  id: string | null;
  type: QuestionType;
  prompt: string;
  options: string | null;
  correctAnswer: string | null;
  points: number;
  explanation: string | null;
  order: number;
};

function sanitizeOptions(value: unknown): string[] | null {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(parsed)) return null;

  return parsed.slice(0, 10).map((option: unknown) => (
    typeof option === 'string'
      ? option.replace(/<[^>]*>?/gm, '').trim().slice(0, 300)
      : ''
  ));
}

function normalizeChoiceAnswer(value: unknown, options: string[]) {
  const answer = typeof value === 'number'
    ? String(value)
    : typeof value === 'string'
      ? value.trim()
      : '';

  if (!/^(0|[1-9]\d*)$/.test(answer)) return null;
  const index = Number(answer);
  return Number.isSafeInteger(index) && index < options.length ? String(index) : null;
}

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
    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: 'Daftar soal harus berupa array.' }, { status: 400 });
    }
    if (questions.length > 100) {
      return NextResponse.json({ error: 'Maksimal 100 soal per evaluasi.' }, { status: 400 });
    }

    const normalizedQuestions: NormalizedQuestion[] = [];
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question || typeof question !== 'object') {
        return NextResponse.json({ error: `Soal nomor ${i + 1} tidak valid.` }, { status: 400 });
      }
      const suppliedId = typeof question.id === "string" ? question.id.trim() : "";
      const id = suppliedId && !suppliedId.startsWith("temp_") ? suppliedId : null;

      const prompt = typeof question.prompt === 'string'
        ? question.prompt.replace(/<[^>]*>?/gm, '').trim().slice(0, 1000)
        : '';
      if (!prompt) {
        return NextResponse.json({ error: `Pertanyaan soal nomor ${i + 1} wajib diisi.` }, { status: 400 });
      }

      const type = typeof question.type === 'string' && Object.values(QuestionType).includes(question.type as QuestionType)
        ? question.type as QuestionType
        : QuestionType.MULTIPLE_CHOICE;
      const explanation = typeof question.explanation === 'string'
        ? question.explanation.replace(/<[^>]*>?/gm, '').trim().slice(0, 1000) || null
        : null;
      const points = Math.max(1, Math.min(100, Math.round(Number(question.points) || 10)));

      let options: string | null = null;
      let correctAnswer = typeof question.correctAnswer === 'string'
        ? question.correctAnswer.replace(/<[^>]*>?/gm, '').trim().slice(0, 300) || null
        : null;

      if (type === QuestionType.MULTIPLE_CHOICE || type === QuestionType.TRUE_FALSE) {
        const parsedOptions = sanitizeOptions(question.options);
        if (!parsedOptions || parsedOptions.length < 2 || parsedOptions.some(option => !option)) {
          return NextResponse.json({
            error: `Soal nomor ${i + 1} harus memiliki minimal 2 opsi jawaban yang tidak kosong.`,
          }, { status: 400 });
        }

        correctAnswer = normalizeChoiceAnswer(question.correctAnswer, parsedOptions);
        if (correctAnswer === null) {
          return NextResponse.json({
            error: `Soal nomor ${i + 1} harus memiliki indeks jawaban benar yang valid.`,
          }, { status: 400 });
        }
        options = JSON.stringify(parsedOptions);
      }

      normalizedQuestions.push({
        id,
        type,
        prompt,
        options,
        correctAnswer,
        points,
        explanation,
        order: i,
      });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        course: true,
        questions: {
          select: {
            id: true,
            _count: { select: { answers: true } },
          },
        },
        _count: { select: { attempts: true } },
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    if (user.role !== 'SUPER_ADMIN' && assessment.course.mentorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized assessment' }, { status: 401 });
    }

    const existingById = new Map(assessment.questions.map(question => [question.id, question]));
    const submittedExistingIds = normalizedQuestions
      .map(question => question.id)
      .filter((id): id is string => Boolean(id));
    if (new Set(submittedExistingIds).size !== submittedExistingIds.length) {
      return NextResponse.json({ error: "ID soal tidak boleh duplikat." }, { status: 400 });
    }
    if (submittedExistingIds.some(id => !existingById.has(id))) {
      return NextResponse.json({ error: "Soal berasal dari evaluasi lain atau sudah tidak tersedia." }, { status: 400 });
    }

    const removedQuestions = assessment.questions.filter(question => !submittedExistingIds.includes(question.id));
    if (removedQuestions.some(question => question._count.answers > 0)) {
      return NextResponse.json({
        error: "Soal yang sudah memiliki jawaban peserta tidak dapat dihapus. Pertahankan soal tersebut untuk menjaga riwayat penilaian.",
      }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      for (const question of normalizedQuestions) {
        const { id, ...data } = question;
        if (id) {
          await tx.assessmentQuestion.update({
            where: { id },
            data,
          });
        } else {
          await tx.assessmentQuestion.create({
            data: { assessmentId, ...data },
          });
        }
      }
      if (removedQuestions.length > 0) {
        await tx.assessmentQuestion.deleteMany({
          where: {
            assessmentId,
            id: { in: removedQuestions.map(question => question.id) },
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_ASSESSMENT_QUESTIONS",
          metadata: JSON.stringify({ assessmentId, questionsCount: normalizedQuestions.length })
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
    console.error("Error saving assessment:", error);
    return NextResponse.json({ error: "Gagal menyimpan asesmen." }, { status: 500 });
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
      select: {
        course: { select: { id: true, mentorId: true, slug: true } },
        _count: { select: { attempts: true } },
      }
    });

    if (!assessment || (user.role !== 'SUPER_ADMIN' && assessment.course.mentorId !== user.id)) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 });
    }
    if (assessment._count.attempts > 0) {
      return NextResponse.json({
        error: "Evaluasi yang sudah memiliki kiriman peserta tidak dapat dihapus karena merupakan bagian dari riwayat belajar.",
      }, { status: 409 });
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
