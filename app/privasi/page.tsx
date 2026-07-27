import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";

const sections = [
  { id: "data", label: "Data yang digunakan" },
  { id: "penggunaan", label: "Cara data digunakan" },
  { id: "keamanan", label: "Keamanan dan penyimpanan" },
  { id: "hak", label: "Hak Anda" },
];

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="legal-page pf-legal-page">
        <div className="pf-legal-shell">
          <aside className="pf-legal-rail" aria-label="Daftar isi">
            <span>Dokumen 01</span>
            <strong>Kebijakan Privasi</strong>
            <nav>
              {sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.label}
                </a>
              ))}
            </nav>
            <Link href="/syarat">
              Baca Syarat &amp; Ketentuan <ArrowRight aria-hidden="true" />
            </Link>
          </aside>

          <article aria-labelledby="privacy-title">
            <header>
              <span className="eyebrow">Dokumen PROFAS</span>
              <h1 id="privacy-title">Kebijakan Privasi</h1>
              <p className="legal-updated">Terakhir diperbarui: 2 Juli 2026</p>
              <p className="pf-legal-intro">
                Ringkasan tentang data yang kami gunakan untuk menjalankan pengalaman belajar PROFAS dan cara Anda tetap memegang kendali atasnya.
              </p>
            </header>

            <section id="data">
              <h2>Data yang kami gunakan</h2>
              <p>Kami menggunakan nama, alamat email, profil peserta, aktivitas pembelajaran, hasil evaluasi, dan progres untuk menyediakan layanan PROFAS Leadership.</p>
            </section>

            <section id="penggunaan">
              <h2>Cara data digunakan</h2>
              <p>Data digunakan untuk autentikasi, personalisasi pembelajaran, pengukuran progres, penerbitan sertifikat, dukungan pengguna, dan peningkatan layanan. Kami tidak menjual data pribadi.</p>
            </section>

            <section id="keamanan">
              <h2>Keamanan dan penyimpanan</h2>
              <p>Kata sandi disimpan dalam bentuk hash dan sesi menggunakan cookie HTTP-only. Akses data dibatasi sesuai peran. Masa simpan mengikuti kebutuhan layanan dan kewajiban hukum yang berlaku.</p>
            </section>

            <section id="hak">
              <h2>Hak Anda</h2>
              <p>Anda dapat meminta akses, koreksi, atau penghapusan data dengan menghubungi <a href="mailto:halo@profas.id">halo@profas.id</a>.</p>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
