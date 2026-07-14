import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { AssessmentType } from '@prisma/client';

const assessmentLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

export async function POST(req: Request) {
  const ipCheck = assessmentLimiter.check(req);
  if (!ipCheck.success) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan pembuatan evaluasi. Silakan tunggu sebentar.' }, { status: 429 });
  }

  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Data evaluasi tidak valid.' }, { status: 400 });
    }

    const { courseId, title, type, isAssignment, passingScore, timeLimitMin, deadline } = body;

    if (!courseId || typeof courseId !== 'string' || !title || typeof title !== 'string' || !type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Object.values(AssessmentType).includes(type as AssessmentType)) {
      return NextResponse.json({ error: 'Invalid assessment type' }, { status: 400 });
    }

    // Verify course belongs to mentor or user is super_admin
    const course = await prisma.course.findFirst({
      where: { id: courseId, ...(user.role === 'MENTOR' ? { mentorId: user.id } : {}) }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found or unauthorized' }, { status: 404 });
    }

    const cleanTitle = title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150);
    const clampedPassingScore = Math.max(0, Math.min(100, Math.round(Number(passingScore) || 70)));
    const clampedTimeLimitMin = Math.max(1, Math.min(600, Math.round(Number(timeLimitMin) || 15)));

    const assessment = await prisma.assessment.create({
      data: {
        courseId,
        title: cleanTitle || "Evaluasi",
        type: type as AssessmentType,
        isAssignment: Boolean(isAssignment),
        passingScore: clampedPassingScore,
        timeLimitMin: clampedTimeLimitMin,
        deadline: deadline ? new Date(deadline) : null,
      }
    });

    return NextResponse.json(assessment);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error creating assessment";
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'MENTOR' && user.role !== 'SUPER_ADMIN')) {
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
        ...(user.role === 'MENTOR' ? { course: { mentorId: user.id } } : {})
      },
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { id: 'desc' }
    });

    return NextResponse.json(assessments);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error fetching assessments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
