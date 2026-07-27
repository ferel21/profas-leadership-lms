import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Check, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/shared/AuthForm";
import { Logo } from "@/components/ui/Logo";

export default function RegisterPage() {
  return (
    <main className="auth-page register-page pf-auth-page pf-auth-page-register">
      <aside className="auth-visual pf-auth-story" aria-label="Manfaat bergabung dengan PROFAS">
        <Image
          src="/images/profas-leadership-hero.webp"
          alt="Percakapan pembelajaran dalam kelas PROFAS"
          fill
          priority
          sizes="(max-width: 840px) 100vw, 46vw"
        />
        <div className="pf-auth-story-shade" aria-hidden="true" />
        <div className="pf-auth-story-content">
          <div className="pf-auth-story-top">
            <Logo />
            <span><BookOpenCheck aria-hidden="true" /> Ruang belajar kepemimpinan</span>
          </div>
          <div className="pf-auth-story-bottom">
            <span className="pf-auth-story-kicker">Satu akun, satu perjalanan</span>
            <blockquote>Bangun ritme belajar yang tetap terhubung dengan pekerjaan nyata.</blockquote>
            <div className="pf-auth-route" aria-label="Manfaat akun PROFAS">
              <span><Check aria-hidden="true" /> Jalur personal</span>
              <i aria-hidden="true" />
              <span><Check aria-hidden="true" /> Progres terukur</span>
              <i aria-hidden="true" />
              <span><Check aria-hidden="true" /> Sertifikat terverifikasi</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="auth-panel pf-auth-panel">
        <header className="pf-auth-panel-header">
          <Link href="/" aria-label="Kembali ke beranda">
            <ArrowLeft aria-hidden="true" /> Beranda
          </Link>
          <span><ShieldCheck aria-hidden="true" /> Data terlindungi</span>
        </header>
        <div className="mobile-auth-logo pf-auth-mobile-logo"><Logo /></div>
        <div className="auth-card pf-auth-card">
          <span className="eyebrow pf-auth-eyebrow">Buat akun PROFAS</span>
          <h1>Mulai dari tantangan yang ingin Anda jawab.</h1>
          <p>Siapkan ruang belajar personal Anda dalam beberapa langkah.</p>
          <AuthForm mode="register" />
          <small className="auth-switch pf-auth-switch">
            Sudah punya akun? <Link href="/masuk">Masuk</Link>
          </small>
        </div>
      </section>
    </main>
  );
}
