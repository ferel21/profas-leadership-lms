import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { QuestionType } from '@prisma/client';

const questionsLimiter = rateLimit({ limit: 40, windowMs: 60 * 1000 });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ipCheck = questionsLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan pembuatan soal.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
    }

    const { type, prompt, options, correctAnswer, points, explanation } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Pertanyaan soal wajib diisi.' }, { status: 400 });
    }

    const cleanPrompt = prompt.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000);
    if (!cleanPrompt) {
      return NextResponse.json({ error: 'Pertanyaan tidak valid setelah pembersihan karakter.' }, { status: 400 });
    }

    const cleanExplanation = typeof explanation === 'string' ? explanation.replace(/<[^>]*>?/gm, "").trim().slice(0, 1000) : null;
    const cleanCorrectAnswer = typeof correctAnswer === 'string' ? correctAnswer.replace(/<[^>]*>?/gm, "").trim().slice(0, 300) : null;
    const safePoints = typeof points === 'number' && !isNaN(points) && points >= 1 && points <= 100 ? Math.round(points) : 10;
    const cleanOptions = Array.isArray(options)
      ? options.slice(0, 10).map((opt: unknown) => typeof opt === 'string' ? opt.replace(/<[^>]*>?/gm, "").trim().slice(0, 300) : "").filter(Boolean)
      : null;

    // Verify assessment belongs to mentor or user is admin
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { course: true }
    });

    if (!assessment || (user.role !== 'SUPER_ADMIN' && assessment.course.mentorId !== user.id)) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 });
    }

    // Get max order
    const maxOrderAgg = await prisma.assessmentQuestion.aggregate({
      where: { assessmentId },
      _max: { order: true }
    });
    
    const nextOrder = (maxOrderAgg._max.order || 0) + 1;

    const question = await prisma.assessmentQuestion.create({
      data: {
        assessmentId,
        type: (typeof type === 'string' && Object.values(QuestionType).includes(type as QuestionType) ? (type as QuestionType) : QuestionType.MULTIPLE_CHOICE),
        prompt: cleanPrompt,
        options: cleanOptions ? JSON.stringify(cleanOptions) : null,
        correctAnswer: cleanCorrectAnswer,
        points: safePoints,
        explanation: cleanExplanation,
        order: nextOrder
      }
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: 'Gagal membuat soal evaluasi.' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ipCheck = questionsLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan daftar soal.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { course: { select: { mentorId: true } } },
    });
    if (!assessment || (user.role !== 'SUPER_ADMIN' && assessment.course.mentorId !== user.id)) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 });
    }

    const questions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId },
      take: 100,
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(questions);
  } catch (error: unknown) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Gagal mengambil soal evaluasi.' }, { status: 500 });
  }
}
