import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";

const sections = [
  { id: "penggunaan", label: "Penggunaan layanan" },
  { id: "materi", label: "Materi dan sertifikat" },
  { id: "pembayaran", label: "Pembayaran dan akses" },
  { id: "dukungan", label: "Dukungan" },
];

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="legal-page pf-legal-page">
        <div className="pf-legal-shell">
          <aside className="pf-legal-rail" aria-label="Daftar isi">
            <span>Dokumen 02</span>
            <strong>Syarat &amp; Ketentuan</strong>
            <nav>
              {sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {section.label}
                </a>
              ))}
            </nav>
            <Link href="/privasi">
              Baca Kebijakan Privasi <ArrowRight aria-hidden="true" />
            </Link>
          </aside>

          <article aria-labelledby="terms-title">
            <header>
              <span className="eyebrow">Dokumen PROFAS</span>
              <h1 id="terms-title">Syarat &amp; Ketentuan</h1>
              <p className="legal-updated">Terakhir diperbarui: 2 Juli 2026</p>
              <p className="pf-legal-intro">
                Pedoman singkat untuk menggunakan ruang belajar, materi, dan kredensial PROFAS secara aman dan bertanggung jawab.
              </p>
            </header>

            <section id="penggunaan">
              <h2>Penggunaan layanan</h2>
              <p>Pengguna bertanggung jawab menjaga keamanan akun dan menggunakan materi pembelajaran untuk tujuan yang sah. Akun tidak boleh dipindahtangankan tanpa persetujuan PROFAS.</p>
            </section>

            <section id="materi">
              <h2>Materi dan sertifikat</h2>
              <p>Materi tetap merupakan kekayaan intelektual pemiliknya. Sertifikat diterbitkan setelah persyaratan program terpenuhi dan dapat diverifikasi melalui nomor unik.</p>
            </section>

            <section id="pembayaran">
              <h2>Pembayaran dan akses</h2>
              <p>Ketentuan harga, pembayaran, pengembalian dana, serta masa akses ditampilkan sebelum transaksi pada layanan produksi. Demo lokal tidak memproses pembayaran nyata.</p>
            </section>

            <section id="dukungan">
              <h2>Dukungan</h2>
              <p>Pertanyaan mengenai ketentuan ini dapat dikirim ke <a href="mailto:halo@profas.id">halo@profas.id</a>.</p>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
