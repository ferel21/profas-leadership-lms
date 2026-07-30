import { notFound, redirect } from "next/navigation";
import { prisma } from "@/services/prisma";

function assessmentInclude(userId: string) {
  return {
    course: {
      select: {
        id: true,
        slug: true,
        title: true,
        published: true,
        enrollments: { where: { userId }, select: { id: true } },
      },
    },
    questions: {
      orderBy: { order: "asc" as const },
      select: { id: true, prompt: true, options: true, order: true, type: true, points: true },
    },
  };
}

/**
 * Resolve an existing assessment by its own id or by the id of a CourseNode
 * that is linked to it. This read path must never create or repair content.
 */
export async function resolveAssessmentForUser(id: string, userId: string) {
  let assessment = await prisma.assessment.findUnique({
    where: { id },
    include: assessmentInclude(userId),
  });

  if (!assessment) {
    const node = await prisma.courseNode.findUnique({
      where: { id },
      select: { assessmentId: true, courseId: true },
    });

    if (node?.assessmentId) {
      assessment = await prisma.assessment.findFirst({
        where: { id: node.assessmentId, courseId: node.courseId },
        include: assessmentInclude(userId),
      });
    }
  }

  if (!assessment) notFound();
  if (!assessment.course.published) notFound();
  if (assessment.course.enrollments.length === 0) redirect(`/program/${assessment.course.slug}`);
  if (assessment.questions.length === 0) notFound();

  return assessment;
}
