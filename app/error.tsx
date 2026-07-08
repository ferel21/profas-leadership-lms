"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error untuk diagnostik produksi & 24/7 autonomous monitoring
    console.error("[PROFAS_GLOBAL_ERROR_BOUNDARY]", {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-card hover-lift">
        <div className="error-icon-box">
          <AlertTriangle size={36} />
        </div>
        <h1 className="error-title">Terjadi Kesalahan Sistem</h1>
        <p className="error-desc">
          Maaf, sesi Anda mengalami kendala teknis atau koneksi terputus. Sistem maintenance 24/7 kami telah mencatat masalah ini untuk auto-healing.
        </p>
        <div className="error-actions">
          <button onClick={() => reset()} className="btn btn-primary flex items-center gap-2">
            <RefreshCw size={16} /> Coba Lagi
          </button>
          <Link href="/" className="btn btn-secondary flex items-center gap-2">
            <Home size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
