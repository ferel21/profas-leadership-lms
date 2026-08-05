"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type JoinResult = {
  startsAt: string;
  course: { slug: string; title: string };
  cohort: { name: string };
};

function formatCode(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
}

export function JoinCohortCard() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<JoinResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code) return;
    setLoading(true);
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/cohorts/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Kode akses belum dapat diproses.");
      setResult(data as JoinResult);
      setCode("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kode akses belum dapat diproses.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pf-cohort-join-card" aria-labelledby="cohort-code-title">
      <div className="pf-cohort-join-icon"><KeyRound aria-hidden="true" /></div>
      <div className="pf-cohort-join-copy">
        <span>Akses undangan</span>
        <h2 id="cohort-code-title">Punya kode akses?</h2>
        <p>Masukkan kode dari admin atau mentor untuk bergabung ke ruang belajar organisasi Anda.</p>
      </div>
      <form className="pf-cohort-code-form" onSubmit={submit}>
        <label htmlFor="dashboard-cohort-code" className="sr-only">Kode akses kohort</label>
        <input
          id="dashboard-cohort-code"
          value={code}
          onChange={(event) => setCode(formatCode(event.target.value))}
          placeholder="XXXX-XXXX-XXXX"
          autoComplete="one-time-code"
          inputMode="text"
          maxLength={14}
          aria-describedby={message ? "dashboard-cohort-code-message" : undefined}
        />
        <button type="submit" disabled={loading || code.replace(/-/g, "").length < 6}>
          {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          <span>{loading ? "Memeriksa…" : "Aktifkan"}</span>
        </button>
      </form>
      {message && <p id="dashboard-cohort-code-message" className="pf-cohort-feedback is-error" role="alert">{message}</p>}
      {result && (
        <div className="pf-cohort-feedback is-success" role="status">
          <CheckCircle2 aria-hidden="true" />
          <span>
            <strong>{result.course.title}</strong> melalui {result.cohort.name} berhasil ditambahkan.
          </span>
          <button type="button" onClick={() => router.push(`/belajar/${result.course.slug}`)}>
            Buka program <ArrowRight aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
