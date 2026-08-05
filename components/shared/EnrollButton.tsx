"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type EnrollButtonProps = {
  courseId: string;
  slug: string;
  signedIn: boolean;
  enrolled?: boolean;
  enrollmentMode: "OPEN" | "CODE";
};

function formatCode(value: string) {
  const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  return normalized.match(/.{1,4}/g)?.join("-") ?? normalized;
}

export function EnrollButton({
  courseId,
  slug,
  signedIn,
  enrolled = false,
  enrollmentMode,
}: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const router = useRouter();

  function requireSignIn() {
    router.push(`/masuk?next=${encodeURIComponent(`/program/${slug}`)}`);
  }

  async function enroll() {
    if (!signedIn) return requireSignIn();
    if (enrolled) return router.push(`/belajar/${slug}`);
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enroll", courseId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Akses program belum tersedia.");
      router.push(`/belajar/${slug}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Koneksi sedang bermasalah. Coba lagi.");
      setLoading(false);
    }
  }

  async function activateCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) return requireSignIn();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/cohorts/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Kode akses belum dapat diproses.");
      router.push(`/belajar/${data.course.slug}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Koneksi sedang bermasalah. Coba lagi.");
      setLoading(false);
    }
  }

  if (enrolled) {
    return (
      <div className="enroll-action-wrap">
        <button className="btn btn-primary enroll-button" type="button" onClick={() => void enroll()}>
          <span>Lanjutkan Belajar</span><ArrowRight aria-hidden="true" />
        </button>
      </div>
    );
  }

  if (enrollmentMode === "CODE") {
    return (
      <form className="enroll-action-wrap pf-inline-code-enroll" onSubmit={activateCode}>
        <label htmlFor="program-access-code"><KeyRound aria-hidden="true" />Kode akses program</label>
        <div>
          <input
            id="program-access-code"
            value={code}
            onChange={(event) => setCode(formatCode(event.target.value))}
            placeholder="XXXX-XXXX-XXXX"
            autoComplete="one-time-code"
            maxLength={14}
            required
          />
          <button className="btn btn-primary enroll-button" type="submit" disabled={loading || code.replace(/-/g, "").length < 6} aria-busy={loading}>
            {loading ? <LoaderCircle className="spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            <span>{loading ? "Memeriksa…" : signedIn ? "Aktifkan akses" : "Masuk & aktifkan"}</span>
          </button>
        </div>
        {message && <p className="enroll-error" role="alert">{message}</p>}
      </form>
    );
  }

  return (
    <div className="enroll-action-wrap">
      <button className="btn btn-primary enroll-button" type="button" onClick={() => void enroll()} disabled={loading} aria-busy={loading}>
        {loading ? <><LoaderCircle className="spin" aria-hidden="true" /><span>Menyiapkan akses…</span></> : <><span>{signedIn ? "Mulai Program" : "Masuk untuk Memulai"}</span><ArrowRight aria-hidden="true" /></>}
      </button>
      {message && <p className="enroll-error" role="alert">{message}</p>}
    </div>
  );
}
