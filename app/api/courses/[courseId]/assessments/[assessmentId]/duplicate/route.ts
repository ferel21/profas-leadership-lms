import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string; assessmentId: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { courseId, assessmentId } = await params;
  
  const course = await prisma.course.findFirst({
    where: user.role === "SUPER_ADMIN" ? { id: courseId } : { id: courseId, mentorId: user.id },
  });
  if (!course) return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });

  const originalAssessment = await prisma.assessment.findUnique({
    where: { id: assessmentId, courseId },
    include: { questions: true }
  });

  if (!originalAssessment) return NextResponse.json({ message: "Assessment tidak ditemukan" }, { status: 404 });

  const newAssessmentId = `asm_${Math.random().toString(36).substring(2, 9)}`;

  await prisma.assessment.create({
    data: {
      id: newAssessmentId,
      courseId,
      title: `${originalAssessment.title} (Copy)`,
      type: originalAssessment.type,
      isAssignment: originalAssessment.isAssignment,
      deadline: originalAssessment.deadline,
      passingScore: originalAssessment.passingScore,
      timeLimitMin: originalAssessment.timeLimitMin,
      questions: {
        create: originalAssessment.questions.map(q => ({
          type: q.type,
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          explanation: q.explanation,
          order: q.order,
        }))
      }
    }
  });

  return NextResponse.json({ newAssessmentId });
}
