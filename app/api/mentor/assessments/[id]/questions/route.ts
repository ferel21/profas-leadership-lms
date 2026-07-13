/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const body = await req.json();
    const { type, prompt, options, correctAnswer, points, explanation } = body;

    // Verify assessment belongs to mentor
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { course: true }
    });

    if (!assessment || assessment.course.mentorId !== user.id) {
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
        type: type || 'MULTIPLE_CHOICE',
        prompt,
        options: options ? JSON.stringify(options) : null,
        correctAnswer: correctAnswer || null,
        points: points || 10,
        explanation: explanation || null,
        order: nextOrder
      }
    });

    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: { course: { select: { mentorId: true } } },
    });
    if (!assessment || assessment.course.mentorId !== user.id) {
      return NextResponse.json({ error: 'Assessment not found or unauthorized' }, { status: 404 });
    }

    const questions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json(questions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
