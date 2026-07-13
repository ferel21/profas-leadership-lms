import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const { assessmentId } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, courseId: true }
  });
  const node = assessment
    ? null
    : await prisma.courseNode.findFirst({
        where: { OR: [{ id: assessmentId }, { assessmentId }] },
        select: { assessmentId: true, courseId: true }
      });
  const resolvedAssessmentId = assessment?.id ?? node?.assessmentId;
  const courseId = assessment?.courseId ?? node?.courseId;

  if (!resolvedAssessmentId || !courseId) {
    return NextResponse.json({ result: null });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { id: true }
  });
  if (!enrollment) return NextResponse.json({ message: "Anda belum terdaftar di program ini." }, { status: 403 });

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: { userId: user.id, assessmentId: resolvedAssessmentId },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      score: true,
      passed: true,
      status: true,
      feedback: true,
      submittedAt: true,
    }
  });

  return NextResponse.json({
    result: attempt
      ? { ...attempt, submittedAt: attempt.submittedAt.toISOString() }
      : null
  });
}
