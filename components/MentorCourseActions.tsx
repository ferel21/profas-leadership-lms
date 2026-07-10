/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Plus, Upload, Loader2, X, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExportReportsButton } from "@/components/ExportReportsButton";

type CourseOption = {
  id: string;
  title: string;
  nodes: { id: string; title: string; type: string }[];
};

export function MentorCourseActions({ courses = [] }: { courses?: CourseOption[] }) {
  const router = useRouter();
  const safeCourses = courses || [];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Kepemimpinan");
  const [level, setLevel] = useState("BASIC");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [duration, setDuration] = useState("10");

  const [selectedCourseId, setSelectedCourseId] = useState(safeCourses[0]?.id || "");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [matTitle, setMatTitle] = useState("");
  const [matLink, setMatLink] = useState("");
  const [matFile, setMatFile] = useState<File | null>(null);

  const selectedCourse = safeCourses.find(c => c.id === selectedCourseId) || safeCourses[0];
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
      setError(err.message || "Terjadi kesalahan saat membuat program");
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
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengunggah materi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition hover-lift shrink-0"
      >
        <Plus size={18} className="shrink-0" />
        <span>Buat Program Baru</span>
      </button>

      <button
        onClick={() => {
          setSelectedCourseId(safeCourses[0]?.id || "");
          setShowUploadModal(true);
        }}
        disabled={safeCourses.length === 0}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/90 border border-slate-200/80 hover:border-teal-600 text-slate-800 hover:text-teal-700 font-bold text-sm shadow-sm hover:shadow transition hover-lift disabled:opacity-50 shrink-0"
      >
        <Upload size={18} className="shrink-0 text-teal-600" />
        <span>Upload Materi Cepat</span>
      </button>

      <ExportReportsButton label="Ekspor Rekap Nilai (.xlsx)" className="font-bold shrink-0" />

      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={20} className="text-teal-600" />
                <span>Buat Program Kepemimpinan Baru</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold mb-4">{error}</div>}

            <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Judul Program *</label>
                <input
                  type="text" required placeholder="Contoh: Strategic Leadership for C-Level"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Kategori</label>
                  <select
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition cursor-pointer"
                  >
                    <option value="Kepemimpinan">Kepemimpinan</option>
                    <option value="Manajemen Strategis">Manajemen Strategis</option>
                    <option value="Inovasi & Teknologi">Inovasi & Teknologi</option>
                    <option value="Pengembangan Diri">Pengembangan Diri</option>
                    <option value="Komunikasi Eksekutif">Komunikasi Eksekutif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tingkat (Level)</label>
                  <select
                    value={level} onChange={e => setLevel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition cursor-pointer"
                  >
                    <option value="BASIC">Dasar (BASIC)</option>
                    <option value="INTERMEDIATE">Menengah (INTERMEDIATE)</option>
                    <option value="ADVANCED">Lanjutan (ADVANCED)</option>
                    <option value="EXECUTIVE">Eksekutif (EXECUTIVE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Deskripsi Singkat</label>
                <textarea
                  rows={2} required placeholder="Jelaskan ringkasan kurikulum dan dampak ke peserta..."
                  value={shortDescription} onChange={e => setShortDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Harga (Rp)</label>
                  <input
                    type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 untuk Gratis"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Durasi (Jam)</label>
                  <input
                    type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition disabled:opacity-50"
                >
                  {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
                  <span>Buat & Buka Builder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload size={20} className="text-teal-600" />
                <span>Upload Materi Cepat</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold mb-4">{error}</div>}

            <form onSubmit={handleUploadMaterial} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pilih Program *</label>
                <select
                  value={selectedCourseId}
                  onChange={e => {
                    setSelectedCourseId(e.target.value);
                    setSelectedLessonId("");
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition cursor-pointer"
                >
                  {safeCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pilih Modul / Folder Tujuan *</label>
                <select
                  required
                  value={selectedLessonId}
                  onChange={e => setSelectedLessonId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition cursor-pointer"
                >
                  <option value="">-- Pilih Modul / Folder --</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                {folders.length === 0 && <small className="text-amber-600 text-xs block mt-1.5 font-medium">Program ini belum memiliki modul FOLDER. Buat modul melalui Course Builder terlebih dahulu.</small>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Judul Materi *</label>
                <input
                  type="text" required value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="Contoh: Slide Presentasi / Video Studi Kasus"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tautan Luar / Video URL (Opsi 1)</label>
                <input
                  type="url" value={matLink} onChange={e => setMatLink(e.target.value)} placeholder="https://youtube.com/... atau https://drive.google.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition"
                />
                <small className="text-slate-400 text-xs mt-1 block">Sangat disarankan untuk serverless / Netlify / Vercel agar tidak membebani penyimpanan sementara.</small>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Unggah Berkas PDF/Doc (Opsi 2)</label>
                <input
                  type="file" onChange={e => setMatFile(e.target.files?.[0] || null)}
                  className="w-full p-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition">Batal</button>
                <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition disabled:opacity-50">
                  {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
                  <span>Unggah Materi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
