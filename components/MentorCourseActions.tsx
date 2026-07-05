/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Plus, Upload, Loader2, X, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

type CourseOption = {
  id: string;
  title: string;
  nodes: { id: string; title: string; type: string }[];
};

export function MentorCourseActions({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create Course Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Kepemimpinan");
  const [level, setLevel] = useState("BASIC");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [duration, setDuration] = useState("10");

  // Upload Material Form State
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [matTitle, setMatTitle] = useState("");
  const [matLink, setMatLink] = useState("");
  const [matFile, setMatFile] = useState<File | null>(null);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const folders = selectedCourse?.nodes.filter(n => n.type === "FOLDER") || [];

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/mentor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          level,
          shortDescription,
          price: Number(price) || 0,
          durationHours: Number(duration) || 10
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat program");

      setShowCreateModal(false);
      router.refresh();
      if (data.course?.id) {
        router.push(`/mentor/courses/${data.course.id}/builder`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonId) {
      setError("Silakan pilih modul/lesson tujuan terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("lessonId", selectedLessonId);
      formData.append("description", matTitle);
      if (matLink) formData.append("linkUrl", matLink);
      if (matFile) formData.append("file", matFile);

      const res = await fetch("/api/materials/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengunggah materi");

      setShowUploadModal(false);
      setMatTitle("");
      setMatLink("");
      setMatFile(null);
      router.refresh();
      alert("Materi berhasil ditambahkan!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
      <button
        onClick={() => setShowCreateModal(true)}
        className="btn btn-primary hover-lift"
        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontSize: "14px", borderRadius: "10px" }}
      >
        <Plus size={18} /> Buat Program Baru
      </button>

      <button
        onClick={() => {
          if (courses.length === 0) {
            alert("Buat program terlebih dahulu sebelum mengunggah materi.");
            return;
          }
          setShowUploadModal(true);
        }}
        className="btn btn-outline hover-lift"
        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", fontSize: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.8)" }}
      >
        <Upload size={18} /> Upload Materi Cepat
      </button>

      {/* MODAL BUAT PROGRAM BARU */}
      {showCreateModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="glass hover-lift" style={{ background: "#fff", padding: "28px", borderRadius: "20px", maxWidth: "500px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "var(--teal-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
                <BookOpen size={22} /> Buat Program Baru
              </h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={24} />
              </button>
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

            <form onSubmit={handleCreateCourse} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Judul Program Kepemimpinan *</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Strategic Leadership in Digital Era" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Kategori</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                    <option value="Kepemimpinan">Kepemimpinan</option>
                    <option value="Manajemen Strategis">Manajemen Strategis</option>
                    <option value="Inovasi & Transformasi">Inovasi & Transformasi</option>
                    <option value="Komunikasi Eksekutif">Komunikasi Eksekutif</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Tingkat (Level)</label>
                  <select value={level} onChange={e => setLevel(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                    <option value="BASIC">Basic</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Deskripsi Singkat *</label>
                <textarea required rows={3} value={shortDescription} onChange={e => setShortDescription(e.target.value)} placeholder="Jelaskan intisari program dan manfaat utama bagi eksekutif..." style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Harga (Rp)</label>
                  <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 untuk Gratis" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Durasi (Jam)</label>
                  <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {loading && <Loader2 size={16} className="animate-spin" />} Buat & Buka Builder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD MATERI CEPAT */}
      {showUploadModal && (
        <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div className="glass hover-lift" style={{ background: "#fff", padding: "28px", borderRadius: "20px", maxWidth: "500px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "20px", color: "var(--teal-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Upload size={22} /> Upload Materi Cepat
              </h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={24} />
              </button>
            </div>

            {error && <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{error}</div>}

            <form onSubmit={handleUploadMaterial} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Pilih Program *</label>
                <select
                  value={selectedCourseId}
                  onChange={e => {
                    setSelectedCourseId(e.target.value);
                    setSelectedLessonId("");
                  }}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }}
                >
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Pilih Modul / Lesson Tujuan *</label>
                <select
                  required
                  value={selectedLessonId}
                  onChange={e => setSelectedLessonId(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }}
                >
                  <option value="">-- Pilih Modul / Folder --</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                {folders.length === 0 && <small style={{ color: "#d97706", display: "block", marginTop: "4px" }}>Program ini belum memiliki modul FOLDER. Buat modul melalui Course Builder terlebih dahulu.</small>}
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Judul Materi *</label>
                <input type="text" required value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="e.g. Slide Presentasi / Video Kasus" style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Tautan Luar / Video URL (Opsi 1)</label>
                <input type="url" value={matLink} onChange={e => setMatLink(e.target.value)} placeholder="https://youtube.com/... atau https://drive.google.com/..." style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)" }} />
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>Sangat disarankan untuk serverless Vercel agar tidak membebani penyimpanan sementara.</small>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>Unggah Berkas PDF/Doc (Opsi 2)</label>
                <input type="file" onChange={e => setMatFile(e.target.files?.[0] || null)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px dashed var(--line)", background: "#f8fafc" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {loading && <Loader2 size={16} className="animate-spin" />} Unggah Materi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
