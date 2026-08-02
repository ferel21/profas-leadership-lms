/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { CheckCircle, Save, XCircle, Download } from "lucide-react";

export function GradingClient({ attempt }: { attempt: any }) {
  const [feedback, setFeedback] = useState(attempt.feedback || "");
  const [saving, setSaving] = useState(false);

  // Per-question scores
  const [answersScores, setAnswersScores] = useState<any[]>(attempt.answers.map((ans: any) => ({
    questionId: ans.questionId,
    score: ans.score || 0,
    feedback: ans.feedback || ""
  })));

  const updateAnswerScore = (questionId: string, field: string, value: any) => {
    setAnswersScores(prev => prev.map(a => a.questionId === questionId ? { ...a, [field]: value } : a));
  };

  const maxScore = attempt.assessment.questions.reduce((acc: number, q: any) => acc + q.points, 0);
  const score = attempt.answers.length > 0 && maxScore > 0
    ? Math.round((answersScores.reduce((acc: number, a: any) => acc + (Number(a.score) || 0), 0) / maxScore) * 100)
    : Math.max(0, Math.min(100, Number(attempt.score) || 0));
  const passingScore = attempt.assessment.passingScore;
  const willPass = attempt.assessment.type === "PRETEST" || score >= passingScore;

  const saveGrade = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/mentor/evaluations/${attempt.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, feedback, answersScores })
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        alert(result?.error || "Gagal menyimpan penilaian.");
        return;
      }
      alert(`Penilaian berhasil disimpan. Status: ${result.passed ? "Lulus" : "Belum lulus"}.`);
      window.location.href = "/mentor/evaluasi";
    } catch {
      alert("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const clampQuestionScore = (questionId: string, rawValue: string, maxPoints: number) => {
    const nextValue = Math.max(0, Math.min(maxPoints, Number.parseInt(rawValue, 10) || 0));
    updateAnswerScore(questionId, "score", nextValue);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">Tinjauan Jawaban Peserta</h2>
            <p className="text-slate-500 text-sm mt-1 mb-0">Berikan skor per soal, dan isi feedback keseluruhan.</p>
          </div>
          <span className="meta-badge">Skor otomatis: {score}</span>
        </div>

        {attempt.answers.map((ans: any, i: number) => {
          const q = ans.question;
          const currentAns = answersScores.find(a => a.questionId === q.id);

          return (
            <div key={ans.id} className="border-b border-slate-200 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
              <div className="flex justify-between items-center mb-2">
                <b className="text-lg text-primary">Soal {i + 1} ({q.type})</b>
                <span className="text-sm text-slate-500">Poin Maksimal: {q.points}</span>
              </div>
              <p className="mt-2 mb-4 text-slate-800 font-medium">{q.prompt}</p>

              <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                <b className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Jawaban Peserta:</b>
                
                {q.type === 'FILE_UPLOAD' ? (
                  ans.fileUrl ? (
                    <a href={ans.fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-small inline-flex gap-2">
                      <Download size={14}/> Unduh Lampiran
                    </a>
                  ) : (
                    <span className="text-brand-critical font-medium">Tidak ada lampiran.</span>
                  )
                ) : (
                  <div className="whitespace-pre-wrap text-slate-700">{ans.answerText || <span className="text-slate-400 italic">(Kosong)</span>}</div>
                )}
              </div>

              <div className="flex gap-4 items-center flex-wrap">
                <div className="w-32">
                  <label className="form-label text-xs font-semibold">Beri Skor</label>
                  <input
                    type="number"
                    max={q.points}
                    min={0}
                    className="form-input w-full"
                    value={currentAns?.score || 0}
                    onChange={(e) => clampQuestionScore(q.id, e.target.value, q.points)}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="form-label text-xs font-semibold">Komentar / Feedback Spesifik (Opsional)</label>
                  <input type="text" className="form-input w-full" placeholder="Catatan untuk soal ini..." value={currentAns?.feedback || ""} onChange={(e) => updateAnswerScore(q.id, 'feedback', e.target.value)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-slate-900">Penilaian Akhir & Keputusan</h2>
        
        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="w-36">
            <label className="form-label text-xs font-semibold">Nilai Akhir (0-100)</label>
            <output className="form-input w-full text-2xl font-bold text-center text-primary block">{score}</output>
          </div>
          <div className="flex-1 min-w-[250px]">
            <label className="form-label text-xs font-semibold">Feedback Keseluruhan</label>
            <textarea className="form-input w-full min-h-[60px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tuliskan umpan balik yang membangun untuk peserta..."></textarea>
          </div>
        </div>

        <div className={`rounded-xl border p-4 mt-6 flex gap-3 items-start ${willPass ? "border-brand-green bg-brand-green-soft text-brand-green-dark" : "border-brand-blue bg-brand-blue-soft text-brand-blue-dark"}`}>
          {willPass ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <XCircle size={20} className="shrink-0 mt-0.5" />}
          <div>
            <strong>{willPass ? "Akan dinyatakan lulus" : "Belum memenuhi nilai kelulusan"}</strong>
            <p className="m-0 text-sm">
              {attempt.assessment.type === "PRETEST"
                ? "Pre-test selalu dicatat sebagai selesai setelah dinilai."
                : `Keputusan mengikuti nilai minimum ${passingScore}.`}
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button className="btn btn-primary flex items-center gap-2" onClick={saveGrade} disabled={saving}>
            <Save size={16}/> {saving ? "Menyimpan..." : "Simpan Penilaian"}
          </button>
        </div>
      </div>
    </div>
  );
}
