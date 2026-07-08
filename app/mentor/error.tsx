"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Briefcase } from "lucide-react";
import Link from "next/link";

export default function MentorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MENTOR_ERROR_BOUNDARY]", error);
  }, [error]);

  return (
    <div className="error-container">
      <div className="error-card hover-lift">
        <div className="error-icon-box">
          <AlertCircle size={36} />
        </div>
        <h2 className="error-title">Gangguan Ruang Manajemen Mentor</h2>
        <p className="error-desc">
          Terjadi kendala saat menyinkronkan modul materi atau data peserta program dari server. Coba muat ulang halaman atau kembali ke dasbor mentor.
        </p>
        <div className="error-actions">
          <button onClick={() => reset()} className="btn btn-primary flex items-center gap-2">
            <RefreshCw size={16} /> Muat Ulang Ruang Mentor
          </button>
          <Link href="/mentor" className="btn btn-secondary flex items-center gap-2">
            <Briefcase size={16} /> Menu Mentor
          </Link>
        </div>
      </div>
    </div>
  );
}
