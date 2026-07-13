"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function LearnError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="player-error-state" role="alert">
      <AlertCircle size={42} aria-hidden="true" />
      <h1>Ruang belajar belum dapat dibuka</h1>
      <p>Terjadi kendala saat memuat program. Coba muat ulang tanpa kehilangan progres yang sudah tersimpan.</p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}><RefreshCw size={16} /> Coba lagi</button>
    </main>
  );
}
