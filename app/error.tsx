"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep enough context for production diagnostics without exposing it in the UI.
    console.error("[PROFAS_GLOBAL_ERROR_BOUNDARY]", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <main className="error-container">
      <div className="error-card" role="alert" aria-labelledby="error-title">
        <div className="error-icon-box">
          <AlertTriangle size={36} aria-hidden="true" />
        </div>
        <span className="error-kicker">Jeda sejenak</span>
        <h1 className="error-title" id="error-title">Halaman belum dapat dimuat.</h1>
        <p className="error-desc">
          Sesi atau koneksi Anda mungkin terputus. Coba muat ulang halaman; progres yang sudah tersimpan tetap aman.
        </p>
        <div className="error-actions">
          <button onClick={() => reset()} className="btn btn-primary flex items-center gap-2">
            <RefreshCw size={16} aria-hidden="true" /> Muat Ulang
          </button>
          <Link href="/" className="btn btn-secondary flex items-center gap-2">
            <Home size={16} aria-hidden="true" /> Ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
