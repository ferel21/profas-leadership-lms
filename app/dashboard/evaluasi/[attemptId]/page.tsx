/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default async function MentorEvaluasiDetailPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const { attemptId } = await params;

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assessment: { 
        include: { 
          course: { select: { title: true, mentorId: true } },
          questions: { orderBy: { order: "asc" } }
        } 
      },
      answers: {
        include: { question: true }
      }
    }
  });

  if (!attempt || attempt.assessment.course.mentorId !== user.id) notFound();

  return (
    <DashboardChrome user={user}>
      <header className="review-header mb-8 flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/evaluasi" className="btn btn-small btn-outline flex items-center gap-1"><ArrowLeft size={16}/> Kembali ke Daftar</Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold m-0 text-slate-900">Review Jawaban: {attempt.user.name}</h2>
          <p className="m-0 text-slate-500">{attempt.assessment.title} • {attempt.assessment.course.title}</p>
        </div>
        <div className="text-right">
          <strong className={`text-2xl block ${attempt.passed ? "text-emerald-600" : "text-red-600"}`}>Skor: {attempt.score}</strong>
          <small className="text-slate-500">{attempt.passed ? "Lulus" : "Belum Lulus"}</small>
        </div>
      </header>

      <main className="review-list flex flex-col gap-6">
        {attempt.answers.map((ans: any, index: number) => {
          const q = ans.question;
          const isMultiple = q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE';
          const opts = isMultiple ? JSON.parse(q.options || "[]") as string[] : [];
          const userAns = ans.answerText;
          const isCorrect = isMultiple && String(userAns) === String(q.correctAnswer);
          
          return (
            <article key={q.id} className={`review-card ${isCorrect ? "correct" : (isMultiple ? "incorrect" : "")}`}>
              <div className="review-question-header">
                <span>Soal {index + 1} ({q.type})</span>
                {isMultiple && (isCorrect ? <strong className="status-correct"><CheckCircle2 size={16}/> Benar</strong> : <strong className="status-incorrect"><XCircle size={16}/> Salah</strong>)}
              </div>
              <h3 className="text-lg font-bold mb-4 text-slate-800">{q.prompt}</h3>
              
              {isMultiple ? (
                <div className="review-options">
                  {opts.map((opt: string, i: number) => {
                    let className = "review-opt ";
                    if (String(i) === String(q.correctAnswer)) className += "is-correct ";
                    else if (String(i) === String(userAns)) className += "is-wrong ";
                    
                    return (
                      <div key={opt} className={className}>
                        <i>{String.fromCharCode(65 + i)}</i> {opt} 
                        {String(i) === String(q.correctAnswer) && <CheckCircle2 size={16}/>}
                        {String(i) === String(userAns) && String(i) !== String(q.correctAnswer) && <XCircle size={16}/>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="m-0 mb-2 text-slate-700"><strong>Jawaban:</strong> {userAns}</p>
                  {q.type === 'FILE_UPLOAD' && ans.fileUrl && (
                    <a href={ans.fileUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline inline-block mt-2">Download Lampiran</a>
                  )}
                </div>
              )}

              {q.explanation && (
                <div className="review-explanation mt-4">
                  <h4>Pembahasan / Kunci:</h4>
                  <p>{q.explanation}</p>
                </div>
              )}
            </article>
          );
        })}
      </main>
    </DashboardChrome>
  );
}
