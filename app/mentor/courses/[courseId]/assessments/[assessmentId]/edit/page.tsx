import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/DashboardChrome";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssessmentEditorClient } from "./AssessmentEditorClient";

export default async function AssessmentEditorPage({ params }: { params: Promise<{ courseId: string; assessmentId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const { courseId, assessmentId } = await params;

  let assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      course: true,
      questions: { orderBy: { order: "asc" } }
    }
  });

  if (!assessment) {
    // MASTER SKILL: Self-Healing Auto-Create Assessment jika belum ada di database atau ter-reset oleh Vercel
    const course = await prisma.course.findFirst({ where: { id: courseId, mentorId: user.id } });
    if (!course) {
      redirect(`/mentor/courses/${courseId}/builder`);
    }
    const node = await prisma.courseNode.findFirst({ where: { courseId, OR: [{ id: assessmentId }, { assessmentId: assessmentId }] } });
    const newTitle = node ? node.title : "Evaluasi / Kuis Baru";
    const isAssignment = node ? node.type === "ASSIGNMENT" : false;

    assessment = await prisma.assessment.create({
      data: {
        id: assessmentId,
        courseId,
        title: newTitle,
        type: isAssignment ? "FINAL" : "MODULE",
        isAssignment,
        passingScore: 70,
        timeLimitMin: 30
      },
      include: {
        course: true,
        questions: { orderBy: { order: "asc" } }
      }
    });

    if (node && !node.assessmentId) {
      await prisma.courseNode.update({ where: { id: node.id }, data: { assessmentId: assessment.id } }).catch(() => {});
    }
  }

  if (assessment.course.mentorId !== user.id) {
    redirect(`/mentor/courses/${courseId}/builder`);
  }

  return (
    <DashboardChrome user={user}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/mentor/courses/${courseId}/builder`} className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Kembali ke Builder
        </Link>
      </div>
      <div className="dash-title">
        <div>
          <p>{assessment.isAssignment ? "Assignment Editor" : "Quiz Editor"}</p>
          <h1>{assessment.title}</h1>
          <small>Kelola pengaturan dan soal untuk modul ini.</small>
        </div>
      </div>
      
      <AssessmentEditorClient 
        assessment={assessment} 
        courseId={courseId} 
      />
    </DashboardChrome>
  );
}
