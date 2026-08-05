/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Plus, Upload, Loader2, X, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { ExportReportsButton } from "@/components/shared/ExportReportsButton";
import { uploadFileDirectly } from "@/utils/direct-upload";

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
          shortDescription: shortDescription || "Deskripsi singkat program",
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
      if (matFile) {
        const direct = await uploadFileDirectly(matFile, {
          purpose: "material",
          courseId: selectedCourseId,
          lessonId: selectedLessonId,
          description: matTitle,
        });
        if (direct.mode === "local") {
          const formData = new FormData();
          formData.append("courseId", selectedCourseId);
          formData.append("lessonId", selectedLessonId);
          formData.append("description", matTitle);
          formData.append("file", matFile);
          const response = await fetch("/api/materials/upload", { method: "POST", body: formData });
          const data = await response.json().catch(() => null) as { message?: string } | null;
          if (!response.ok) throw new Error(data?.message || "Gagal mengunggah materi");
        }
      } else {
        const formData = new FormData();
        formData.append("courseId", selectedCourseId);
        formData.append("lessonId", selectedLessonId);
        formData.append("description", matTitle);
        if (matLink) formData.append("linkUrl", matLink);
        const response = await fetch("/api/materials/upload", { method: "POST", body: formData });
        const data = await response.json().catch(() => null) as { message?: string } | null;
        if (!response.ok) throw new Error(data?.message || "Gagal menambahkan materi");
      }

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
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold text-sm shadow-md shadow-brand-blue/15 hover:shadow-lg transition hover-lift shrink-0"
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
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/90 border border-slate-200/80 hover:border-brand-green text-slate-800 hover:text-brand-green-dark font-bold text-sm shadow-sm hover:shadow transition hover-lift disabled:opacity-50 shrink-0"
      >
        <Upload size={18} className="shrink-0 text-brand-green" />
        <span>Upload Materi Cepat</span>
      </button>

      <ExportReportsButton label="Ekspor Rekap Nilai (.xlsx)" className="font-bold shrink-0" loadLatest />

      {showCreateModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={20} className="text-brand-blue" />
                <span>Buat Program Kepemimpinan Baru</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            {error && <div className="p-3 bg-brand-critical-soft border border-brand-critical/30 text-brand-critical rounded-xl text-xs font-semibold mb-4">{error}</div>}

            <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Judul Program *</label>
                <input
                  type="text" required placeholder="Contoh: Strategic Leadership for C-Level"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition"
                />
              </div>

              {/* Input disederhanakan: hanya judul program. Sisanya menggunakan nilai default */}

              <div className="flex justify-end gap-2.5 mt-3 pt-3 border-t border-slate-100">
                <button
                  type="button" onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold text-xs shadow-md shadow-brand-blue/15 flex items-center gap-2 transition disabled:opacity-50"
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
                <Upload size={20} className="text-brand-green" />
                <span>Upload Materi Cepat</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 transition">
                <X size={20} />
              </button>
            </div>

            {error && <div className="p-3 bg-brand-critical-soft border border-brand-critical/30 text-brand-critical rounded-xl text-xs font-semibold mb-4">{error}</div>}

            <form onSubmit={handleUploadMaterial} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pilih Program *</label>
                <select
                  value={selectedCourseId}
                  onChange={e => {
                    setSelectedCourseId(e.target.value);
                    setSelectedLessonId("");
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition cursor-pointer"
                >
                  <option value="">-- Pilih Modul / Folder --</option>
                  {folders.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                </select>
                {folders.length === 0 && <small className="text-brand-blue-dark text-xs block mt-1.5 font-medium">Program ini belum memiliki modul FOLDER. Buat modul melalui Course Builder terlebih dahulu.</small>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Judul Materi *</label>
                <input
                  type="text" required value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="Contoh: Slide Presentasi / Video Studi Kasus"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tautan Luar / Video URL (Opsi 1)</label>
                <input
                  type="url" value={matLink} onChange={e => setMatLink(e.target.value)} placeholder="https://youtube.com/... atau https://drive.google.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition"
                />
                <small className="text-slate-400 text-xs mt-1 block">Sangat disarankan untuk deployment serverless / Vercel agar tidak membebani penyimpanan sementara.</small>
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
                <button type="submit" disabled={loading} className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-blue-dark to-brand-blue hover:from-brand-blue hover:to-brand-blue-dark text-white font-bold text-xs shadow-md shadow-brand-blue/15 flex items-center gap-2 transition disabled:opacity-50">
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
