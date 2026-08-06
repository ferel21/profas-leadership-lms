/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, LoaderCircle, RotateCcw, Trophy, XCircle, UploadCloud, Award } from "lucide-react";
import { uploadFileDirectly } from "@/utils/direct-upload";

type Question = { id: string; prompt: string; options: string | null; type: string; order: number };
type QuizResult = { 
  score: number; passed: boolean; correct: number; total: number; feedback: string; 
  needsManualGrading?: boolean; status?: string; certificateNumber?: string | null;
  questions?: { id: string; prompt: string; options: string | null; correctAnswer: string | null; explanation?: string | null; type: string }[]
};
type StartAttemptResult = {
  attemptId: string;
  startedAt: string;
  expiresAt: string;
  resumed?: boolean;
  message?: string;
};

function parseQuestionOptions(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(option => typeof option === "string")
      ? parsed as string[]
      : [];
  } catch {
    return [];
  }
}

export function Quiz({ assessment }: { assessment: { id: string; title: string; timeLimitMin: number; passingScore: number; course: { slug: string; title: string }; questions: Question[] } }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [attemptId, setAttemptId] = useState("");
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [starting, setStarting] = useState(true);
  const [attemptClosed, setAttemptClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const submitting = useRef(false);
  const timeoutSubmitted = useRef(false);

  const startAttempt = useCallback(async (resetState = false, signal?: AbortSignal) => {
    if (resetState) {
      submitting.current = false;
      timeoutSubmitted.current = false;
      setResult(null);
      setShowReview(false);
      setAnswers({});
      setFiles({});
      setCurrent(0);
      setAttemptId("");
      setExpiresAtMs(null);
      setSeconds(15);
      setAttemptClosed(false);
    }

    setStarting(true);
    setError("");
    try {
      const response = await fetch("/api/assessments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: assessment.id }),
        cache: "no-store",
        signal,
      });
      const data = await response.json().catch(() => null) as StartAttemptResult | null;
      if (!response.ok || !data?.attemptId || !data.expiresAt) {
        setError(data?.message ?? "Sesi evaluasi belum dapat dimulai. Silakan coba lagi.");
        return;
      }

      const serverExpiresAt = Date.parse(data.expiresAt);
      if (!Number.isFinite(serverExpiresAt)) {
        setError("Batas waktu evaluasi dari server tidak valid.");
        return;
      }

      setAttemptId(data.attemptId);
      setExpiresAtMs(serverExpiresAt);
      setSeconds(15);
    } catch (startError) {
      if (startError instanceof DOMException && startError.name === "AbortError") return;
      setError("Koneksi bermasalah. Sesi evaluasi belum dapat dimulai.");
    } finally {
      if (!signal?.aborted) setStarting(false);
    }
  }, [assessment.id]);

  const submit = useCallback(async () => {
    if (submitting.current) return;
    if (!attemptId) {
      setError("Sesi evaluasi belum siap. Mulai ulang sesi sebelum mengirim jawaban.");
      setAttemptClosed(true);
      return;
    }

    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("assessmentId", assessment.id);
      formData.append("attemptId", attemptId);
      
      const cleanAnswers: Record<string, any> = {};
      for (const [qId, val] of Object.entries(answers)) {
        if (!files[qId] && typeof val === 'string') {
           cleanAnswers[qId] = val;
        } else if (!files[qId]) {
           cleanAnswers[qId] = val;
        }
      }

      const fileEntries = Object.entries(files);
      if (fileEntries.length > 0) {
        const [firstQuestionId, firstFile] = fileEntries[0];
        const firstUpload = await uploadFileDirectly(firstFile, {
          purpose: "assignment",
          assessmentId: assessment.id,
          attemptId,
          questionId: firstQuestionId,
        });

        if (firstUpload.mode === "local") {
          for (const [questionId, file] of fileEntries) {
            formData.append(`file_${questionId}`, file);
            cleanAnswers[questionId] = { fileUrl: true };
          }
        } else {
          const remainingUploads = await Promise.all(fileEntries.slice(1).map(async ([questionId, file]) => {
            const upload = await uploadFileDirectly(file, {
              purpose: "assignment",
              assessmentId: assessment.id,
              attemptId,
              questionId,
            });
            if (upload.mode !== "supabase") {
              throw new Error("Mode penyimpanan berubah selama unggahan. Silakan kirim ulang.");
            }
            return [questionId, upload] as const;
          }));
          const completedUploads = [[firstQuestionId, firstUpload] as const, ...remainingUploads];
          for (const [questionId, upload] of completedUploads) {
            if (!upload.uploadToken) {
              throw new Error("Verifikasi unggahan tidak lengkap. Silakan unggah ulang berkas.");
            }
            cleanAnswers[questionId] = {
              fileUrl: upload.fileUrl,
              uploadToken: upload.uploadToken,
            };
          }
        }
      }
      formData.append("answers", JSON.stringify(cleanAnswers));

      const response = await fetch("/api/assessments/submit", {
        method: "POST",
        body: formData // Using FormData for possible file uploads
      });
      const data = await response.json().catch(() => null) as (QuizResult & { message?: string; code?: string }) | null;
      if (!response.ok || !data) {
        setError(data?.message ?? "Evaluasi belum dapat dikirim. Coba lagi.");
        setAttemptClosed(
          response.status === 410
          || data?.code === "ATTEMPT_EXPIRED"
          || data?.code === "ATTEMPT_NOT_ACTIVE",
        );
        return;
      }
      setResult(data);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Koneksi bermasalah. Evaluasi belum dikirim.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }, [answers, files, assessment.id, attemptId]);

  useEffect(() => {
    const controller = new AbortController();
    void startAttempt(false, controller.signal);
    return () => controller.abort();
  }, [startAttempt]);

  useEffect(() => {
    if (expiresAtMs === null || result || attemptClosed || starting || loading || submitting.current) return;
    
    // Timer 15 detik per soal
    const timer = window.setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attemptClosed, expiresAtMs, result, starting, loading]);

  useEffect(() => {
    if (
      seconds === 0
      && attemptId
      && expiresAtMs !== null
      && !result
      && !starting
      && !loading
      && !attemptClosed
      && !submitting.current
    ) {
      if (current < assessment.questions.length - 1) {
        // Lanjut ke soal berikutnya secara otomatis
        setCurrent(c => c + 1);
        setSeconds(15);
      } else {
        // Submit otomatis jika soal terakhir
        if (!timeoutSubmitted.current) {
          timeoutSubmitted.current = true;
          void submit();
        }
      }
    }
  }, [attemptClosed, attemptId, expiresAtMs, seconds, result, starting, loading, submit, current, assessment.questions.length]);

  function retry() {
    void startAttempt(true);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 20 * 1024 * 1024) {
        setError("Ukuran berkas evaluasi maksimal 20MB.");
        e.target.value = "";
        return;
      }
      setError("");
      setFiles({ ...files, [questionId]: selected });
      setAnswers({ ...answers, [questionId]: { fileUrl: true } });
    }
  };

  if (starting && !attemptId) {
    return (
      <main className="quiz-result pf-quiz-result is-pending" aria-busy="true">
        <LoaderCircle className="spin" aria-hidden="true" />
        <p className="pf-quiz-eyebrow">Menyiapkan sesi evaluasi</p>
        <h1>{assessment.title}</h1>
        <p className="pf-quiz-feedback">Batas waktu sedang disinkronkan dengan server.</p>
      </main>
    );
  }

  if (!attemptId || expiresAtMs === null) {
    return (
      <main className="quiz-result pf-quiz-result is-failed" aria-labelledby="quiz-start-error">
        <XCircle className="pf-quiz-result-mark failed" aria-hidden="true" />
        <p className="pf-quiz-eyebrow">Sesi belum dimulai</p>
        <h1 id="quiz-start-error">{assessment.title}</h1>
        <p className="pf-quiz-feedback">{error || "Sesi evaluasi belum tersedia."}</p>
        <div className="result-actions pf-quiz-result-actions">
          <button type="button" onClick={retry} className="btn btn-primary">
            <RotateCcw aria-hidden="true" /> Coba mulai lagi
          </button>
          <Link href={`/belajar/${assessment.course.slug}`} className="btn btn-outline">
            Kembali ke kelas
          </Link>
        </div>
      </main>
    );
  }

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
        {result.certificateNumber && (
          <Link href={`/sertifikat/${result.certificateNumber}`} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
             Lihat Sertifikat <Award aria-hidden="true" style={{ marginLeft: "8px" }} />
          </Link>
        )}
        {result.questions && !result.needsManualGrading && (
          <button type="button" onClick={() => setShowReview(true)} className={result.certificateNumber ? "btn btn-outline" : "btn btn-primary"}>
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
        const opts = isMultiple ? parseQuestionOptions(q.options) : [];
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
  const options = isMultiple ? parseQuestionOptions(question.options) : [];

  return <div className="quiz-page pf-quiz-page">
    <header className="glass pf-quiz-header">
      <Link href={`/belajar/${assessment.course.slug}`} className="pf-quiz-back-link" aria-label="Kembali ke kelas">
        <ArrowLeft aria-hidden="true" />
      </Link>
      <div className="pf-quiz-title">
        <small>{assessment.course.title}</small>
        <strong>{assessment.title}</strong>
        {assessment.passingScore > 0 && (
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>
            Batas Kelulusan: {assessment.passingScore}
          </span>
        )}
      </div>
      <span className={`pf-quiz-timer ${seconds <= 5 ? "time-warning" : ""}`} role="timer" aria-label={`Sisa waktu ${seconds} detik`}>
        <Clock3 aria-hidden="true" />
        <b>00:{String(seconds).padStart(2, "0")}</b>
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
              <p>PDF, DOC/DOCX, PPT/PPTX, gambar, atau TXT · Maks. 20MB.</p>
            </div>
            <label htmlFor={`file-${question.id}`} className="btn btn-outline pf-quiz-upload-action">Pilih berkas</label>
            <input
              className="pf-quiz-file-input"
              id={`file-${question.id}`}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.txt"
              onChange={(e) => handleFileChange(e, question.id)}
            />
            {files[question.id] && <p className="pf-quiz-selected-file" aria-live="polite">Berkas terpilih: {files[question.id].name}</p>}
          </div>
        )}

      </article>
      {error && <div className="quiz-error pf-quiz-error" role="alert">
        <p>{error}</p>
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={attemptClosed ? retry : () => void submit()}
        >
          {attemptClosed ? "Mulai percobaan baru" : "Kirim ulang"}
        </button>
      </div>}
      <footer className="glass pf-quiz-footer" style={{ justifyContent: "flex-end" }}>
        <small aria-live="polite" style={{ marginRight: "auto" }}>{Object.keys(answers).length} dari {assessment.questions.length} terjawab</small>
        {current < assessment.questions.length - 1
          ? <button type="button" className="btn btn-primary" disabled={loading || attemptClosed} onClick={() => { setCurrent(current + 1); setSeconds(15); }}>
              Berikutnya <ArrowRight aria-hidden="true" />
            </button>
          : <button type="button" className="btn btn-primary" disabled={Object.keys(answers).length < assessment.questions.length || loading || attemptClosed} onClick={() => void submit()}>
              {loading ? <><LoaderCircle className="spin" aria-hidden="true" /> Mengirim</> : <>Kirim jawaban <ArrowRight aria-hidden="true" /></>}
            </button>}
      </footer>
    </main>
  </div>
}
