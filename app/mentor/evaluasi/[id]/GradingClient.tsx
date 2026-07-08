/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { CheckCircle, Save, XCircle, FileText, Download } from "lucide-react";
import Link from "next/link";

export function GradingClient({ attempt }: { attempt: any }) {
  const [score, setScore] = useState(attempt.score || 0);
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

  const calculateTotalScore = () => {
    const maxScore = attempt.assessment.questions?.reduce((acc: number, q: any) => acc + (q.points || 10), 0) || 100;
    const earned = answersScores.reduce((acc: number, a: any) => acc + (a.score || 0), 0);
    const normalized = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;
    setScore(normalized);
  };

  const saveGrade = async (passed: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/mentor/evaluations/${attempt.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, feedback, passed, answersScores })
      });
      if (res.ok) {
        alert("Penilaian berhasil disimpan!");
        window.location.href = "/mentor/evaluasi";
      } else {
        alert("Gagal menyimpan.");
      }
    } catch {
      alert("Error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 m-0">Tinjauan Jawaban Peserta</h2>
            <p className="text-slate-500 text-sm mt-1 mb-0">Berikan skor per soal, dan isi feedback keseluruhan.</p>
          </div>
          <button className="btn btn-outline btn-small" onClick={calculateTotalScore}>
            Hitung Skor Otomatis
          </button>
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
                    <span className="text-red-500 font-medium">Tidak ada lampiran.</span>
                  )
                ) : (
                  <div className="whitespace-pre-wrap text-slate-700">{ans.answerText || <span className="text-slate-400 italic">(Kosong)</span>}</div>
                )}
              </div>

              <div className="flex gap-4 items-center flex-wrap">
                <div className="w-32">
                  <label className="form-label text-xs font-semibold">Beri Skor</label>
                  <input type="number" max={q.points} min={0} className="form-input w-full" value={currentAns?.score || 0} onChange={(e) => updateAnswerScore(q.id, 'score', parseInt(e.target.value) || 0)} />
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
            <input type="number" className="form-input w-full text-2xl font-bold text-center text-primary" value={score} onChange={(e) => setScore(parseInt(e.target.value)||0)} />
          </div>
          <div className="flex-1 min-w-[250px]">
            <label className="form-label text-xs font-semibold">Feedback Keseluruhan</label>
            <textarea className="form-input w-full min-h-[60px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tuliskan umpan balik yang membangun untuk peserta..."></textarea>
          </div>
        </div>

        <div className="flex gap-4 justify-end mt-8 flex-wrap">
          <button className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => saveGrade(false)} disabled={saving}>
            <XCircle size={16}/> {saving ? "Loading..." : "Gagalkan"}
          </button>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => saveGrade(true)} disabled={saving}>
            <CheckCircle size={16}/> {saving ? "Loading..." : "Luluskan & Selesai"}
          </button>
        </div>
      </div>
    </div>
  );
}
