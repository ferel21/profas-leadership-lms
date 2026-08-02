import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, LockKeyhole } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { CertificateVerificationForm } from "@/components/shared/CertificateVerificationForm";

export const metadata: Metadata = {
  title: "Verifikasi Sertifikat",
  description: "Periksa keabsahan sertifikat PROFAS Leadership melalui nomor unik penerbitan.",
};

export default function CertificateVerificationPage() {
  return (
    <div className="pf-public-page">
      <Header />
      <main>
        <section className="pf-hero" aria-labelledby="verification-title" style={{ paddingBottom: '72px' }}>
          <div className="container pf-hero-layout" style={{ minHeight: 'auto', gridTemplateColumns: 'minmax(0, 1fr) minmax(400px, 0.8fr)', gap: '64px' }}>
            <div className="pf-hero-copy" style={{ paddingTop: '12px' }}>
              <span className="pf-kicker">
                <span aria-hidden="true" />
                PROFAS credential
              </span>
              <h1 id="verification-title">
                Bukti belajar yang bisa<br />
                <em>diperiksa siapa saja.</em>
              </h1>
              <p className="pf-hero-lead">
                Gunakan portal ini untuk memastikan sertifikat PROFAS diterbitkan dari rekam pembelajaran yang sah dan terverifikasi.
              </p>
              <div className="pf-trust-strip" style={{ marginTop: '48px', borderTop: 'none', borderBottom: '1px solid rgba(16, 21, 25, 0.12)', minHeight: '64px', gridTemplateColumns: '1fr 1fr' }}>
                <span style={{ borderLeft: 'none', justifyContent: 'flex-start', paddingLeft: '0' }}><BadgeCheck aria-hidden="true" /> Nomor unik tercatat</span>
                <span style={{ justifyContent: 'flex-start' }}><LockKeyhole aria-hidden="true" /> Data terlindungi</span>
              </div>
            </div>
            <div style={{ alignSelf: 'center', background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: 'var(--pf-shadow-md)', border: '1px solid var(--pf-line)' }}>
              <CertificateVerificationForm />
            </div>
          </div>
        </section>
        <section className="pf-section" aria-label="Langkah berikutnya" style={{ background: 'var(--pf-deep)', color: '#fff', textAlign: 'center', padding: '64px 0' }}>
          <div className="container">
            <h2 style={{ fontSize: '2rem', margin: '0 0 24px', fontWeight: 600 }}>Ingin membangun rekam kepemimpinan Anda sendiri?</h2>
            <Link href="/program" className="pf-button pf-button-primary" style={{ background: 'var(--pf-secondary-dark)', color: '#fff' }}>
              Jelajahi program PROFAS <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
