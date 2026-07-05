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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tinjauan Jawaban Peserta</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Berikan skor per soal, dan isi feedback keseluruhan.</p>
          </div>
          <button className="btn btn-outline btn-small" onClick={calculateTotalScore}>
            Hitung Skor Otomatis
          </button>
        </div>

        {attempt.answers.map((ans: any, i: number) => {
          const q = ans.question;
          const currentAns = answersScores.find(a => a.questionId === q.id);

          return (
            <div key={ans.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b style={{ fontSize: '1.05rem', color: 'var(--teal-dark)' }}>Soal {i + 1} ({q.type})</b>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Poin Maksimal: {q.points}</span>
              </div>
              <p style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>{q.prompt}</p>

              <div style={{ background: '#f8fbfc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <b style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Jawaban Peserta:</b>
                
                {q.type === 'FILE_UPLOAD' ? (
                  ans.fileUrl ? (
                    <a href={ans.fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-small" style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <Download size={14}/> Unduh Lampiran
                    </a>
                  ) : (
                    <span style={{ color: 'var(--error)' }}>Tidak ada lampiran.</span>
                  )
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{ans.answerText || <span style={{ color:'var(--muted)'}}>(Kosong)</span>}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '120px' }}>
                  <label className="form-label">Beri Skor</label>
                  <input type="number" max={q.points} min={0} className="form-input" style={{ width: '100%' }} value={currentAns?.score || 0} onChange={(e) => updateAnswerScore(q.id, 'score', parseInt(e.target.value) || 0)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Komentar / Feedback Spesifik (Opsional)</label>
                  <input type="text" className="form-input" style={{ width: '100%' }} placeholder="Catatan untuk soal ini..." value={currentAns?.feedback || ""} onChange={(e) => updateAnswerScore(q.id, 'feedback', e.target.value)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Penilaian Akhir & Keputusan</h2>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ width: '150px' }}>
            <label className="form-label">Nilai Akhir (0-100)</label>
            <input type="number" className="form-input" style={{ width: '100%', fontSize: '1.5rem', fontWeight: 'bold' }} value={score} onChange={(e) => setScore(parseInt(e.target.value)||0)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">Feedback Keseluruhan</label>
            <textarea className="form-input" style={{ width: '100%', minHeight: '60px' }} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tuliskan umpan balik yang membangun untuk peserta..."></textarea>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button className="btn btn-outline" onClick={() => saveGrade(false)} disabled={saving} style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
            <XCircle size={16}/> {saving ? "Loading..." : "Gagalkan"}
          </button>
          <button className="btn btn-primary" onClick={() => saveGrade(true)} disabled={saving}>
            <CheckCircle size={16}/> {saving ? "Loading..." : "Luluskan & Selesai"}
          </button>
        </div>
      </div>
    </div>
  );
}
