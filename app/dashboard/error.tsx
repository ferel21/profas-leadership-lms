"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DASHBOARD_ERROR_BOUNDARY]", error);
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-card hover-lift">
        <div className="error-icon-box">
          <AlertCircle size={36} />
        </div>
        <h2 className="error-title">Gagal Memuat Dasbor Eksekutif</h2>
        <p className="error-desc">
          Terjadi kendala saat menyinkronkan metrik aktivitas atau data kemajuan dari server eksekutif PROFAS. Silakan coba muat ulang dasbor Anda.
        </p>
        <div className="error-actions">
          <button onClick={() => reset()} className="btn btn-primary flex items-center gap-2">
            <RefreshCw size={16} /> Muat Ulang Dasbor
          </button>
          <Link href="/" className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
