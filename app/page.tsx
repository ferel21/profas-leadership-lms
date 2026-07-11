import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Compass,
  FileText,
  Gauge,
  Layers3,
  LineChart,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";

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

const metrics = [
  ["2.500+", "Alumni aktif"],
  ["40+", "Modul studi kasus"],
  ["15+", "Mentor praktisi"],
  ["87%", "Progress terselesaikan"],
] as const;

const pathways = [
  {
    icon: Gauge,
    title: "Peserta",
    copy: "Belajar terarah, lanjutkan materi terakhir, pantau progres, dan ambil sertifikat terverifikasi.",
  },
  {
    icon: Layers3,
    title: "Mentor",
    copy: "Bangun kurikulum modular, unggah materi, kelola tugas, dan monitor capaian kelas.",
  },
  {
    icon: LineChart,
    title: "Admin",
    copy: "Pantau operasi LMS, kelola pengguna, siarkan pengumuman, dan lihat laporan platform.",
  },
] as const;

const capabilities = [
  ["Course Player", "Video, PDF, dokumen, kuis, tugas, diskusi, dan catatan pribadi dalam satu ruang belajar."],
  ["Role Dashboard", "Tampilan khusus Admin, Mentor, dan Peserta agar setiap pengguna langsung menemukan aksi penting."],
  ["Progress Engine", "Progres belajar, kelulusan, XP, dan sertifikat ditangani oleh sistem secara konsisten."],
  ["Production Flow", "Loading, empty, error, success state, dan akses mobile dirancang untuk pemakaian nyata."],
] as const;

const learningMethod = [
  {
    icon: Compass,
    index: "01",
    title: "Orientasi",
    copy: "Mulai dari konteks kerja yang nyata. Setiap modul membantu peserta melihat tantangan kepemimpinan dengan lebih jernih.",
  },
  {
    icon: Users2,
    index: "02",
    title: "Percakapan",
    copy: "Uji pemikiran melalui diskusi, studi kasus, dan perspektif rekan belajar maupun mentor praktisi.",
  },
  {
    icon: Target,
    index: "03",
    title: "Penerapan",
    copy: "Tutup setiap sesi dengan langkah yang bisa dicoba. Progres menjadi kebiasaan, bukan sekadar checklist materi.",
  },
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
  ["home-featured-courses-v2"],
  { revalidate: 60, tags: ["courses", "featured-courses"] }
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
    <>
      <Header />
      <main className="lms-home">
        <section className="lms-hero" aria-labelledby="home-title">
          <div className="lms-hero-media" aria-hidden="true" />
          <div className="container lms-hero-grid">
            <div className="lms-hero-copy">
              <span className="lms-eyebrow">
                <Sparkles size={16} />
                PROFAS Institute / Leadership learning system
              </span>
              <h1 id="home-title">
                Belajar memimpin
                <span className="lms-title-line"><span className="lms-inline-image" aria-hidden="true" />dengan dampak.</span>
              </h1>
              <p>
                Ruang belajar terstruktur untuk mengubah wawasan menjadi keputusan, kebiasaan kerja, dan capaian kepemimpinan yang bisa dilihat.
              </p>
              <div className="lms-hero-actions">
                <Link href="/daftar" className="lms-btn lms-btn-primary">
                  Mulai Belajar
                  <ArrowRight size={18} />
                </Link>
                <Link href="/program" className="lms-btn lms-btn-secondary">
                  <Play size={17} fill="currentColor" />
                  Lihat Program
                </Link>
              </div>
              <div className="lms-hero-trust" aria-label="Ringkasan kepercayaan platform">
                <div className="lms-rating">
                  <Star fill="currentColor" />
                  <b>4.9</b>
                  <span>rata-rata alumni</span>
                </div>
                <div className="lms-avatar-row" aria-hidden="true">
                  <span>RD</span>
                  <span>NP</span>
                  <span>AY</span>
                  <span>+2k</span>
                </div>
              </div>
            </div>

            <div className="lms-hero-visual">
              <div className="lms-hero-visual-topline">
                <span>Field note / 01</span>
                <span>Makassar · Indonesia</span>
              </div>
              <figure className="lms-hero-photo">
                <Image
                  src="/images/profas-activity-collage.jpeg"
                  alt="Peserta PROFAS berdiskusi dan berlatih dalam ruang pembelajaran"
                  width={1599}
                  height={899}
                  priority
                  sizes="(max-width: 780px) 100vw, 48vw"
                />
                <figcaption>Belajar memimpin lewat ruang, percakapan, dan praktik.</figcaption>
              </figure>
              <aside className="lms-dashboard-preview" aria-label="Cuplikan dashboard LMS">
                <div className="lms-preview-top">
                  <div>
                    <span>Dashboard Peserta</span>
                    <b>Strategic Leadership</b>
                  </div>
                  <small>Live</small>
                </div>
                <div className="lms-progress-card">
                  <div>
                    <span>Progres Program</span>
                    <strong>85%</strong>
                  </div>
                  <i><em /></i>
                </div>
                <div className="lms-preview-grid">
                  <div>
                    <BookOpen size={18} />
                    <b>18</b>
                    <span>Materi selesai</span>
                  </div>
                  <div>
                    <ClipboardCheck size={18} />
                    <b>94</b>
                    <span>Skor evaluasi</span>
                  </div>
                </div>
                <div className="lms-preview-list">
                  <p><CheckCircle2 /> Modul keputusan strategis selesai</p>
                  <p><FileText /> Jurnal refleksi tersimpan</p>
                  <p><Award /> Sertifikat siap setelah post-test</p>
                </div>
              </aside>
              <span className="lms-hero-visual-note">Lead / Learn / Practice</span>
            </div>
          </div>
        </section>

        <section className="lms-metrics" aria-label="Statistik PROFAS">
          <div className="container lms-metrics-grid">
            {metrics.map(([value, label]) => (
              <div key={label}>
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lms-activity" aria-labelledby="activity-title">
          <div className="container">
            <div className="lms-activity-intro">
              <div>
                <span className="lms-eyebrow">Belajar dalam aksi</span>
                <h2 id="activity-title">Kepemimpinan tumbuh di ruang yang dijalani bersama.</h2>
              </div>
              <p>
                Kelas PROFAS mempertemukan refleksi, praktik, dan percakapan yang membuat pembelajaran terasa dekat dengan tantangan kerja sehari-hari.
              </p>
            </div>
            <figure className="lms-activity-frame">
              <Image
                src="/images/profas-activity-collage.jpeg"
                alt="Kolase kegiatan pembelajaran dan diskusi peserta PROFAS Leadership"
                width={1599}
                height={899}
                sizes="(max-width: 780px) calc(100vw - 28px), 1160px"
              />
              <figcaption>Potret proses belajar: berdiskusi, mencoba, dan bertumbuh sebagai satu komunitas.</figcaption>
            </figure>
          </div>
        </section>

        <section className="lms-method" aria-labelledby="method-title">
          <div className="container">
            <div className="lms-method-heading">
              <div>
                <span className="lms-eyebrow">Cara kami bekerja</span>
                <h2 id="method-title">Kepemimpinan bukan teori yang disimpan.</h2>
              </div>
              <p>
                PROFAS menghubungkan insight dengan tindakan melalui ritme belajar yang singkat, reflektif, dan relevan dengan ruang kerja peserta.
              </p>
            </div>
            <div className="lms-method-grid">
              {learningMethod.map(({ icon: Icon, index, title, copy }) => (
                <article key={title} className="lms-method-card">
                  <div className="lms-method-card-top">
                    <Icon size={22} />
                    <span>{index}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lms-section" id="tentang">
          <div className="container">
            <div className="lms-section-head">
              <span className="lms-eyebrow">Sistem yang siap dipakai</span>
              <h2>Satu platform untuk seluruh alur LMS profesional.</h2>
              <p>PROFAS dirancang sebagai sistem operasional pembelajaran, bukan halaman promosi kosong. Setiap role punya ruang kerja dan alur yang jelas.</p>
            </div>
            <div className="lms-pathway-grid">
              {pathways.map(({ icon: Icon, title, copy }) => (
                <article key={title} className="lms-pathway-card">
                  <span><Icon size={24} /></span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <Link href={title === "Peserta" ? "/program" : "/masuk"}>
                    Masuk alur {title}
                    <ChevronRight size={16} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lms-section lms-section-muted">
          <div className="container lms-split">
            <div>
              <span className="lms-eyebrow">Pengalaman belajar</span>
              <h2>Course player yang terasa seperti produk SaaS, bukan folder materi.</h2>
              <p>
                Materi, diskusi, lampiran, catatan, progres, evaluasi, dan tombol penyelesaian ditempatkan dalam alur yang natural. Peserta tidak perlu menebak harus klik apa setelah masuk kelas.
              </p>
              <div className="lms-feature-list">
                {capabilities.map(([title, copy]) => (
                  <div key={title}>
                    <CheckCircle2 size={19} />
                    <p><b>{title}</b><span>{copy}</span></p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lms-product-shot">
              <div className="lms-product-toolbar">
                <span />
                <span />
                <span />
                <b>Course Player</b>
              </div>
              <div className="lms-product-stage">
                <div className="lms-video-placeholder"><Play fill="currentColor" /></div>
                <div className="lms-lesson-panel">
                  <b>Materi berikutnya</b>
                  <p>Framework delegasi dan komunikasi eksekutif</p>
                  <i><em /></i>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lms-section" id="mentor">
          <div className="container">
            <div className="lms-section-row">
              <div className="lms-section-head compact">
                <span className="lms-eyebrow">Program unggulan</span>
                <h2>Kurikulum kepemimpinan yang siap dijalankan.</h2>
              </div>
              <Link href="/program" className="lms-btn lms-btn-secondary">
                Semua Program
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="course-grid lms-course-grid">
              {courses.length > 0 ? (
                courses.map(course => <CourseCard key={course.id} course={course} />)
              ) : (
                <div className="lms-empty-course">
                  <BookOpen size={36} />
                  <h3>Katalog sedang disiapkan</h3>
                  <p>Program akan muncul setelah mentor menerbitkan kurikulum di dashboard.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="lms-section lms-insight" id="insight">
          <div className="container lms-insight-grid">
            <div>
              <span className="lms-eyebrow">Standar produksi</span>
              <h2>Rapi di layar besar, tetap nyaman di smartphone.</h2>
              <p>
                Layout responsif, spacing konsisten, CTA jelas, card stabil, focus state aksesibel, dan micro-interaction ringan membuat LMS terasa matang untuk pengguna nyata.
              </p>
            </div>
            <div className="lms-insight-cards">
              <article><ShieldCheck /><b>Akses aman</b><span>Role dan session diarahkan sesuai kebutuhan pengguna.</span></article>
              <article><BarChart3 /><b>Data terlihat</b><span>Metrik progres, evaluasi, dan aktivitas mudah dipindai.</span></article>
              <article><Users2 /><b>Multi-role</b><span>Admin, Mentor, dan Peserta punya dashboard berbeda.</span></article>
            </div>
          </div>
        </section>

        <section className="lms-outcomes" aria-labelledby="outcomes-title">
          <div className="container lms-outcomes-grid">
            <div>
              <span className="lms-eyebrow">Yang dibawa pulang</span>
              <h2 id="outcomes-title">Setiap pembelajaran meninggalkan jejak.</h2>
              <p>Progress terlihat bukan hanya dari persentase, tetapi dari cara peserta mengambil keputusan dan menggerakkan tim setelah kelas selesai.</p>
            </div>
            <div className="lms-outcome-list">
              <div><span>01</span><p><b>Clarity</b><small>Melihat masalah, peran, dan prioritas dengan lebih jernih.</small></p></div>
              <div><span>02</span><p><b>Capability</b><small>Mengubah insight menjadi percakapan dan keputusan yang lebih baik.</small></p></div>
              <div><span>03</span><p><b>Continuity</b><small>Menjaga ritme refleksi agar perubahan bertahan di luar ruang kelas.</small></p></div>
            </div>
          </div>
        </section>

        <section className="lms-final-cta">
          <div className="container">
            <div className="lms-final-box">
              <span className="lms-eyebrow">Mulai dari sini</span>
              <h2>Bangun kapasitas kepemimpinan dengan sistem belajar yang jelas.</h2>
              <p>Masuk ke katalog, pilih program, lanjutkan materi, tuntaskan evaluasi, lalu dapatkan sertifikat PROFAS.</p>
              <div>
                <Link href="/daftar" className="lms-btn lms-btn-primary">Daftar Sekarang <ArrowRight size={18} /></Link>
                <Link href="/masuk" className="lms-btn lms-btn-secondary">Masuk Dashboard</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
