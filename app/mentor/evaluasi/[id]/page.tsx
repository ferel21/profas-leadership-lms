import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/DashboardChrome";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GradingClient } from "./GradingClient";

export default async function GradingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const { id } = await params;

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id },
    include: {
      user: true,
      assessment: {
        include: { course: true }
      },
      answers: {
        include: { question: true }
      }
    }
  });

  if (!attempt || attempt.assessment.course.mentorId !== user.id) {
    redirect("/mentor/evaluasi");
  }

  return (
    <DashboardChrome user={user}>
      <div className="mb-6">
        <Link href="/mentor/evaluasi" className="text-link inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Kembali ke Evaluasi
        </Link>
      </div>
      <div className="dash-title">
        <div>
          <p>Penilaian Manual</p>
          <h1>Evaluasi: {attempt.user.name}</h1>
          <small>Course: {attempt.assessment.title}</small>
        </div>
      </div>
      
      <GradingClient attempt={attempt} />
    </DashboardChrome>
  );
}
