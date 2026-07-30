import Image from "next/image";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Gauge,
  Layers3,
  MessageSquare,
  Play,
  ShieldCheck,
  Target,
  Users2,
} from "lucide-react";
import { prisma } from "@/services/prisma";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { CourseCard } from "@/components/ui/CourseCard";

type FeaturedCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  level: string;
  price: number;
  durationHours: number;
  rating: number;
  studentsCount: number;
  image: string;
  mentor?: { name: string };
};

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

const getFeaturedCoursesCached = unstable_cache(
  async (): Promise<FeaturedCourse[]> => {
    const courses = await prisma.course.findMany({
      where: { published: true, featured: true },
      include: { mentor: { select: { name: true } } },
      take: 3,
    });

    return courses.map(course => ({
      ...course,
      mentor: course.mentor ? { name: course.mentor.name } : undefined,
    }));
  },
  ["home-featured-courses-v3"],
  { revalidate: 60, tags: ["courses", "featured-courses"] },
);

async function getFeaturedCourses(): Promise<FeaturedCourse[]> {
  try {
    return await getFeaturedCoursesCached();
  } catch (error) {
    console.warn("[HOME_FEATURED_COURSES_FALLBACK]", error);
    return [];
  }
}

export default async function Home() {
  const courses = await getFeaturedCourses();

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
            <div><strong>3</strong><span>Ruang kerja berbasis peran</span></div>
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

        <section className="pf-home-section pf-home-programs" aria-labelledby="program-title">
          <div className="container">
            <div className="pf-home-heading pf-home-heading-split">
              <div>
                <span className="pf-home-pill">Program pilihan</span>
                <h2 id="program-title">Mulai dari tantangan yang sedang Anda hadapi.</h2>
              </div>
              <Link href="/program" className="pf-home-button pf-home-button-secondary">
                Semua program <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            {courses.length > 0 ? (
              <div className="course-grid pf-course-grid pf-home-course-grid">
                {courses.map(course => <CourseCard key={course.id} course={course} />)}
              </div>
            ) : (
              <div className="pf-home-empty-state">
                <BookOpen aria-hidden="true" />
                <div>
                  <h3>Temukan program yang tepat untuk Anda</h3>
                  <p>Buka katalog untuk melihat seluruh jalur belajar yang tersedia.</p>
                </div>
                <Link href="/program">Buka katalog <ChevronRight aria-hidden="true" /></Link>
              </div>
            )}
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
              <figure className="pf-home-method-photo">
                <Image
                  src="/images/profas-activity-collage.jpeg"
                  alt="Diskusi dan kegiatan belajar peserta PROFAS"
                  width={1599}
                  height={899}
                  sizes="(max-width: 860px) 100vw, 34vw"
                />
                <figcaption>
                  <span>Belajar bersama mentor</span>
                  Percakapan yang dekat dengan situasi kerja nyata.
                </figcaption>
              </figure>
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
                    <h3>Komunikasi yang menggerakkan</h3>
                    <p>Modul 2 · Percakapan sulit</p>
                    <div className="pf-preview-progress"><i /></div>
                    <span>67% selesai</span>
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
