"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";

type ForumCategoryOption = {
  id: string;
  name: string;
  description: string | null;
};

export function ForumThreadForm({ categories }: { categories: ForumCategoryOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, categoryId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Diskusi belum dapat dibuat.");
      }
      router.push(`/forum/${data.id}`);
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Diskusi belum dapat dibuat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="pf-forum-create-form" onSubmit={submitThread}>
      <div className="pf-form-field">
        <label htmlFor="forum-category">Kategori</label>
        <select
          id="forum-category"
          value={categoryId}
          onChange={event => setCategoryId(event.target.value)}
          disabled={submitting || categories.length === 0}
          required
        >
          {categories.map(category => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.find(category => category.id === categoryId)?.description && (
          <small>{categories.find(category => category.id === categoryId)?.description}</small>
        )}
      </div>

      <div className="pf-form-field">
        <label htmlFor="forum-title">Judul diskusi</label>
        <input
          id="forum-title"
          value={title}
          onChange={event => setTitle(event.target.value)}
          minLength={5}
          maxLength={120}
          placeholder="Tuliskan topik yang ingin dibahas"
          disabled={submitting}
          required
        />
      </div>

      <div className="pf-form-field">
        <label htmlFor="forum-content">Isi diskusi</label>
        <textarea
          id="forum-content"
          value={content}
          onChange={event => setContent(event.target.value)}
          minLength={10}
          maxLength={10000}
          rows={9}
          placeholder="Berikan konteks, pertanyaan, atau insight agar diskusi mudah diikuti."
          disabled={submitting}
          required
        />
        <small>{content.length.toLocaleString("id-ID")} / 10.000 karakter</small>
      </div>

      {error && <p className="pf-form-error" role="alert">{error}</p>}

      <div className="pf-form-actions">
        <button type="button" className="btn btn-outline" onClick={() => router.back()} disabled={submitting}>
          Batal
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting || categories.length === 0}>
          {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MessageSquare aria-hidden="true" />}
          {submitting ? "Menerbitkan..." : "Terbitkan diskusi"}
        </button>
      </div>
    </form>
  );
}
