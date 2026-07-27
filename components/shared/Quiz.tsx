/* eslint-disable @typescript-eslint/no-explicit-any */
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

  if (result && !showReview) return (
    <main className={`quiz-result pf-quiz-result ${result.passed ? "is-passed" : result.needsManualGrading ? "is-pending" : "is-failed"}`} aria-labelledby="quiz-result-title">
      <h1 id="quiz-result-title" className="sr-only">Hasil evaluasi {assessment.title}</h1>
      <div className={`pf-quiz-result-mark ${result.passed ? "passed" : result.needsManualGrading ? "pending" : "failed"}`} aria-hidden="true">
        {result.passed ? <Trophy /> : result.needsManualGrading ? <CheckCircle2 /> : <XCircle />}
      </div>
      <p className="pf-quiz-eyebrow">
        {result.needsManualGrading
          ? "Terkirim · Menunggu penilaian"
          : result.passed
            ? "Evaluasi selesai · Lulus"
            : "Evaluasi selesai · Belum lulus"}
      </p>
      <div className="pf-quiz-score" aria-label={`Skor ${result.score}`}>
        <strong>{result.score}</strong>
        <span>Skor kompetensi akhir</span>
      </div>
      {!result.needsManualGrading && (
        <dl className="pf-quiz-result-metrics">
          <div>
            <dt>Jawaban tepat</dt>
            <dd>{result.correct}/{result.total}</dd>
          </div>
          <div>
            <dt>Batas lulus</dt>
            <dd>{assessment.passingScore}</dd>
          </div>
        </dl>
      )}
      <p className="pf-quiz-feedback">{result.feedback}</p>
      <div className="result-actions pf-quiz-result-actions">
        {result.questions && !result.needsManualGrading && (
          <button type="button" onClick={() => setShowReview(true)} className="btn btn-primary">
            Lihat pembahasan
          </button>
        )}
        {!result.passed && !result.needsManualGrading && (
          <button type="button" onClick={retry} className="btn btn-outline">
            <RotateCcw aria-hidden="true" /> Coba sekali lagi
          </button>
        )}
        <Link href={`/belajar/${assessment.course.slug}`} className="btn btn-outline">
          Kembali ke kelas
        </Link>
      </div>
    </main>
  );

  if (showReview && result?.questions) return <div className="quiz-review-page pf-quiz-review-page">
    <header className="review-header pf-quiz-review-header">
      <button type="button" onClick={() => setShowReview(false)} className="btn btn-small btn-outline">
        <ArrowLeft aria-hidden="true" /> Kembali ke skor
      </button>
      <div>
        <p className="pf-quiz-eyebrow">Pembahasan evaluasi</p>
        <h1>{assessment.title}</h1>
      </div>
    </header>
    <main className="review-list">
      {result.questions.map((q, index) => {
        const isMultiple = q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE';
        const opts = isMultiple ? JSON.parse(q.options || "[]") as string[] : [];
        const userAns = answers[q.id];
        const isCorrect = String(userAns) === String(q.correctAnswer);
        return <article key={q.id} className={`review-card pf-quiz-review-card ${isCorrect ? "correct" : "incorrect"}`}>
          <div className="review-question-header">
            <span>Soal {index + 1}</span>
            {isCorrect
              ? <strong className="status-correct"><CheckCircle2 aria-hidden="true" /> Benar</strong>
              : <strong className="status-incorrect"><XCircle aria-hidden="true" /> Salah</strong>}
          </div>
          <h3>{q.prompt}</h3>
          {isMultiple && <div className="review-options">
            {opts.map((opt, i) => {
              let className = "review-opt ";
              if (String(i) === String(q.correctAnswer)) className += "is-correct ";
              else if (String(i) === String(userAns)) className += "is-wrong ";
              return <div key={`${q.id}-${i}`} className={className}>
                <i aria-hidden="true">{String.fromCharCode(65 + i)}</i>
                <span>{opt}</span>
                {String(i) === String(q.correctAnswer) && <CheckCircle2 aria-label="Jawaban benar" />}
                {String(i) === String(userAns) && String(i) !== String(q.correctAnswer) && <XCircle aria-label="Jawaban Anda" />}
              </div>;
            })}
          </div>}
          {!isMultiple && (
            <div className="pf-quiz-review-response">
              <p><strong>Jawaban Anda:</strong> {String(userAns)}</p>
              <p><strong>Jawaban benar:</strong> {q.correctAnswer}</p>
            </div>
          )}
          {q.explanation && <div className="review-explanation"><h4>Pembahasan</h4><p>{q.explanation}</p></div>}
        </article>;
      })}
    </main>
  </div>;

  const question = assessment.questions[current];
  const isMultiple = question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE';
  const options = isMultiple ? JSON.parse(question.options || "[]") as string[] : [];

  return <div className="quiz-page pf-quiz-page">
    <header className="glass pf-quiz-header">
      <Link href={`/belajar/${assessment.course.slug}`} className="pf-quiz-back-link" aria-label="Kembali ke kelas">
        <ArrowLeft aria-hidden="true" />
      </Link>
      <div className="pf-quiz-title">
        <small>{assessment.course.title}</small>
        <strong>{assessment.title}</strong>
      </div>
      <span className={`pf-quiz-timer ${seconds <= 60 ? "time-warning" : ""}`} role="timer" aria-label={`Sisa waktu ${Math.floor(seconds / 60)} menit ${seconds % 60} detik`}>
        <Clock3 aria-hidden="true" />
        <b>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</b>
      </span>
    </header>
    <main className="pf-quiz-main">
      <div className="quiz-top pf-quiz-progress">
        <span>Soal {current + 1} dari {assessment.questions.length}</span>
        <div
          className="pf-quiz-progress-track"
          role="progressbar"
          aria-label="Progres pengisian evaluasi"
          aria-valuenow={Object.keys(answers).length}
          aria-valuemin={0}
          aria-valuemax={assessment.questions.length}
          aria-valuetext={`${Object.keys(answers).length} dari ${assessment.questions.length} soal terjawab`}
        >
          {assessment.questions.map((item, index) => (
            <i
              aria-hidden="true"
              key={item.id}
              className={`${answers[item.id] !== undefined ? "is-answered" : ""} ${index === current ? "is-current" : ""}`}
            />
          ))}
        </div>
      </div>
      <article className="question-card glass pf-quiz-question" aria-labelledby={`question-${question.id}`}>
        <p className="pf-quiz-eyebrow">Pertanyaan {current + 1} · {question.type.replaceAll("_", " ").toLocaleLowerCase("id-ID")}</p>
        <h1 id={`question-${question.id}`}>{question.prompt}</h1>
        
        {isMultiple && (
          <fieldset className="options pf-quiz-options">
            <legend className="sr-only">Pilihan jawaban untuk soal {current + 1}</legend>
            {options.map((option, index) => (
              <label key={`${question.id}-${index}`} className={`pf-quiz-option ${answers[question.id] === index ? "selected" : ""}`}>
                <input
                  type="radio"
                  name={`answer-${question.id}`}
                  value={index}
                  checked={answers[question.id] === index}
                  onChange={() => setAnswers(previous => ({ ...previous, [question.id]: index }))}
                />
                <i aria-hidden="true">{String.fromCharCode(65 + index)}</i>
                <span>{option}</span>
                {answers[question.id] === index && <CheckCircle2 aria-hidden="true" />}
              </label>
            ))}
          </fieldset>
        )}

        {(question.type === 'SHORT_ANSWER' || question.type === 'ESSAY') && (
          <div className="pf-quiz-written-answer">
            <label htmlFor={`answer-${question.id}`} className="sr-only">Jawaban soal {current + 1}</label>
            <textarea
              id={`answer-${question.id}`}
              value={answers[question.id] || ""} 
              onChange={e => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
              placeholder="Ketik jawaban Anda di sini..." 
              className={`pf-quiz-textarea ${question.type === 'ESSAY' ? "is-essay" : ""}`}
            />
          </div>
        )}

        {question.type === 'FILE_UPLOAD' && (
          <div className="pf-quiz-upload">
            <UploadCloud aria-hidden="true" />
            <div>
              <strong>Unggah berkas jawaban</strong>
              <p>Format yang disarankan: PDF, DOCX, atau ZIP.</p>
            </div>
            <label htmlFor={`file-${question.id}`} className="btn btn-outline pf-quiz-upload-action">Pilih berkas</label>
            <input className="pf-quiz-file-input" id={`file-${question.id}`} type="file" onChange={(e) => handleFileChange(e, question.id)} />
            {files[question.id] && <p className="pf-quiz-selected-file" aria-live="polite">Berkas terpilih: {files[question.id].name}</p>}
          </div>
        )}

      </article>
      {error && <div className="quiz-error pf-quiz-error" role="alert">
        <p>{error}</p>
        <button type="button" className="btn btn-outline btn-small" onClick={() => void submit()}>Kirim ulang</button>
      </div>}
      <footer className="glass pf-quiz-footer">
        <button type="button" className="btn btn-outline" disabled={current === 0 || loading} onClick={() => setCurrent(current - 1)}>
          <ArrowLeft aria-hidden="true" /> Sebelumnya
        </button>
        <small aria-live="polite">{Object.keys(answers).length} dari {assessment.questions.length} terjawab</small>
        {current < assessment.questions.length - 1
          ? <button type="button" className="btn btn-primary" disabled={loading} onClick={() => setCurrent(current + 1)}>
              Berikutnya <ArrowRight aria-hidden="true" />
            </button>
          : <button type="button" className="btn btn-primary" disabled={Object.keys(answers).length < assessment.questions.length || loading} onClick={() => void submit()}>
              {loading ? <><LoaderCircle className="spin" aria-hidden="true" /> Mengirim</> : <>Kirim jawaban <ArrowRight aria-hidden="true" /></>}
            </button>}
      </footer>
    </main>
  </div>
}
