/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Send, Megaphone, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type CourseOption = { id: string; title: string };

export function BroadcastManager({ courses = [] }: { courses?: CourseOption[] }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetCourseId, setTargetCourseId] = useState("ALL");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const safeCourses = courses || [];

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, targetCourseId, link })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengirim pengumuman.");

      setStatus({ type: "success", text: data.message });
      setTitle("");
      setMessage("");
      setLink("");
    } catch (err: any) {
      setStatus({ type: "error", text: err.message || "Terjadi kesalahan sistem saat menyiarkan pengumuman." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="data-card mt-8 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-[0_10px_30px_-10px_rgba(13,148,136,0.08)]">
      <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
        <div className="bg-teal-500/10 p-2.5 rounded-xl text-teal-600 shrink-0">
          <Megaphone size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pusat Siaran Pengumuman & Notifikasi</h2>
          <p className="text-sm text-slate-500 mt-1">Kirim pesan internal atau pengumuman massal ke seluruh peserta atau kohort program tertentu.</p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 font-medium border ${
          status.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {status.type === "success" ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertTriangle size={18} className="text-rose-600 shrink-0" />}
          <span>{status.text}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Penerima</label>
            <select
              value={targetCourseId}
              onChange={e => setTargetCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition cursor-pointer"
            >
              <option value="ALL">🌐 Seluruh Peserta Platform (Semua Program)</option>
              {safeCourses.map(c => (
                <option key={c.id} value={c.id}>📚 Kohort Program: {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Tautan Tujuan / Link Aksi (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: /belajar/course-id atau https://zoom.us/..."
              value={link}
              onChange={e => setLink(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Judul Pengumuman</label>
          <input
            type="text"
            required
            placeholder="Contoh: Jadwal Live Mentoring Kohort 1 Malam Ini"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Pesan / Deskripsi</label>
          <textarea
            required
            rows={3}
            placeholder="Tuliskan pesan lengkap pengumuman untuk peserta..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition resize-y leading-relaxed"
          />
        </div>

        <div className="flex justify-end mt-2 pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading || !title.trim() || !message.trim()}
            className="btn btn-primary hover-lift flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition"
          >
            {loading ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Send size={16} className="shrink-0" />}
            <span>Siarkan Pengumuman Sekarang</span>
          </button>
        </div>
      </form>
    </div>
  );
}
