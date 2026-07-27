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
    <div className="pf-public-page">
      <Header />
      <main>
        <section className="pf-hero" aria-labelledby="home-title">
          <div className="container pf-hero-layout">
            <div className="pf-hero-copy">
              <span className="pf-kicker">
                <span aria-hidden="true" />
                Ruang belajar kepemimpinan
              </span>
              <h1 id="home-title">
                Belajar memimpin
                <em> dengan cara memimpin.</em>
              </h1>
              <p className="pf-hero-lead">
                PROFAS membantu Anda membaca situasi, menguji keputusan, dan
                membawa pembelajaran ke ruang kerja—satu langkah nyata setiap
                kali belajar.
              </p>
              <div className="pf-hero-actions">
                <Link href="/daftar" className="pf-button pf-button-primary">
                  Mulai perjalanan
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/program" className="pf-button pf-button-secondary">
                  <BookOpen aria-hidden="true" />
                  Lihat program
                </Link>
              </div>
              <div className="pf-hero-proof" aria-label="Ringkasan kepercayaan">
                <div>
                  <strong>2.500+</strong>
                  <span>alumni bertumbuh bersama</span>
                </div>
                <div>
                  <strong>4,9/5</strong>
                  <span>penilaian pengalaman belajar</span>
                </div>
              </div>
            </div>

            <div className="pf-hero-visual" aria-label="Peta perjalanan belajar PROFAS">
              <figure className="pf-hero-photo">
                <Image
                  src="/images/profas-leadership-hero.webp"
                  alt="Mentor PROFAS memandu percakapan bersama peserta"
                  width={1100}
                  height={1250}
                  priority
                  sizes="(max-width: 860px) 100vw, 48vw"
                />
                <figcaption>
                  <span>Di dalam kelas</span>
                  Percakapan yang dekat dengan situasi kerja nyata.
                </figcaption>
              </figure>

              <div className="pf-journey-card">
                <div className="pf-journey-card-head">
                  <span>Perjalanan Anda</span>
                  <strong>03 langkah</strong>
                </div>
                <svg
                  viewBox="0 0 420 152"
                  role="img"
                  aria-label="Alur dari memahami konteks, berlatih, hingga berdampak"
                >
                  <path
                    d="M24 112 C92 112 82 42 158 42 C232 42 226 112 298 112 C346 112 362 78 396 38"
                    pathLength="1"
                  />
                  <circle cx="24" cy="112" r="8" />
                  <circle cx="158" cy="42" r="8" />
                  <circle cx="298" cy="112" r="8" />
                  <circle className="is-current" cx="396" cy="38" r="11" />
                </svg>
                <div className="pf-journey-labels" aria-hidden="true">
                  <span>Konteks</span>
                  <span>Latihan</span>
                  <span>Refleksi</span>
                  <span>Dampak</span>
                </div>
              </div>

              <div className="pf-hero-note">
                <span><Play fill="currentColor" aria-hidden="true" /></span>
                <div>
                  <small>Sesi berikutnya</small>
                  <strong>Memimpin percakapan sulit</strong>
                  <p>12 menit · Studi kasus</p>
                </div>
              </div>
            </div>
          </div>

          <div className="container pf-trust-strip">
            <span><ShieldCheck aria-hidden="true" /> Akses berbasis peran</span>
            <span><Check aria-hidden="true" /> Progres tersimpan otomatis</span>
            <span><Award aria-hidden="true" /> Sertifikat terverifikasi</span>
            <span><Users2 aria-hidden="true" /> Mentor praktisi</span>
          </div>
        </section>

        <section className="pf-section pf-outcome-section" id="tentang" aria-labelledby="outcome-title">
          <div className="container">
            <div className="pf-section-heading pf-section-heading-split">
              <div>
                <span className="pf-kicker">Yang berubah setelah belajar</span>
                <h2 id="outcome-title">Bukan sekadar materi yang selesai.</h2>
              </div>
              <p>
                Pembelajaran dirancang untuk meninggalkan cara kerja yang lebih
                jernih—bukan hanya menambah daftar konsep yang pernah dibaca.
              </p>
            </div>
            <div className="pf-outcome-grid">
              {outcomes.map(({ icon: Icon, title, copy }, index) => (
                <article key={title} className="pf-outcome-card">
                  <div>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pf-proof-section" id="mentor" aria-labelledby="proof-title">
          <div className="container pf-proof-layout">
            <figure className="pf-proof-media">
              <Image
                src="/images/profas-activity-collage.jpeg"
                alt="Kolase diskusi dan kegiatan belajar peserta PROFAS"
                width={1599}
                height={899}
                sizes="(max-width: 860px) 100vw, 62vw"
              />
              <figcaption>Kelas PROFAS · Makassar</figcaption>
            </figure>
            <div className="pf-proof-copy">
              <span className="pf-kicker">Belajar terjadi bersama</span>
              <h2 id="proof-title">
                Ruang aman untuk mencoba cara memimpin yang baru.
              </h2>
              <p>
                Mentor tidak hanya menjelaskan. Mereka membuka percakapan,
                mempertajam pertanyaan, dan membantu peserta menghubungkan
                konsep dengan keputusan yang sedang dihadapi.
              </p>
              <blockquote>
                “Saya pulang bukan dengan jawaban instan, tetapi dengan cara
                melihat masalah yang jauh lebih jernih.”
                <cite>Alumni PROFAS · Batch 2025</cite>
              </blockquote>
            </div>
          </div>
        </section>

        <section className="pf-section pf-route-section" id="cara-belajar" aria-labelledby="route-title">
          <div className="container pf-route-layout">
            <div className="pf-route-intro">
              <span className="pf-kicker">Ritme belajar PROFAS</span>
              <h2 id="route-title">Satu rute, tiga gerakan.</h2>
              <p>
                Urutan ini menjaga pembelajaran tetap dekat dengan pekerjaan:
                pahami, uji, lalu jalankan.
              </p>
              <Link href="/program" className="pf-text-link">
                Temukan jalur Anda <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <ol className="pf-route-list">
              {journey.map(({ icon: Icon, index, label, title, copy }) => (
                <li key={index}>
                  <div className="pf-route-marker">
                    <span>{index}</span>
                    <i aria-hidden="true" />
                  </div>
                  <article>
                    <div><Icon aria-hidden="true" /> {label}</div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="pf-section pf-program-section" aria-labelledby="program-title">
          <div className="container">
            <div className="pf-section-heading pf-program-heading">
              <div>
                <span className="pf-kicker">Program pilihan</span>
                <h2 id="program-title">Pilih tantangan yang ingin Anda jawab.</h2>
              </div>
              <Link href="/program" className="pf-button pf-button-secondary">
                Semua program <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            {courses.length > 0 ? (
              <div className="course-grid pf-course-grid">
                {courses.map(course => <CourseCard key={course.id} course={course} />)}
              </div>
            ) : (
              <div className="pf-empty-state">
                <BookOpen aria-hidden="true" />
                <div>
                  <h3>Katalog sedang disiapkan</h3>
                  <p>Program akan muncul setelah mentor menerbitkan kurikulum.</p>
                </div>
                <Link href="/program">Buka katalog <ChevronRight aria-hidden="true" /></Link>
              </div>
            )}
          </div>
        </section>

        <section className="pf-section pf-product-section" id="insight" aria-labelledby="product-title">
          <div className="container">
            <div className="pf-section-heading pf-section-heading-centered">
              <span className="pf-kicker">Satu sistem, tiga ruang kerja</span>
              <h2 id="product-title">Setiap orang melihat apa yang perlu dilakukan berikutnya.</h2>
              <p>
                Navigasi, ringkasan, dan tindakan disesuaikan dengan peran tanpa
                memisahkan pengalaman menjadi produk yang berbeda.
              </p>
            </div>
            <div className="pf-role-grid">
              {rolePaths.map(({ icon: Icon, role, title, copy, href, action }, index) => (
                <article key={role} className={index === 0 ? "is-featured" : ""}>
                  <div className="pf-role-top">
                    <span><Icon aria-hidden="true" /></span>
                    <small>{role}</small>
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <Link href={href}>{action}<ArrowRight aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
            <div className="pf-product-preview" aria-label="Pratinjau course player">
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

        <section className="pf-section pf-faq-section" id="faq" aria-labelledby="faq-title">
          <div className="container pf-faq-layout">
            <div className="pf-faq-intro">
              <span className="pf-kicker">Sebelum Anda mulai</span>
              <h2 id="faq-title">Pertanyaan yang paling sering muncul.</h2>
              <p>
                Belum menemukan jawaban yang dicari? Tim kami dapat membantu
                menentukan langkah pertama yang paling sesuai.
              </p>
              <a href="mailto:halo@profas.id?subject=Konsultasi%20Program%20PROFAS" className="pf-text-link">
                Bicara dengan tim PROFAS <ArrowRight aria-hidden="true" />
              </a>
            </div>
            <div className="pf-faq-list">
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
          </div>
        </section>

        <section className="pf-cta-section" aria-labelledby="cta-title">
          <div className="container">
            <div className="pf-cta-panel">
              <div>
                <span className="pf-kicker">Langkah pertama</span>
                <h2 id="cta-title">Pilih satu tantangan. Mulai dari sana.</h2>
              </div>
              <p>
                Temukan program yang dekat dengan ruang kerja Anda, lalu bangun
                ritme belajar yang bisa dijaga.
              </p>
              <div>
                <Link href="/daftar" className="pf-button pf-button-light">
                  Buat akun <ArrowRight aria-hidden="true" />
                </Link>
                <Link href="/masuk" className="pf-button pf-button-ghost">
                  Masuk dashboard
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
