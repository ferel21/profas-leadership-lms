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
        <section className="lms-hero relative pt-12 pb-20 overflow-hidden" aria-labelledby="home-title">
          {/* Animated Glow Blobs (Inspired by Akses Legal) */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute -top-24 left-1/4 w-[480px] h-[480px] bg-teal-500/25 rounded-full blur-[130px] animate-blob mix-blend-multiply" />
            <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] animate-blob mix-blend-multiply animation-delay-2000" />
            <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-amber-500/20 rounded-full blur-[120px] animate-blob mix-blend-multiply animation-delay-4000" />
          </div>

          <div className="container lms-hero-grid relative z-10">
            <div className="lms-hero-copy">
              <div className="flex items-start mb-4">
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 border border-teal-500/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all cursor-default">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ekosistem LMS #1 Terstruktur & Terverifikasi
                  </span>
                </div>
              </div>

              <h1 id="home-title" className="lms-title-fresh text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-slate-900 mb-6">
                Belajar memimpin
                <span className="block mt-2 text-teal-600 font-extrabold text-3xl md:text-4xl tracking-tight">
                  dengan dampak nyata & terukur.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed font-medium mb-8">
                Ruang belajar terstruktur berbasis studi kasus nyata untuk mengubah wawasan menjadi keputusan strategis, kebiasaan kerja efektif, dan capaian kepemimpinan yang terverifikasi.
              </p>

              <div className="lms-hero-actions flex flex-col sm:flex-row gap-4">
                <Link
                  href="/daftar"
                  className="group relative px-8 h-14 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-teal-600/30 hover:shadow-teal-600/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <span className="text-lg tracking-wide">Mulai Sekarang</span>
                  <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/program"
                  className="px-8 h-14 rounded-2xl bg-white/95 text-slate-800 font-bold border border-slate-200/90 flex items-center justify-center gap-3 hover:border-teal-500 hover:text-teal-700 hover:shadow-md transition-all duration-300 group"
                >
                  <Play className="size-5 text-teal-600 group-hover:scale-110 transition-transform" fill="currentColor" />
                  <span className="text-lg">Lihat Program</span>
                </Link>
              </div>

              <div className="lms-hero-trust flex items-center gap-5 mt-8 pt-6 border-t border-slate-200/60" aria-label="Ringkasan kepercayaan platform">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-xs font-black text-white shadow-sm">RD</div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-xs font-black text-white shadow-sm">NP</div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-purple-600 to-pink-400 flex items-center justify-center text-xs font-black text-white shadow-sm">AY</div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">+2k</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-1 text-amber-500">
                    <Star className="size-4 fill-current" />
                    <Star className="size-4 fill-current" />
                    <Star className="size-4 fill-current" />
                    <Star className="size-4 fill-current" />
                    <Star className="size-4 fill-current" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 mt-0.5">
                    <span className="text-slate-900 font-extrabold">4.9/5</span> dari 2.500+ Alumni Puas
                  </span>
                </div>
              </div>
            </div>

            {/* Visual with Floating Micro-Animated Badges (Akses Legal signature) */}
            <div className="lms-hero-visual relative">
              <div className="lms-hero-visual-topline">
                <span className="px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 font-bold border border-teal-200/60">Field Note / 01</span>
                <span>Makassar · Indonesia</span>
              </div>

              <figure className="lms-hero-photo relative z-10 transition-transform duration-500 hover:scale-[1.015]">
                <Image
                  src="/images/profas-activity-collage.jpeg"
                  alt="Peserta PROFAS berdiskusi dan berlatih dalam ruang pembelajaran"
                  width={1599}
                  height={899}
                  priority
                  sizes="(max-width: 780px) 100vw, 48vw"
                />
                <figcaption className="flex items-center justify-between">
                  <span>Belajar memimpin lewat ruang, percakapan, dan praktik nyata.</span>
                  <span className="text-teal-400 font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Live Case
                  </span>
                </figcaption>
              </figure>

              {/* Floating Glass Badge 1: Top Right */}
              <div className="glass-badge-top animate-float-medium">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/30 flex-shrink-0">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Digital Seal</p>
                  <p className="text-sm font-black text-slate-800 leading-none">Terverifikasi Resmi!</p>
                </div>
              </div>

              {/* Floating Glass Badge 2: Side Center */}
              <div className="glass-badge-side animate-float-sway">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 flex-shrink-0">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Powered by</p>
                  <p className="text-sm font-black text-slate-800 leading-none">31 AI Skills Engine</p>
                </div>
              </div>

              {/* Floating Glass Badge 3: Bottom Left */}
              <div className="glass-badge-bottom animate-float-fast">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/30 flex-shrink-0">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Multi-Export</p>
                  <p className="text-sm font-black text-slate-800 leading-none">Excel, PDF & PPTX</p>
                </div>
              </div>

              <aside className="lms-dashboard-preview relative z-20" aria-label="Cuplikan dashboard LMS">
                <div className="lms-preview-top">
                  <div>
                    <span>Dashboard Peserta</span>
                    <b>Strategic Leadership</b>
                  </div>
                  <small className="bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">Live</small>
                </div>
                <div className="lms-progress-card">
                  <div>
                    <span>Progres Program</span>
                    <strong>85%</strong>
                  </div>
                  <i><em style={{ width: "85%" }} /></i>
                </div>
                <div className="lms-preview-grid">
                  <div>
                    <BookOpen size={18} className="text-teal-600" />
                    <b>18</b>
                    <span>Materi selesai</span>
                  </div>
                  <div>
                    <ClipboardCheck size={18} className="text-blue-600" />
                    <b>94</b>
                    <span>Skor evaluasi</span>
                  </div>
                </div>
                <div className="lms-preview-list">
                  <p><CheckCircle2 className="text-emerald-500 size-4" /> Modul keputusan strategis selesai</p>
                  <p><FileText className="text-blue-500 size-4" /> Jurnal refleksi & PPTX tersimpan</p>
                  <p><Award className="text-amber-500 size-4" /> Sertifikat siap dengan stempel digital</p>
                </div>
              </aside>
              <span className="lms-hero-visual-note">Lead / Learn / Practice</span>
            </div>
          </div>

          {/* Live Ticker Marquee Strip */}
          <div className="ticker-marquee-box relative z-10">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-10">
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> Terverifikasi Kemenkumham & Kurikulum Eksekutif
              </span>
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> Ekspor Multi-Format Langsung (Excel, PDF, PPTX, DOCX)
              </span>
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> Role Access Control (RAC) Admin, Mentor & Peserta
              </span>
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> 40+ Modul Studi Kasus Kepemimpinan Nyata
              </span>
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> Sertifikat Digital Akreditasi Industri Terkemuka
              </span>
              {/* Duplicate for seamless loop */}
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> Terverifikasi Kemenkumham & Kurikulum Eksekutif
              </span>
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> Ekspor Multi-Format Langsung (Excel, PDF, PPTX, DOCX)
              </span>
              <span className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <CheckCircle2 className="size-4 text-teal-600" /> Role Access Control (RAC) Admin, Mentor & Peserta
              </span>
            </div>
          </div>
        </section>

        <section className="lms-metrics relative z-10" aria-label="Statistik PROFAS">
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
