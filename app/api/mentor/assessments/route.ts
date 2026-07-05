import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, title, type, isAssignment, passingScore, timeLimitMin, deadline } = body;

    if (!courseId || !title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify course belongs to mentor
    const course = await prisma.course.findFirst({
      where: { id: courseId, mentorId: user.id }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const assessment = await prisma.assessment.create({
      data: {
        courseId,
        title,
        type,
        isAssignment: isAssignment || false,
        passingScore: passingScore || 70,
        timeLimitMin: timeLimitMin || 15,
        deadline: deadline ? new Date(deadline) : null,
      }
    });

    return NextResponse.json(assessment);
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const assessments = await prisma.assessment.findMany({
      where: {
        courseId,
        course: { mentorId: user.id }
      },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(assessments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
