import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, LockKeyhole } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CertificateVerificationForm } from "@/components/CertificateVerificationForm";

export const metadata: Metadata = {
  title: "Verifikasi Sertifikat",
  description: "Periksa keabsahan sertifikat PROFAS Leadership melalui nomor unik penerbitan.",
};

export default function CertificateVerificationPage() {
  return (
    <div className="al-page">
      <Header />
      <main className="verification-page">
        <section className="verification-hero" aria-labelledby="verification-title">
          <div className="container verification-hero-grid">
            <div>
              <span className="al-eyebrow">PROFAS credential</span>
              <h1 id="verification-title">Bukti belajar yang bisa diperiksa siapa saja.</h1>
              <p>Gunakan portal ini untuk memastikan sertifikat PROFAS diterbitkan dari rekam pembelajaran yang sah dan terverifikasi.</p>
              <div className="verification-trust-list">
                <span><BadgeCheck size={17} /> Nomor unik tercatat</span>
                <span><LockKeyhole size={17} /> Data pemilik tetap terlindungi</span>
              </div>
            </div>
            <CertificateVerificationForm />
          </div>
        </section>
        <section className="verification-next-step" aria-label="Langkah berikutnya">
          <div className="container">
            <p>Ingin membangun rekam kepemimpinan Anda sendiri?</p>
            <Link href="/program">Jelajahi program PROFAS <ArrowRight size={17} /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
