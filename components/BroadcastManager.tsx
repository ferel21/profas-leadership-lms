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
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="data-card glass-card hover-lift" style={{ marginTop: "1.5rem", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(13, 148, 136, 0.2)" }}>
      <div className="data-title" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.2rem" }}>
        <div style={{ background: "rgba(13, 148, 136, 0.15)", padding: "10px", borderRadius: "12px", color: "var(--teal, #0d9488)" }}>
          <Megaphone size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 700 }}>Pusat Siaran Pengumuman & Notifikasi</h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted, #64748b)" }}>Kirim pesan internal atau pengumuman massal ke seluruh peserta atau kohort program tertentu.</p>
        </div>
      </div>

      {status && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "10px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: status.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: status.type === "success" ? "#059669" : "#dc2626",
          border: `1px solid ${status.type === "success" ? "#a7f3d0" : "#fecaca"}`
        }}>
          {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{status.text}</span>
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: "grid", gap: "14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Target Penerima</label>
            <select
              value={targetCourseId}
              onChange={e => setTargetCourseId(e.target.value)}
              className="form-input"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="ALL">🌐 Seluruh Peserta Platform (Semua Program)</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>📚 Kohort Program: {c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Tautan Aksi / Link Tujuan (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: /belajar/course-id atau https://zoom.us/..."
              value={link}
              onChange={e => setLink(e.target.value)}
              className="form-input"
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700">Judul Pengumuman</label>
          <input
            type="text"
            required
            placeholder="Contoh: Jadwal Live Mentoring Kohort 1 Malam Ini"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 text-slate-700">Pesan / Deskripsi</label>
          <textarea
            required
            rows={3}
            placeholder="Tuliskan pesan lengkap pengumuman untuk peserta..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-teal-600 transition resize-y"
          />
        </div>

        <div className="flex justify-end mt-1">
          <button
            type="submit"
            disabled={loading || !title.trim() || !message.trim()}
            className="btn btn-primary hover-lift flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50 transition"
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
            <span>Siarkan Pengumuman Sekarang</span>
          </button>
        </div>
      </form>
    </div>
  );
}
