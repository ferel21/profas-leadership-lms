import Link from "next/link";
import { Compass, BookOpen, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="error-container not-found-container">
      <div className="error-card" aria-labelledby="not-found-title">
        <div className="error-icon-box">
          <Compass size={36} aria-hidden="true" />
        </div>
        <span className="error-kicker">404 / Di luar rute</span>
        <h1 className="error-title" id="not-found-title">Halaman ini tidak ditemukan.</h1>
        <p className="error-desc">
          Alamatnya mungkin berubah atau tidak lagi tersedia. Pilih rute berikut untuk melanjutkan.
        </p>
        <div className="error-actions">
          <Link href="/program" className="btn btn-primary flex items-center gap-2">
            <BookOpen size={16} aria-hidden="true" /> Lihat Program
          </Link>
          <Link href="/" className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} aria-hidden="true" /> Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
