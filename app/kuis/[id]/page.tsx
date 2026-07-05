/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Quiz } from "@/components/Quiz";

export default async function KuisPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  
  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          published: true,
          enrollments: { where: { userId: user.id }, select: { id: true } }
        }
      },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, options: true, order: true, type: true, points: true }
      }
    }
  });

  if (!assessment || !assessment.course.published || assessment.questions.length === 0) notFound();
  if (assessment.course.enrollments.length === 0) redirect(`/program/${assessment.course.slug}`);
  
  return <Quiz assessment={assessment as any} />;
}
