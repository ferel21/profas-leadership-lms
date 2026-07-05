/* eslint-disable @typescript-eslint/no-explicit-any */
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

    let assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { course: true }
    });

    if (!assessment) {
      // MASTER SKILL: Self-Healing Auto-Create Assessment in PUT route to survive ephemeral Vercel container resets!
      const node = await prisma.courseNode.findFirst({ where: { OR: [{ id: assessmentId }, { assessmentId: assessmentId }] } });
      const courseIdToUse = node ? node.courseId : (await prisma.course.findFirst({ where: { mentorId: user.id } }))?.id;

      if (!courseIdToUse) {
        return NextResponse.json({ error: 'Course not found for mentor' }, { status: 404 });
      }

      const course = await prisma.course.findUnique({ where: { id: courseIdToUse } });
      if (!course || course.mentorId !== user.id) {
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

    if (assessment.course.mentorId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized assessment' }, { status: 401 });
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
