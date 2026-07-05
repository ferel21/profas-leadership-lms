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
      <header className="review-header" style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link href="/dashboard/evaluasi" className="btn btn-small btn-outline"><ArrowLeft/> Kembali ke Daftar</Link>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "1.5rem", margin: 0 }}>Review Jawaban: {attempt.user.name}</h2>
          <p style={{ margin: 0, color: "#64748b" }}>{attempt.assessment.title} • {attempt.assessment.course.title}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: "1.5rem", display: "block", color: attempt.passed ? "var(--color-success)" : "var(--color-error)" }}>Skor: {attempt.score}</strong>
          <small>{attempt.passed ? "Lulus" : "Belum Lulus"}</small>
        </div>
      </header>

      <main className="review-list">
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
              <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>{q.prompt}</h3>
              
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
                <div style={{ background: '#f8fbfc', padding: '1rem', borderRadius: '8px' }}>
                  <p><strong>Jawaban:</strong> {userAns}</p>
                  {q.type === 'FILE_UPLOAD' && ans.fileUrl && (
                    <a href={ans.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', fontWeight: 'bold' }}>Download Lampiran</a>
                  )}
                </div>
              )}

              {q.explanation && (
                <div className="review-explanation" style={{ marginTop: '1rem' }}>
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
