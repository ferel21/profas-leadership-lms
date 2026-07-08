import Link from "next/link";
import { Compass, BookOpen, LogIn, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="error-container">
      <div className="error-card hover-lift">
        <div className="error-icon-box">
          <Compass size={36} />
        </div>
        <h1 className="error-title">404 - Halaman Tidak Ditemukan</h1>
        <p className="error-desc">
          Halaman yang Anda cari mungkin telah dipindahkan, diperbarui, atau Anda belum memiliki hak akses (enrollment) untuk rute tersebut.
        </p>
        <div className="error-actions">
          <Link href="/program" className="btn btn-primary flex items-center gap-2">
            <BookOpen size={16} /> Lihat Program Belajar
          </Link>
          <Link href="/masuk" className="btn btn-secondary flex items-center gap-2">
            <LogIn size={16} /> Masuk ke Akun
          </Link>
          <Link href="/" className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Beranda Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
