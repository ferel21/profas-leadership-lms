"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Film, Image as ImageIcon, Link2, Upload, X, FileUp, Loader2, Trash2, CheckCircle2 } from "lucide-react";

type Lesson = { id: string; title: string; moduleTitle: string };
type MaterialItem = { id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number; description: string | null; createdAt: string; lesson: { title: string; module: { title: string; course: { title: string; slug: string } } } };

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function typeIcon(type: string) {
  switch (type) {
    case "PDF": case "DOCUMENT": case "TEXT": return <FileText />;
    case "VIDEO": return <Film />;
    case "IMAGE": return <ImageIcon />;
    case "LINK": return <Link2 />;
    default: return <FileUp />;
  }
}

function typeBadgeClass(type: string) {
  return `material-type-badge badge-${type.toLowerCase()}`;
}

export function MaterialUpload({ lessons, onUploaded }: { lessons: Lesson[]; courseId?: string; onUploaded?: () => void }) {
  const [dragover, setDragover] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setMode("file"); }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) { setFile(selected); setMode("file"); }
  };

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonId) { setMessage({ type: "error", text: "Pilih materi tujuan." }); return; }
    if (mode === "file" && !file) { setMessage({ type: "error", text: "Pilih file untuk diunggah." }); return; }
    if (mode === "link" && !linkUrl.trim()) { setMessage({ type: "error", text: "Masukkan URL." }); return; }

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("lessonId", lessonId);
      formData.append("description", description);
      if (mode === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("linkUrl", linkUrl);
      }

      const res = await fetch("/api/materials/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { message?: string } | null;
        setMessage({ type: "error", text: data?.message ?? "Gagal mengunggah materi." });
        setUploading(false);
        return;
      }
      setMessage({ type: "success", text: "Materi berhasil diunggah!" });
      setFile(null);
      setLinkUrl("");
      setDescription("");
      if (inputRef.current) inputRef.current.value = "";
      onUploaded?.();
    } catch {
      setMessage({ type: "error", text: "Koneksi bermasalah. Coba lagi." });
    }
    setUploading(false);
  }

  return (
    <div className="upload-section">
      <div className="upload-mode-tabs">
        <button className={mode === "file" ? "active" : ""} onClick={() => setMode("file")} type="button">
          <FileUp /> Unggah File
        </button>
        <button className={mode === "link" ? "active" : ""} onClick={() => setMode("link")} type="button">
          <Link2 /> Tambah Link
        </button>
      </div>

      <form onSubmit={handleUpload} className="upload-form">
        {mode === "file" && (
          <div
            className={`upload-zone ${dragover ? "dragover" : ""} ${file ? "has-file" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Pilih atau seret file"
          >
            <input
              ref={inputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
              hidden
            />
            {file ? (
              <div className="upload-preview-item">
                {typeIcon(file.type.startsWith("image") ? "IMAGE" : file.type.includes("pdf") ? "PDF" : file.type.startsWith("video") ? "VIDEO" : "DOCUMENT")}
                <div>
                  <b>{file.name}</b>
                  <small>{formatFileSize(file.size)}</small>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }} aria-label="Hapus file">
                  <X />
                </button>
              </div>
            ) : (
              <div className="upload-zone-content">
                <span className="upload-zone-icon"><Upload /></span>
                <p className="upload-zone-text">
                  <b>Seret file ke sini</b> atau klik untuk memilih
                </p>
                <small>PDF, Gambar, Video, Dokumen • Maks. 50MB</small>
              </div>
            )}
          </div>
        )}

        {mode === "link" && (
          <div className="upload-link-input">
            <Link2 />
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://contoh.com/materi-pembelajaran"
              required={mode === "link"}
            />
          </div>
        )}

        <div className="upload-fields">
          <label>
            <span>Materi Tujuan</span>
            <select value={lessonId} onChange={e => setLessonId(e.target.value)} required>
              <option value="">Pilih materi...</option>
              {lessons.map(l => (
                <option key={l.id} value={l.id}>{l.moduleTitle} → {l.title}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Deskripsi (opsional)</span>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Catatan tentang materi ini..."
              maxLength={200}
            />
          </label>
        </div>

        {message && (
          <p className={`upload-message ${message.type}`} role="alert">
            {message.type === "success" ? <CheckCircle2 /> : null}
            {message.text}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={uploading || (!file && mode === "file") || (!linkUrl && mode === "link")}>
          {uploading ? <><Loader2 className="spin" /> Mengunggah...</> : <><Upload /> Unggah Materi</>}
        </button>
      </form>
    </div>
  );
}

export function MaterialList({ materials, canDelete, onDelete }: { materials: MaterialItem[]; canDelete?: boolean; onDelete?: (id: string) => void }) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/materials?id=${id}`, { method: "DELETE" });
      if (res.ok) onDelete?.(id);
    } catch { /* ignore */ }
    setDeleting(null);
  }

  if (materials.length === 0) {
    return <p className="material-empty">Belum ada materi yang diunggah.</p>;
  }

  return (
    <div className="material-list">
      {materials.map(m => (
        <div key={m.id} className="material-card">
          <span className="material-icon">{typeIcon(m.fileType)}</span>
          <div className="material-info">
            <b>{m.fileName}</b>
            <small>
              <span className={typeBadgeClass(m.fileType)}>{m.fileType}</span>
              {m.fileSize > 0 && ` • ${formatFileSize(m.fileSize)}`}
              {m.description && ` • ${m.description}`}
            </small>
            <small className="material-meta">
              {m.lesson.module.title} → {m.lesson.title}
            </small>
          </div>
          <div className="material-actions">
            {m.fileType === "LINK" ? (
              <a href={m.fileUrl} target="_blank" rel="noreferrer" className="btn btn-small btn-outline">Buka</a>
            ) : (
              <a href={m.fileUrl} download className="btn btn-small btn-outline">Unduh</a>
            )}
            {canDelete && (
              <button
                className="btn btn-small btn-danger"
                onClick={() => handleDelete(m.id)}
                disabled={deleting === m.id}
                aria-label={`Hapus ${m.fileName}`}
              >
                {deleting === m.id ? <Loader2 className="spin" /> : <Trash2 />}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
