"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, LoaderCircle, RotateCcw, Trophy, XCircle, UploadCloud } from "lucide-react";

type Question = { id: string; prompt: string; options: string | null; type: string; order: number };
type QuizResult = { 
  score: number; passed: boolean; correct: number; total: number; feedback: string; 
  needsManualGrading?: boolean; status?: string;
  questions?: { id: string; prompt: string; options: string; correctAnswer: string; explanation?: string; type: string }[] 
};

export function Quiz({ assessment }: { assessment: { id: string; title: string; timeLimitMin: number; passingScore: number; course: { slug: string; title: string }; questions: Question[] } }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [seconds, setSeconds] = useState(assessment.timeLimitMin * 60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const submitting = useRef(false);
  const timeoutSubmitted = useRef(false);

  const submit = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true; setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("assessmentId", assessment.id);
      
      const cleanAnswers: Record<string, any> = {};
      for (const [qId, val] of Object.entries(answers)) {
        if (files[qId]) {
           formData.append(`file_${qId}`, files[qId]);
           cleanAnswers[qId] = { fileUrl: true };
        } else if (typeof val === 'string') {
           cleanAnswers[qId] = val;
        } else {
           cleanAnswers[qId] = val;
        }
      }
      formData.append("answers", JSON.stringify(cleanAnswers));

      const response = await fetch("/api/assessments/submit", {
        method: "POST",
        body: formData // Using FormData for possible file uploads
      });
      const data = await response.json().catch(() => null) as (QuizResult & { message?: string }) | null;
      if (!response.ok || !data) { setError(data?.message ?? "Evaluasi belum dapat dikirim. Coba lagi."); setLoading(false); submitting.current = false; return }
      setResult(data); setLoading(false);
    } catch { setError("Koneksi bermasalah. Evaluasi belum dikirim."); setLoading(false); submitting.current = false }
  }, [answers, files, assessment.id]);

  useEffect(() => { if (result || loading || seconds <= 0) return; const timer = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer) }, [result, loading, seconds]);
  useEffect(() => { if (seconds === 0 && !result && !loading && !timeoutSubmitted.current) { timeoutSubmitted.current = true; void submit() } }, [seconds, result, loading, submit]);

  function retry() { submitting.current = false; timeoutSubmitted.current = false; setResult(null); setShowReview(false); setAnswers({}); setFiles({}); setCurrent(0); setSeconds(assessment.timeLimitMin * 60); setError("") }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [questionId]: e.target.files[0] });
      setAnswers({ ...answers, [questionId]: { fileUrl: true } });
    }
  };

  if (result && !showReview) return <div className="quiz-result glass" style={{ maxWidth: '600px', margin: '4rem auto', padding: '3rem', borderRadius: '24px', textAlign: 'center' }}><span className={result.passed ? "passed" : "failed"} style={{ display: 'inline-flex', padding: '20px', borderRadius: '50%', background: result.passed || result.needsManualGrading ? 'var(--teal-light)' : '#fee2e2', color: result.passed || result.needsManualGrading ? 'var(--teal)' : '#dc2626', marginBottom: '1rem' }}>{result.passed || result.needsManualGrading ? <Trophy size={48} /> : <XCircle size={48} />}</span><small style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--muted)', marginBottom: '1rem' }}>{result.needsManualGrading ? "TERKIRIM & MENUNGGU PENILAIAN" : (result.passed ? "EVALUASI SELESAI" : "BELUM LULUS")}</small><h1 style={{ fontSize: '72px', margin: '0', color: 'var(--ink)' }}>{result.score}</h1><p style={{ color: 'var(--muted)', marginTop: '0' }}>Skor Anda</p>{!result.needsManualGrading && <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', margin: '2rem 0', padding: '1.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }}><span><b style={{ display: 'block', fontSize: '24px' }}>{result.correct}/{result.total}</b><small style={{ color: 'var(--muted)' }}>Jawaban benar</small></span><span><b style={{ display: 'block', fontSize: '24px' }}>{assessment.passingScore}</b><small style={{ color: 'var(--muted)' }}>Nilai minimum</small></span></div>}<h2 style={{ fontSize: '18px', color: 'var(--ink)' }}>{result.feedback}</h2><div className="result-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>{result.questions && !result.needsManualGrading && <button onClick={() => setShowReview(true)} className="btn btn-primary hover-lift">Lihat Pembahasan</button>}{!result.passed && !result.needsManualGrading && <button onClick={retry} className="btn btn-outline hover-lift"><RotateCcw /> Coba Lagi</button>}<Link href={`/belajar/${assessment.course.slug}`} className="btn btn-outline hover-lift">Kembali ke Kelas</Link></div></div>;

  if (showReview && result?.questions) return <div className="quiz-review-page">
    <header className="review-header"><button onClick={() => setShowReview(false)} className="btn btn-small btn-outline"><ArrowLeft /> Kembali ke Skor</button><h2>Pembahasan Evaluasi: {assessment.title}</h2></header>
    <main className="review-list">
      {result.questions.map((q, index) => {
        const isMultiple = q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE';
        const opts = isMultiple ? JSON.parse(q.options || "[]") as string[] : [];
        const userAns = answers[q.id];
        const isCorrect = String(userAns) === String(q.correctAnswer);
        return <article key={q.id} className={`review-card ${isCorrect ? "correct" : "incorrect"}`}>
          <div className="review-question-header"><span>Soal {index + 1}</span>{isCorrect ? <strong className="status-correct"><CheckCircle2 size={16} /> Benar</strong> : <strong className="status-incorrect"><XCircle size={16} /> Salah</strong>}</div>
          <h3>{q.prompt}</h3>
          {isMultiple && <div className="review-options">
            {opts.map((opt, i) => {
              let className = "review-opt ";
              if (String(i) === String(q.correctAnswer)) className += "is-correct ";
              else if (String(i) === String(userAns)) className += "is-wrong ";
              return <div key={opt} className={className}><i>{String.fromCharCode(65 + i)}</i> {opt} {String(i) === String(q.correctAnswer) && <CheckCircle2 size={16} />}{String(i) === String(userAns) && String(i) !== String(q.correctAnswer) && <XCircle size={16} />}</div>;
            })}
          </div>}
          {!isMultiple && (
            <div style={{ background: '#f8fbfc', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
              <p style={{ margin: 0 }}><strong>Jawaban Anda:</strong> {String(userAns)}</p>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--teal)' }}><strong>Jawaban Benar:</strong> {q.correctAnswer}</p>
            </div>
          )}
          {q.explanation && <div className="review-explanation"><h4>Pembahasan:</h4><p>{q.explanation}</p></div>}
        </article>;
      })}
    </main>
  </div>;

  const question = assessment.questions[current];
  const isMultiple = question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE';
  const options = isMultiple ? JSON.parse(question.options || "[]") as string[] : [];

  return <div className="quiz-page" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
    <header className="glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', position: 'sticky', top: 0, zIndex: 10, borderRadius: '0 0 24px 24px', margin: '0 auto', maxWidth: '1200px' }}><Link href={`/belajar/${assessment.course.slug}`} aria-label="Kembali ke kelas" style={{ padding: '8px', background: 'var(--teal-light)', borderRadius: '12px', color: 'var(--teal)', display: 'flex' }}><ArrowLeft /></Link><div style={{ textAlign: 'center' }}><small style={{ display: 'block', color: 'var(--muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{assessment.course.title}</small><b style={{ fontSize: '14px' }}>{assessment.title}</b></div><span className={`glass ${seconds <= 60 ? "time-warning" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', color: seconds <= 60 ? '#dc2626' : 'var(--teal-dark)', background: seconds <= 60 ? '#fee2e2' : 'white' }}><Clock3 size={18} /><b>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</b></span></header>
    <main style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 20px' }}>
      <div className="quiz-top" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 'bold' }}>Soal {current + 1} dari {assessment.questions.length}</span>
        <div style={{ display: 'flex', gap: '6px' }}>{assessment.questions.map((item, index) => <i key={item.id} style={{ width: '32px', height: '6px', borderRadius: '4px', background: answers[item.id] !== undefined ? 'var(--teal)' : index === current ? 'var(--teal-light)' : '#e2e8f0', transition: 'all 0.3s ease' }} />)}</div>
      </div>
      <article className="question-card glass hover-lift" style={{ padding: '3rem', borderRadius: '24px', background: 'rgba(255,255,255,0.8)' }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--teal)', letterSpacing: '1px' }}>PERTANYAAN {current + 1} ({question.type})</span>
        <h1 style={{ fontSize: '24px', lineHeight: 1.5, margin: '1rem 0 2rem' }}>{question.prompt}</h1>
        
        {isMultiple && (
          <div className="options" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {options.map((option, index) => <button key={option} onClick={() => setAnswers(previous => ({ ...previous, [question.id]: index }))} className={`hover-lift ${answers[question.id] === index ? "selected" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '16px', border: answers[question.id] === index ? '2px solid var(--teal)' : '1px solid var(--line)', background: answers[question.id] === index ? 'var(--teal-light)' : 'white', textAlign: 'left', transition: 'all 0.2s ease', cursor: 'pointer' }}><i style={{ width: '32px', height: '32px', display: 'grid', placeItems: 'center', borderRadius: '8px', background: answers[question.id] === index ? 'var(--teal)' : '#f1f5f9', color: answers[question.id] === index ? 'white' : 'var(--muted)', fontStyle: 'normal', fontWeight: 'bold' }}>{String.fromCharCode(65 + index)}</i><span style={{ flex: 1, fontSize: '15px', color: answers[question.id] === index ? 'var(--teal-dark)' : 'inherit' }}>{option}</span>{answers[question.id] === index && <CheckCircle2 style={{ color: 'var(--teal)' }} />}</button>)}
          </div>
        )}

        {(question.type === 'SHORT_ANSWER' || question.type === 'ESSAY') && (
          <div>
            <textarea 
              value={answers[question.id] || ""} 
              onChange={e => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
              placeholder="Ketik jawaban Anda di sini..." 
              style={{ width: '100%', minHeight: question.type === 'ESSAY' ? '150px' : '60px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '1rem' }}
            />
          </div>
        )}

        {question.type === 'FILE_UPLOAD' && (
          <div style={{ padding: '2rem', border: '2px dashed var(--line)', borderRadius: '12px', textAlign: 'center', background: '#f8fbfc' }}>
            <UploadCloud size={32} style={{ color: 'var(--teal)', marginBottom: '1rem' }} />
            <p style={{ marginBottom: '1rem', color: 'var(--muted)' }}>Pilih file untuk diunggah (PDF, DOCX, ZIP)</p>
            <input type="file" onChange={(e) => handleFileChange(e, question.id)} />
            {files[question.id] && <p style={{ marginTop: '1rem', color: 'var(--teal-dark)', fontWeight: 'bold' }}>File terpilih: {files[question.id].name}</p>}
          </div>
        )}

      </article>
      {error && <p className="quiz-error" role="alert" style={{ marginTop: '2rem', padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{error} <button type="button" onClick={() => void submit()} style={{ padding: '6px 12px', background: 'white', border: 'none', borderRadius: '6px', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer' }}>Kirim ulang</button></p>}
      <footer className="glass" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '20px', marginTop: '2rem', background: 'rgba(255,255,255,0.6)' }}>
        <button className="btn btn-outline hover-lift" disabled={current === 0 || loading} onClick={() => setCurrent(current - 1)} style={{ background: 'white' }}><ArrowLeft /> Sebelumnya</button>
        <small style={{ color: 'var(--muted)', fontWeight: 'bold' }}>{Object.keys(answers).length} dari {assessment.questions.length} terjawab</small>
        {current < assessment.questions.length - 1 ? <button className="btn btn-primary hover-lift" disabled={loading} onClick={() => setCurrent(current + 1)}>Berikutnya <ArrowRight /></button> : <button className="btn btn-primary hover-lift" disabled={Object.keys(answers).length < assessment.questions.length || loading} onClick={() => void submit()}>{loading ? <LoaderCircle className="spin" /> : <>Kirim Jawaban <ArrowRight /></>}</button>}
      </footer>
    </main>
  </div>
}
