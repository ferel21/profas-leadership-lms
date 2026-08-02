import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  Compass,
  Gauge,
  Layers3,
  MessageSquare,
  Play,
  ShieldCheck,
  Target,
  Users2,
} from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { CourseCard } from "@/components/ui/CourseCard";
import { MentorCarousel } from "@/components/ui/MentorCarousel";

const journey = [
  {
    index: "01",
    icon: Compass,
    label: "Baca situasi",
    title: "Mulai dari tantangan yang benar-benar sedang Anda hadapi.",
    copy: "Setiap program membuka konteks terlebih dahulu, agar konsep kepemimpinan tidak berhenti sebagai teori.",
  },
  {
    index: "02",
    icon: MessageSquare,
    label: "Uji cara pikir",
    title: "Belajar melalui kasus, percakapan, dan umpan balik.",
    copy: "Anda melihat persoalan dari sudut lain, lalu menguji keputusan bersama mentor dan rekan belajar.",
  },
  {
    index: "03",
    icon: Target,
    label: "Bawa ke praktik",
    title: "Tutup setiap sesi dengan satu tindakan yang bisa dijalankan.",
    copy: "Progres di PROFAS mengukur ritme belajar sekaligus menjaga tindak lanjut tetap terlihat.",
  },
] as const;

const outcomes = [
  {
    icon: Compass,
    title: "Kejernihan",
    copy: "Memilah masalah, prioritas, dan peran sebelum mengambil keputusan.",
  },
  {
    icon: Users2,
    title: "Kapasitas",
    copy: "Menggerakkan percakapan, kolaborasi, dan akuntabilitas di dalam tim.",
  },
  {
    icon: Layers3,
    title: "Keberlanjutan",
    copy: "Mengubah insight menjadi kebiasaan kerja yang dapat dipantau dan diperbaiki.",
  },
] as const;

const rolePaths = [
  {
    icon: BookOpen,
    role: "Peserta",
    title: "Belajar tanpa kehilangan arah.",
    copy: "Lanjutkan materi terakhir, simpan catatan, ikuti evaluasi, dan lihat progres dari satu ruang kerja.",
    href: "/program",
    action: "Jelajahi program",
  },
  {
    icon: Gauge,
    role: "Mentor",
    title: "Kelola kelas sebagai sebuah perjalanan.",
    copy: "Susun modul, unggah materi, nilai tugas, dan temukan peserta yang membutuhkan dukungan.",
    href: "/masuk",
    action: "Masuk sebagai mentor",
  },
  {
    icon: BarChart3,
    role: "Admin",
    title: "Lihat kesehatan pembelajaran.",
    copy: "Pantau pengguna, aktivitas, progres, laporan, dan komunikasi platform dengan lebih ringkas.",
    href: "/masuk",
    action: "Buka ruang admin",
  },
] as const;

const profasModules = [
  {
    id: "mod-1",
    slug: "profas-leadership",
    title: "Leadership",
    shortDescription: "Membangun fondasi kepemimpinan yang adaptif, situasional, dan berdampak.",
    category: "Modul 1",
    level: "ADVANCED",
    price: 499000,
    durationHours: 12,
    rating: 4.9,
    studentsCount: 2500,
    image: "/images/profas-leadership-hero.webp",
    mentor: { name: "Prof. Dr. Muhammad Asdar, S.E., M.Si." },
  },
  {
    id: "mod-2",
    slug: "profas-leadership",
    title: "Personal Growth",
    shortDescription: "Membangun mindset bertumbuh, resiliensi, dan kebiasaan produktif.",
    category: "Modul 2",
    level: "ADVANCED",
    price: 499000,
    durationHours: 10,
    rating: 4.9,
    studentsCount: 2500,
    image: "/images/profas-leadership-hero.webp",
    mentor: { name: "Prof. Dr. Firman Menne, S.E., M.Si., Ak., CA., CTA, ACPA" },
  },
  {
    id: "mod-3",
    slug: "profas-leadership",
    title: "Business & Entrepreneurship",
    shortDescription: "Merancang strategi bisnis, eksekusi, dan pertumbuhan berkelanjutan.",
    category: "Modul 3",
    level: "ADVANCED",
    price: 499000,
    durationHours: 14,
    rating: 4.9,
    studentsCount: 2500,
    image: "/images/profas-leadership-hero.webp",
    mentor: { name: "Bahrul Ulum Ilham, S.Pd., M.M., Ph.D." },
  },
];

const faqItems = [
  [
    "Apakah PROFAS cocok untuk pemimpin yang baru mulai?",
    "Ya. Jalur belajar disusun bertahap untuk calon pemimpin, pemilik usaha, pengelola tim, akademisi, dan pemimpin organisasi yang ingin memperkuat praktik dasarnya.",
  ],
  [
    "Bagaimana pengalaman belajar di dalam platform?",
    "Setiap program memadukan video atau bacaan, studi kasus, refleksi, diskusi, kuis, tugas, dan catatan pribadi dalam satu course player.",
  ],
  [
    "Bisakah saya belajar lewat ponsel?",
    "Bisa. Katalog, dashboard, course player, diskusi, evaluasi, dan progres dirancang agar tetap nyaman digunakan dari layar kecil.",
  ],
  [
    "Kapan sertifikat diterbitkan?",
    "Sertifikat tersedia setelah seluruh materi wajib dan evaluasi program berhasil diselesaikan. Nomornya dapat diverifikasi secara publik.",
  ],
  [
    "Apakah tersedia program untuk tim atau organisasi?",
    "Tersedia. Tim dapat menggunakan jalur yang lebih terarah untuk menyamakan bahasa kepemimpinan, praktik kerja, dan ukuran capaian.",
  ],
] as const;

export default function Home() {
  return (
    <div className="pf-public-page pf-home">
      <a className="pf-skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <Header />
      <main id="main-content">
        <section className="pf-home-hero" aria-labelledby="home-title">
          <div className="container pf-hero-layout pf-home-hero-layout">
            <div className="pf-home-hero-copy">
              <span className="pf-home-pill">
                <span aria-hidden="true" />
                Platform belajar kepemimpinan
              </span>
              <h1 id="home-title">
                Pimpin lebih jernih.
                <span> Bertindak lebih yakin.</span>
              </h1>
              <p className="pf-home-hero-lead">
                PROFAS membantu Anda membaca situasi, menguji keputusan, dan
                mengubah pembelajaran menjadi tindakan yang relevan di ruang
                kerja.
              </p>
              <div className="pf-home-hero-actions">
                <Link href="/daftar" className="pf-home-button pf-home-button-primary">
                  Mulai belajar
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/program" className="pf-home-button pf-home-button-secondary">
                  <BookOpen aria-hidden="true" />
                  Lihat program
                </Link>
              </div>
              <ul className="pf-home-assurances" aria-label="Keunggulan platform">
                <li><ShieldCheck aria-hidden="true" /> Mentor praktisi</li>
                <li><Check aria-hidden="true" /> Progres tersimpan</li>
                <li><Award aria-hidden="true" /> Sertifikat terverifikasi</li>
              </ul>
            </div>

            <div className="pf-home-hero-visual" aria-label="Pengalaman belajar PROFAS">
              <figure className="pf-home-hero-photo">
                <Image
                  src="/images/profas-leadership-hero.webp"
                  alt="Mentor PROFAS memandu percakapan bersama peserta"
                  width={1100}
                  height={1250}
                  priority
                  sizes="(max-width: 860px) 100vw, 48vw"
                />
              </figure>

              <div className="pf-home-hero-status">
                <span><Check aria-hidden="true" /></span>
                <div>
                  <small>Ritme belajar terjaga</small>
                  <strong>Progres tersimpan otomatis</strong>
                </div>
              </div>

              <div className="pf-home-next-card">
                <span><Play fill="currentColor" aria-hidden="true" /></span>
                <div>
                  <small>Contoh materi berikutnya</small>
                  <strong>Memimpin percakapan sulit</strong>
                  <p>12 menit · Studi kasus</p>
                </div>
                <ArrowRight aria-hidden="true" />
              </div>

              <div className="pf-home-hero-tags" aria-hidden="true">
                <span>Refleksi</span>
                <span>Diskusi</span>
                <span>Praktik</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pf-home-stats-section" aria-label="Ringkasan PROFAS">
          <div className="container pf-home-stats">
            <div><strong>2.500+</strong><span>Alumni bertumbuh</span></div>
            <div><strong>4,9/5</strong><span>Pengalaman belajar</span></div>
            <div><strong>3</strong><span>Modul dari 3 profesor</span></div>
            <div><strong>Fleksibel</strong><span>Belajar sesuai ritme Anda</span></div>
          </div>
        </section>

        <section className="pf-home-section pf-home-benefits" id="manfaat" aria-labelledby="outcome-title">
          <div className="container">
            <div className="pf-home-heading pf-home-heading-centered">
              <span className="pf-home-pill">Mengapa PROFAS</span>
              <h2 id="outcome-title">Belajar yang bergerak sampai ke praktik.</h2>
              <p>
                Setiap program membantu Anda memahami konteks, melatih cara
                berpikir, dan membawa satu tindakan nyata kembali ke pekerjaan.
              </p>
            </div>
            <div className="pf-home-benefit-grid">
              {outcomes.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="pf-home-benefit-card">
                  <span><Icon aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── PAKET UTAMA: PROFAS LEADERSHIP ── */}
        <section className="pf-home-section pf-home-programs" aria-labelledby="program-title">
          <div className="container">
            <div className="pf-home-heading pf-home-heading-centered">
              <span className="pf-home-pill">Satu paket lengkap</span>
              <h2 id="program-title">PROFAS LEADERSHIP</h2>
              <p>
                Tiga pilar kepemimpinan dalam satu paket pembelajaran terstruktur,
                dipandu langsung oleh akademisi dan praktisi berpengalaman.
              </p>
            </div>
            <div className="course-grid pf-course-grid pf-home-course-grid">
              {profasModules.map((mod) => (
                <CourseCard key={mod.id} course={mod} isModule={true} />
              ))}
            </div>
            
            <div className="pf-package-footer" style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', backgroundColor: 'var(--pf-surface-alt, #f8fafc)', borderRadius: '1rem', border: '1px solid var(--pf-border, #e2e8f0)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>Mulai perjalanan kepemimpinan Anda</h3>
                <p style={{ color: 'var(--pf-text-muted, #64748b)', fontSize: '0.95rem' }}>Akses 3 modul lengkap, sesi diskusi, dan sertifikat kelulusan.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className="pf-package-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <small style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pf-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investasi</small>
                  <strong style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--pf-primary, #0f172a)' }}>Rp499.000</strong>
                </div>
                <Link
                  href="/daftar"
                  className="pf-home-button pf-home-button-primary"
                >
                  Ambil Paket Ini
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="pf-home-section pf-home-method" id="cara-belajar" aria-labelledby="route-title">
          <div className="container">
            <div className="pf-home-heading pf-home-heading-split">
              <div>
                <span className="pf-home-pill">Cara belajar</span>
                <h2 id="route-title">Satu rute yang menjaga Anda tetap bergerak.</h2>
              </div>
              <p>
                Belajar dimulai dari situasi nyata, dipertajam bersama, lalu
                ditutup dengan tindakan yang dapat dijalankan.
              </p>
            </div>
            <div className="pf-home-method-grid">
              {journey.map(({ icon: Icon, index, label, title, copy }, itemIndex) => (
                <article key={index} className={`pf-home-method-card is-step-${itemIndex + 1}`}>
                  <div className="pf-home-method-meta">
                    <span>{index}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <small>{label}</small>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
              <MentorCarousel />
            </div>
          </div>
        </section>

        <section className="pf-home-section pf-home-platform" id="platform" aria-labelledby="product-title">
          <div className="container">
            <div className="pf-home-heading pf-home-heading-centered">
              <span className="pf-home-pill">Satu platform, tiga ruang kerja</span>
              <h2 id="product-title">Navigasi yang jelas untuk setiap peran.</h2>
              <p>
                Peserta, mentor, dan admin melihat informasi serta tindakan yang
                paling relevan tanpa kehilangan konteks pembelajaran.
              </p>
            </div>
            <div className="pf-home-role-grid">
              {rolePaths.map(({ icon: Icon, role, title, copy, href, action }, index) => (
                <article key={role} className={index === 0 ? "is-primary" : ""}>
                  <div className="pf-home-role-top">
                    <span><Icon aria-hidden="true" /></span>
                    <small>Untuk {role}</small>
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <Link href={href}>{action}<ArrowRight aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
            <div className="pf-product-preview pf-home-product-preview" aria-label="Pratinjau dashboard peserta">
              <div className="pf-preview-sidebar">
                <div className="pf-preview-brand">PROFAS <span>workspace</span></div>
                {["Ringkasan", "Program saya", "Kalender", "Komunitas"].map((item, index) => (
                  <span key={item} className={index === 1 ? "is-active" : ""}>
                    <i aria-hidden="true" /> {item}
                  </span>
                ))}
              </div>
              <div className="pf-preview-main">
                <div className="pf-preview-header"><span>Program saya</span><i /></div>
                <div className="pf-preview-content">
                  <div>
                    <small>LANJUTKAN BELAJAR</small>
                    <h3>PROFAS LEADERSHIP</h3>
                    <p>Modul 1 · Leadership</p>
                    <div className="pf-preview-progress"><i /></div>
                    <span>45% selesai</span>
                  </div>
                  <button type="button" tabIndex={-1} aria-hidden="true"><Play fill="currentColor" /></button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pf-home-section pf-home-faq" id="faq" aria-labelledby="faq-title">
          <div className="container">
            <div className="pf-home-heading pf-home-heading-centered">
              <span className="pf-home-pill">Pertanyaan umum</span>
              <h2 id="faq-title">Yang perlu Anda tahu sebelum mulai.</h2>
              <p>Jawaban singkat untuk membantu Anda memilih langkah berikutnya.</p>
            </div>
            <div className="pf-faq-list pf-home-faq-list">
              {faqItems.map(([question, answer], index) => (
                <details key={question}>
                  <summary>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{question}</strong>
                    <i aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
            <div className="pf-home-faq-contact">
              <span>Masih punya pertanyaan?</span>
              <a href="mailto:halo@profas.id?subject=Konsultasi%20Program%20PROFAS">
                Bicara dengan tim PROFAS <ArrowRight aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section className="pf-home-cta-section" aria-labelledby="cta-title">
          <div className="container">
            <div className="pf-home-cta">
              <div>
                <span className="pf-home-pill">Langkah pertama</span>
                <h2 id="cta-title">Mulai dari satu tantangan nyata.</h2>
                <p>
                  Temukan program yang paling dekat dengan pekerjaan Anda dan
                  bangun ritme belajar yang bisa dijaga.
                </p>
              </div>
              <div className="pf-home-cta-actions">
                <Link href="/daftar" className="pf-home-button pf-home-button-light">
                  Mulai belajar <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/program" className="pf-home-button pf-home-button-ghost">
                  Lihat program
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
