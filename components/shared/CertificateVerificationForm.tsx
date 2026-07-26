"use client";

import { useState } from "react";
import { AlertCircle, BadgeCheck, LoaderCircle, Search, ShieldCheck } from "lucide-react";

type CertificateRecord = {
  uniqueNumber: string;
  issuedAt: string;
  user: { name: string };
  course: { title: string };
};

type VerificationState = {
  valid: boolean;
  certificate?: CertificateRecord;
  message: string;
};

export function CertificateVerificationForm() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationState | null>(null);

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedNumber = number.trim();
    if (!normalizedNumber) {
      setResult({ valid: false, message: "Masukkan nomor sertifikat terlebih dahulu." });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`/api/certificates/verify?number=${encodeURIComponent(normalizedNumber)}`);
      const data = await response.json() as VerificationState;
      if (!response.ok) {
        setResult({ valid: false, message: data.message || "Nomor sertifikat belum dapat diperiksa." });
        return;
      }
      setResult(data.valid && data.certificate
        ? data
        : { valid: false, message: "Nomor sertifikat tidak ditemukan dalam basis data PROFAS." });
    } catch {
      setResult({ valid: false, message: "Pemeriksaan gagal terhubung. Coba lagi sebentar lagi." });
    } finally {
      setLoading(false);
    }
  }

  const issuedDate = result?.certificate
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(result.certificate.issuedAt))
    : null;

  return (
    <div className="verification-card">
      <div className="verification-card-heading">
        <span className="verification-card-icon"><ShieldCheck size={22} /></span>
        <div>
          <span className="verification-label">Portal publik</span>
          <h2>Periksa sertifikat</h2>
        </div>
      </div>
      <p className="verification-card-copy">Masukkan nomor unik yang tercetak pada sertifikat untuk melihat status penerbitan dan detail pemiliknya.</p>

      <form onSubmit={verify} className="verification-form">
        <label htmlFor="certificate-number">Nomor sertifikat</label>
        <div className="verification-input-row">
          <input
            id="certificate-number"
            value={number}
            onChange={event => setNumber(event.target.value)}
            placeholder="Contoh: PROFAS-LDR-2026-0001"
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !number.trim()}>
            {loading ? <LoaderCircle size={18} className="verification-spinner" /> : <Search size={18} />}
            {loading ? "Memeriksa" : "Verifikasi"}
          </button>
        </div>
      </form>

      {result && (
        <div className={`verification-result ${result.valid ? "is-valid" : "is-invalid"}`} role="status" aria-live="polite">
          {result.valid ? <BadgeCheck size={22} /> : <AlertCircle size={22} />}
          <div>
            <strong>{result.valid ? "Sertifikat terverifikasi" : "Sertifikat belum ditemukan"}</strong>
            {result.valid && result.certificate ? (
              <p>{result.certificate.user.name} menyelesaikan <b>{result.certificate.course.title}</b> pada {issuedDate}.</p>
            ) : <p>{result.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
