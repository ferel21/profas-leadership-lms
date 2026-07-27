import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpenCheck, Check, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/shared/AuthForm";
import { Logo } from "@/components/ui/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string }>;
}) {
  const { next, error, reason } = await searchParams;
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="auth-page pf-auth-page">
      <aside className="auth-visual pf-auth-story" aria-label="Tentang pengalaman belajar PROFAS">
        <Image
          src="/images/profas-leadership-hero.webp"
          alt="Mentor dan peserta berdiskusi dalam kelas PROFAS"
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
            <span className="pf-auth-story-kicker">Kembali ke perjalanan Anda</span>
            <blockquote>“Kepemimpinan bertumbuh ketika refleksi bertemu tindakan.”</blockquote>
            <div className="pf-auth-route" aria-label="Alur belajar PROFAS">
              <span><Check aria-hidden="true" /> Pahami konteks</span>
              <i aria-hidden="true" />
              <span><Check aria-hidden="true" /> Latih keputusan</span>
              <i aria-hidden="true" />
              <span><Check aria-hidden="true" /> Bawa ke praktik</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="auth-panel pf-auth-panel">
        <header className="pf-auth-panel-header">
          <Link href="/" aria-label="Kembali ke beranda">
            <ArrowLeft aria-hidden="true" /> Beranda
          </Link>
          <span><ShieldCheck aria-hidden="true" /> Akses aman</span>
        </header>
        <div className="mobile-auth-logo pf-auth-mobile-logo"><Logo /></div>
        <div className="auth-card pf-auth-card">
          <span className="eyebrow pf-auth-eyebrow">Selamat datang kembali</span>
          <h1>Lanjutkan perjalanan kepemimpinan Anda.</h1>
          <p>Masuk untuk membuka program, catatan, evaluasi, dan progres terakhir.</p>
          <AuthForm
            mode="login"
            redirectTo={redirectTo}
            errorParam={error}
            reasonParam={reason}
          />
          <small className="auth-switch pf-auth-switch">
            Belum punya akun? <Link href="/daftar">Buat akun gratis</Link>
          </small>
        </div>
      </section>
    </main>
  );
}
