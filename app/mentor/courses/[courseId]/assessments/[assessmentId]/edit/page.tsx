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

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      course: true,
      questions: { orderBy: { order: "asc" } }
    }
  });

  if (!assessment || assessment.course.mentorId !== user.id) {
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
