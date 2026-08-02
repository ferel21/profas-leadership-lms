"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ForumReplyForm({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/forum/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, content }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Gagal mengirim balasan. Silakan coba lagi.");
        return;
      }
      setContent("");
      router.refresh();
    } catch {
      setError("Gagal mengirim balasan. Periksa koneksi Anda dan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <textarea
        placeholder="Tulis pendapat atau pertanyaan Anda di sini..."
        className="forum-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        minLength={2}
        maxLength={5000}
        required
        disabled={submitting}
      />
      {error && <p className="text-sm text-brand-critical m-0">{error}</p>}
      <button type="submit" className="btn btn-primary self-end" disabled={submitting || content.trim().length < 2}>
        {submitting ? "Mengirim..." : "Kirim Balasan"}
      </button>
    </form>
  );
}
