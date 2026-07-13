import { LoaderCircle } from "lucide-react";

export default function LearnLoading() {
  return (
    <main className="player-loading-state" aria-live="polite" aria-busy="true">
      <div className="player-loading-bar" />
      <div className="player-loading-card">
        <LoaderCircle className="spin" size={28} aria-hidden="true" />
        <strong>Menyiapkan ruang belajar…</strong>
        <span>Materi dan progres Anda sedang dimuat.</span>
      </div>
    </main>
  );
}
