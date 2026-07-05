"use client";

import { useState } from "react";
import { Plus, Trash2, Save, HelpCircle, FileText, CheckCircle, Type, UploadCloud } from "lucide-react";

export function AssessmentEditorClient({ assessment, courseId }: { assessment: any, courseId: string }) {
  const [questions, setQuestions] = useState<any[]>(assessment.questions || []);
  const [saving, setSaving] = useState(false);

  const handleAddQuestion = (type: string) => {
    setQuestions([
      ...questions,
      {
        id: `temp_${Date.now()}`,
        type,
        prompt: "",
        options: type === "MULTIPLE_CHOICE" ? JSON.stringify(["", ""]) : null,
        correctAnswer: "",
        points: 10,
        explanation: "",
      }
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQ = [...questions];
    const opts = JSON.parse(newQ[qIndex].options || "[]");
    opts[optIndex] = value;
    newQ[qIndex].options = JSON.stringify(opts);
    setQuestions(newQ);
  };

  const addOption = (qIndex: number) => {
    const newQ = [...questions];
    const opts = JSON.parse(newQ[qIndex].options || "[]");
    opts.push("");
    newQ[qIndex].options = JSON.stringify(opts);
    setQuestions(newQ);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      // Very simple save loop for newly added or updated items
      // In a robust implementation you'd use a single PUT endpoint, but here we'll assume we can call POST for each temp
      // Just showing a concept because user wants full functionality. Let's make an API call to save everything.
      
      const res = await fetch(`/api/mentor/assessments/${assessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
      });
      if (res.ok) {
        alert("Berhasil disimpan!");
      } else {
        alert("Gagal menyimpan");
      }
    } catch (e) {
      alert("Error saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--line)' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Daftar Soal / Instruksi</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Atur pertanyaan atau instruksi tugas di bawah ini.</p>
        </div>
        <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
          {saving ? "Menyimpan..." : <><Save size={16}/> Simpan Perubahan</>}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map((q, qIndex) => (
          <div key={q.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {q.type === 'MULTIPLE_CHOICE' && <CheckCircle size={16} color="var(--teal)"/>}
                {q.type === 'ESSAY' && <FileText size={16} color="var(--teal)"/>}
                {q.type === 'FILE_UPLOAD' && <UploadCloud size={16} color="var(--teal)"/>}
                {q.type === 'SHORT_ANSWER' && <Type size={16} color="var(--teal)"/>}
                Soal {qIndex + 1} ({q.type})
              </h3>
              <button className="btn btn-ghost btn-small" onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))} style={{ color: 'var(--error)' }}>
                <Trash2 size={16}/>
              </button>
            </div>

            <label className="form-label">Pertanyaan / Instruksi</label>
            <textarea 
              className="form-input" 
              style={{ width: '100%', marginBottom: '1rem', minHeight: '80px' }} 
              value={q.prompt} 
              onChange={(e) => updateQuestion(qIndex, 'prompt', e.target.value)}
              placeholder="Tuliskan instruksi atau pertanyaan..."
            />

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Poin (Bobot Nilai)</label>
                <input type="number" className="form-input" style={{ width: '100%' }} value={q.points} onChange={e => updateQuestion(qIndex, 'points', parseInt(e.target.value)||0)} />
              </div>
            </div>

            {q.type === 'MULTIPLE_CHOICE' && (
              <div style={{ background: '#f8fbfc', padding: '1rem', borderRadius: '8px' }}>
                <label className="form-label">Pilihan Jawaban</label>
                {JSON.parse(q.options || "[]").map((opt: string, optIndex: number) => (
                  <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="radio" 
                      name={`correct_${qIndex}`} 
                      checked={q.correctAnswer === String(optIndex)} 
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', String(optIndex))}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ flex: 1 }} 
                      value={opt} 
                      onChange={e => updateOption(qIndex, optIndex, e.target.value)} 
                      placeholder={`Opsi ${optIndex + 1}`}
                    />
                  </div>
                ))}
                <button className="btn btn-outline btn-small" onClick={() => addOption(qIndex)} style={{ marginTop: '0.5rem' }}>+ Tambah Pilihan</button>
              </div>
            )}

            {q.type === 'SHORT_ANSWER' && (
              <div style={{ background: '#f8fbfc', padding: '1rem', borderRadius: '8px' }}>
                <label className="form-label">Jawaban Benar (Kunci)</label>
                <input type="text" className="form-input" style={{ width: '100%' }} value={q.correctAnswer || ""} onChange={e => updateQuestion(qIndex, 'correctAnswer', e.target.value)} placeholder="Kata kunci jawaban yang benar" />
              </div>
            )}

            {(q.type === 'ESSAY' || q.type === 'FILE_UPLOAD') && (
              <div style={{ padding: '0.5rem', background: '#fff5e7', color: '#a76825', borderRadius: '8px', fontSize: '0.9rem' }}>
                Soal ini akan masuk ke mode penilaian manual (Menunggu Nilai Mentor).
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn btn-outline glass" onClick={() => handleAddQuestion('MULTIPLE_CHOICE')}><Plus size={16}/> Pilihan Ganda</button>
        <button className="btn btn-outline glass" onClick={() => handleAddQuestion('SHORT_ANSWER')}><Plus size={16}/> Isian Singkat</button>
        <button className="btn btn-outline glass" onClick={() => handleAddQuestion('ESSAY')}><Plus size={16}/> Essay</button>
        <button className="btn btn-outline glass" onClick={() => handleAddQuestion('FILE_UPLOAD')}><Plus size={16}/> Upload File</button>
      </div>
    </div>
  );
}
