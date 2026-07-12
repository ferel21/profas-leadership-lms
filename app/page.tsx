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
        <section className="relative pt-12 pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100" aria-labelledby="home-title">
          {/* Animated Glow Blobs (Inspired by Akses Legal) */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute -top-24 left-1/4 w-[480px] h-[480px] bg-teal-500/20 rounded-full blur-[130px] animate-blob mix-blend-multiply" />
            <div className="absolute -bottom-24 right-1/4 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] animate-blob mix-blend-multiply animation-delay-2000" />
            <div className="absolute top-1/3 right-1/3 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[120px] animate-blob mix-blend-multiply animation-delay-4000" />
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px]" />
          </div>

          <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* LEFT COLUMN: Copy & Actions (7 columns on desktop) */}
              <div className="lg:col-span-7 flex flex-col justify-center text-left relative z-20">
                <div className="flex items-start mb-6">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 border border-teal-500/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all cursor-default">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Ekosistem LMS #1 Terstruktur & Terverifikasi
                    </span>
                  </div>
                </div>

                <h1 id="home-title" className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.08] tracking-tight text-slate-900 mb-6">
                  Belajar memimpin
                  <span className="block mt-2 bg-gradient-to-r from-teal-600 via-emerald-600 to-blue-600 bg-clip-text text-transparent font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-tight">
                    dengan dampak nyata & terukur.
                  </span>
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed font-normal mb-8">
                  Ruang belajar terstruktur berbasis studi kasus nyata untuk mengubah wawasan menjadi keputusan strategis, kebiasaan kerja efektif, dan capaian kepemimpinan yang terverifikasi.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    href="/daftar"
                    className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-teal-600/30 hover:shadow-teal-600/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="text-lg tracking-wide">Mulai Sekarang</span>
                    <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/program"
                    className="px-8 py-4 rounded-2xl bg-white/95 text-slate-800 font-bold border border-slate-200/90 flex items-center justify-center gap-3 hover:border-teal-500 hover:text-teal-700 hover:shadow-md transition-all duration-300 group"
                  >
                    <Play className="size-5 text-teal-600 group-hover:scale-110 transition-transform" fill="currentColor" />
                    <span className="text-lg">Lihat Program</span>
                  </Link>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-10 pt-8 border-t border-slate-200/80" aria-label="Ringkasan kepercayaan platform">
                  <div className="flex -space-x-3 items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-xs font-black text-white shadow-sm">RD</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-xs font-black text-white shadow-sm">NP</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-purple-600 to-pink-400 flex items-center justify-center text-xs font-black text-white shadow-sm">AY</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">+2k</div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="size-4 fill-current" />
                      <Star className="size-4 fill-current" />
                      <Star className="size-4 fill-current" />
                      <Star className="size-4 fill-current" />
                      <Star className="size-4 fill-current" />
                      <span className="ml-1.5 text-xs font-extrabold text-slate-900">4.9/5</span>
                    </div>
                    <span className="text-xs font-medium text-slate-600 mt-0.5">
                      dari <strong className="text-slate-800 font-bold">2.500+ Alumni Puas</strong> di seluruh Indonesia
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Visual & Floating Badges (5 columns on desktop) */}
              <div className="lg:col-span-5 relative flex flex-col items-center justify-center w-full z-10 pt-6 lg:pt-0">
                <div className="w-full flex justify-between items-center mb-3 px-2 text-slate-500 text-xs font-mono font-semibold uppercase tracking-wider">
                  <span className="px-2.5 py-1 rounded bg-teal-50 text-teal-800 font-bold border border-teal-200/60">Field Note / 01</span>
                  <span>Makassar · Indonesia</span>
                </div>

                <figure className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl bg-slate-900 group">
                  <Image
                    src="/images/profas-activity-collage.jpeg"
                    alt="Peserta PROFAS berdiskusi dan berlatih dalam ruang pembelajaran"
                    width={1599}
                    height={899}
                    priority
                    className="w-full h-auto aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                  <figcaption className="bg-slate-900/95 backdrop-blur-md px-5 py-3.5 text-xs text-slate-300 flex items-center justify-between border-t border-slate-800">
                    <span>Belajar memimpin lewat ruang, percakapan, dan praktik nyata.</span>
                    <span className="text-teal-400 font-extrabold flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="size-4 text-teal-400" /> Live Case
                    </span>
                  </figcaption>
                </figure>

                {/* Floating Glass Badge 1: Top Right */}
                <div className="absolute -top-4 -right-2 md:-right-6 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3 md:p-3.5 flex items-center gap-3 animate-float-medium">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/30 shrink-0">
                    <ShieldCheck className="size-5 md:size-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Digital Seal</p>
                    <p className="text-xs md:text-sm font-black text-slate-800 leading-none mt-0.5">Terverifikasi Resmi!</p>
                  </div>
                </div>

                {/* Floating Glass Badge 2: Side Center Left */}
                <div className="absolute top-1/3 -left-2 md:-left-6 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3 md:p-3.5 flex items-center gap-3 animate-float-sway">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
                    <Sparkles className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Powered by</p>
                    <p className="text-xs md:text-sm font-black text-slate-800 leading-none mt-0.5">31 AI Skills Engine</p>
                  </div>
                </div>

                {/* Dashboard Preview Card at Bottom Right */}
                <aside className="mt-4 lg:mt-0 lg:absolute lg:-bottom-10 lg:-right-6 z-30 w-full sm:w-80 bg-white/95 backdrop-blur-md border border-slate-200/95 shadow-2xl rounded-2xl p-4 md:p-5" aria-label="Cuplikan dashboard LMS">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold block">Dashboard Peserta</span>
                      <b className="text-xs md:text-sm font-black text-slate-900 block mt-0.5">Strategic Leadership</b>
                    </div>
                    <span className="bg-emerald-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full">Live</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3">
                    <span className="text-xs font-semibold text-slate-600">Progres Program</span>
                    <strong className="text-sm font-black text-teal-600">85%</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-teal-50/70 border border-teal-100/80 rounded-xl p-2">
                      <BookOpen className="size-4 text-teal-600 mx-auto mb-1" />
                      <b className="font-black text-slate-900 block">18</b>
                      <span className="text-[10px] text-slate-500">Materi selesai</span>
                    </div>
                    <div className="bg-blue-50/70 border border-blue-100/80 rounded-xl p-2">
                      <ClipboardCheck className="size-4 text-blue-600 mx-auto mb-1" />
                      <b className="font-black text-slate-900 block">94</b>
                      <span className="text-[10px] text-slate-500">Skor evaluasi</span>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            {/* Live Ticker Marquee Strip */}
            <div className="mt-20 lg:mt-24 w-full max-w-5xl mx-auto bg-white/85 backdrop-blur-md border border-slate-200/90 rounded-full py-3 px-6 shadow-md overflow-hidden relative">
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
