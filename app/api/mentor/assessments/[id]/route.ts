import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assessmentId } = await params;
    const body = await req.json();
    const { questions } = body;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { course: true }
    });

    if (!assessment || assessment.course.mentorId !== user.id) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Delete existing questions
    await prisma.assessmentQuestion.deleteMany({
      where: { assessmentId }
    });

    // Create new ones
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await prisma.assessmentQuestion.create({
          data: {
            assessmentId,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            points: q.points,
            explanation: q.explanation,
            order: i
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving assessment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
