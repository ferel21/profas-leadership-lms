import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Gauge,
  Layers3,
  LineChart,
  Play,
  ShieldCheck,
  Star,
  Target,
  Users2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";
import { LandingScrollDirector } from "@/components/LandingScrollDirector";
import { LandingScrollStackSection } from "@/components/LandingScrollStackSection";

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

const faqItems = [
  ["Siapa yang paling cocok mengikuti PROFAS?", "PROFAS cocok untuk calon pemimpin, pemimpin yang sedang bertumbuh, pemilik usaha, dan organisasi yang ingin membangun kebiasaan kepemimpinan yang lebih konsisten."],
  ["Bagaimana format belajar di dalam platform?", "Setiap program memadukan materi singkat, video atau bacaan, studi kasus, refleksi, kuis, tugas, dan percakapan agar insight langsung terhubung dengan situasi kerja."],
  ["Apakah saya bisa belajar lewat smartphone?", "Bisa. Course player, progres, diskusi, dan dashboard dirancang responsif sehingga Anda dapat belajar dari desktop maupun smartphone."],
  ["Apa yang saya dapatkan setelah menyelesaikan program?", "Peserta mendapatkan rekam progres pembelajaran dan sertifikat PROFAS setelah seluruh persyaratan program, materi, dan evaluasi terpenuhi."],
  ["Apakah tersedia program untuk organisasi atau tim?", "Tersedia. Tim dapat menggunakan jalur pembelajaran yang lebih terarah untuk menyamakan bahasa kepemimpinan, praktik kerja, dan ukuran capaian."],
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
    <div className="al-page">
      <Header />
      <LandingScrollDirector />
      <main>
        <section className="al-hero" aria-labelledby="home-title">
          {/* Gradient blobs */}
          <div className="al-blob al-blob--blue" aria-hidden="true" />
          <div className="al-blob al-blob--gold" aria-hidden="true" />

          <div className="container al-hero-grid">
            {/* Text column */}
            <div className="al-hero-copy">
              <div className="al-badge-pill">
                <span className="al-badge-dot" />
                <span>Platform Leadership #1 Terpercaya</span>
              </div>

              <h1 id="home-title" className="al-hero-title">
                Pimpin dengan lebih jernih!
                <span>Belajar. Mencoba. Berdampak.</span>
              </h1>

              <p className="al-hero-desc">
                PROFAS membantu pemimpin, calon pemimpin, dan organisasi mengubah insight menjadi keputusan yang lebih baik melalui kelas yang dekat dengan tantangan nyata.
              </p>

              <div className="al-hero-actions">
                <Link href="/daftar" className="al-btn-primary">
                  <span>Mulai Sekarang</span>
                  <ArrowRight size={22} />
                </Link>
                <Link href="/program" className="al-btn-green">
                  <BookOpen size={22} />
                  <span>Lihat Program</span>
                </Link>
                <a href="#eksekutif-stack" className="al-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Layers3 size={20} />
                  <span>3D Scroll Stack</span>
                </a>
              </div>

              <div className="al-proof-row">
                <div className="al-avatar-row" aria-hidden="true">
                  <span>RD</span><span>NP</span><span>AY</span><span>+2k</span>
                </div>
                <div className="al-rating-block">
                  <div className="al-stars">
                    <Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" />
                    <b>4.9/5</b>
                  </div>
                  <small>Dipercaya 2.500+ alumni di seluruh Indonesia</small>
                </div>
              </div>

              <div className="al-trust-row">
                <div className="al-trust-item">
                  <ShieldCheck size={20} />
                  <span>Sertifikat Resmi</span>
                </div>
                <div className="al-trust-item">
                  <Target size={20} />
                  <span>Proses Terstruktur</span>
                </div>
                <div className="al-trust-item">
                  <CheckCircle2 size={20} />
                  <span>Kurikulum Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* Visual column */}
            <div className="al-hero-visual" data-scroll-speed="-0.1">
              <div className="al-hero-img-wrap">
                <Image
                  src="/images/profas-leadership-hero.webp"
                  alt="Mentor dan peserta PROFAS berdiskusi dalam sesi pembelajaran kepemimpinan"
                  width={1100}
                  height={1250}
                  priority
                  sizes="(max-width: 820px) 100vw, 52vw"
                />
                <div className="al-hero-img-gradient" />
              </div>

              {/* Floating card top-right */}
              <aside className="al-float-card al-float-card--top">
                <div className="al-float-icon al-float-icon--green">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <small>Progress Belajar</small>
                  <strong>73% <em>+12 minggu ini</em></strong>
                </div>
              </aside>

              {/* Floating card bottom-left */}
              <aside className="al-float-card al-float-card--bottom">
                <div className="al-stars-small">
                  <Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" /><Star size={13} fill="currentColor" />
                </div>
                <p className="al-float-quote">&ldquo;Prosesnya sangat terstruktur dan mentor-nya berpengalaman!&rdquo;</p>
                <div className="al-float-author">
                  <span />
                  <small>Alumni, Batch 2025</small>
                </div>
              </aside>

              {/* Marquee strip */}
              <div className="al-marquee-wrap">
                <div className="al-marquee">
                  {["Leadership Essentials", "Komunikasi Eksekutif", "Delegasi Efektif", "Manajemen Konflik", "Strategic Thinking", "Leadership Essentials", "Komunikasi Eksekutif", "Delegasi Efektif", "Manajemen Konflik", "Strategic Thinking"].map((item, i) => (
                    <span key={i} className="al-marquee-item">
                      <CheckCircle2 size={16} />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="container al-metrics" aria-label="Statistik PROFAS">
            {metrics.map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
        </section>

        <LandingScrollStackSection />

        <section className="al-section al-section--white al-activity al-overlap-section" aria-labelledby="activity-title">
          <div className="container">
            <div className="al-activity-intro">
              <div>
                <span className="al-eyebrow">Belajar dalam aksi</span>
                <h2 id="activity-title">Kepemimpinan tumbuh di ruang yang dijalani bersama.</h2>
              </div>
              <p>Kelas PROFAS mempertemukan refleksi, praktik, dan percakapan yang membuat pembelajaran terasa dekat dengan tantangan kerja sehari-hari.</p>
            </div>
            <figure className="al-activity-frame" data-scroll-speed="0.045">
              <Image src="/images/profas-activity-collage.jpeg" alt="Kolase kegiatan pembelajaran dan diskusi peserta PROFAS Leadership" width={1599} height={899} sizes="(max-width: 780px) calc(100vw - 28px), 1160px" />
              <figcaption>Potret proses belajar: berdiskusi, mencoba, dan bertumbuh sebagai satu komunitas.</figcaption>
            </figure>
          </div>
        </section>

        <section className="al-section al-section--gray al-method-section al-overlap-section" aria-labelledby="method-title">
          <div className="container">
            <div className="al-method-heading">
              <div><span className="al-eyebrow">Cara kami bekerja</span><h2 id="method-title">Kepemimpinan bukan teori yang disimpan.</h2></div>
              <p>PROFAS menghubungkan insight dengan tindakan melalui ritme belajar yang singkat, reflektif, dan relevan dengan ruang kerja peserta.</p>
            </div>
            <div className="al-method-grid">
              {learningMethod.map(({ icon: Icon, index, title, copy }) => <article key={title} className="al-method-card"><div className="al-method-card-top"><Icon size={22} /><span>{index}</span></div><h3>{title}</h3><p>{copy}</p></article>)}
            </div>
          </div>
        </section>

        <section className="al-section al-section--white" id="tentang">
          <div className="container">
            <div className="al-section-head"><span className="al-eyebrow">Sistem yang siap dipakai</span><h2>Satu platform untuk seluruh alur LMS profesional.</h2><p>PROFAS dirancang sebagai sistem operasional pembelajaran, bukan halaman promosi kosong. Setiap role punya ruang kerja dan alur yang jelas.</p></div>
            <div className="al-pathway-grid">
              {pathways.map(({ icon: Icon, title, copy }) => <article key={title} className="al-pathway-card"><span><Icon size={24} /></span><h3>{title}</h3><p>{copy}</p><Link href={title === "Peserta" ? "/program" : "/masuk"}>Masuk alur {title}<ChevronRight size={16} /></Link></article>)}
            </div>
          </div>
        </section>

        <section className="al-section al-section--gray al-player-section al-overlap-section">
          <div className="container al-split">
            <div><span className="al-eyebrow">Pengalaman belajar</span><h2>Course player yang terasa seperti produk SaaS, bukan folder materi.</h2><p>Materi, diskusi, lampiran, catatan, progres, evaluasi, dan tombol penyelesaian ditempatkan dalam alur yang natural. Peserta tidak perlu menebak harus klik apa setelah masuk kelas.</p><div className="al-feature-list">{capabilities.map(([title, copy]) => <div key={title}><CheckCircle2 size={19} /><p><b>{title}</b><span>{copy}</span></p></div>)}</div></div>
            <div className="al-mockup" data-scroll-speed="-0.055"><div className="al-mockup-toolbar"><span /><span /><span /><b>Course Player</b></div><div className="al-mockup-stage"><div className="al-video-placeholder"><Play fill="currentColor" /></div><div className="al-lesson-panel"><b>Materi berikutnya</b><p>Framework delegasi dan komunikasi eksekutif</p><i><em /></i></div></div></div>
          </div>
        </section>

        <section className="al-section al-section--white" id="mentor">
          <div className="container">
            <div className="al-section-row"><div className="al-section-head compact"><span className="al-eyebrow">Program unggulan</span><h2>Kurikulum kepemimpinan yang siap dijalankan.</h2></div><Link href="/program" className="al-btn-secondary">Semua Program<ArrowRight size={17} /></Link></div>
            <div className="course-grid">{courses.length > 0 ? courses.map(course => <CourseCard key={course.id} course={course} />) : <div className="al-empty-course"><BookOpen size={36} /><h3>Katalog sedang disiapkan</h3><p>Program akan muncul setelah mentor menerbitkan kurikulum di dashboard.</p></div>}</div>
          </div>
        </section>

        <section className="al-section al-insight al-overlap-section" id="insight">
          <div className="container al-insight-grid"><div><span className="al-eyebrow">Standar produksi</span><h2>Rapi di layar besar, tetap nyaman di smartphone.</h2><p>Layout responsif, spacing konsisten, CTA jelas, card stabil, focus state aksesibel, dan micro-interaction ringan membuat LMS terasa matang untuk pengguna nyata.</p></div><div className="al-insight-cards"><article><ShieldCheck /><b>Akses aman</b><span>Role dan session diarahkan sesuai kebutuhan pengguna.</span></article><article><BarChart3 /><b>Data terlihat</b><span>Metrik progres, evaluasi, dan aktivitas mudah dipindai.</span></article><article><Users2 /><b>Multi-role</b><span>Admin, Mentor, dan Peserta punya dashboard berbeda.</span></article></div></div>
        </section>

        <section className="al-section al-section--white al-outcomes" aria-labelledby="outcomes-title"><div className="container al-outcomes-grid"><div><span className="al-eyebrow">Yang dibawa pulang</span><h2 id="outcomes-title">Setiap pembelajaran meninggalkan jejak.</h2><p>Progress terlihat bukan hanya dari persentase, tetapi dari cara peserta mengambil keputusan dan menggerakkan tim setelah kelas selesai.</p></div><div className="al-outcome-list"><div><span>01</span><p><b>Clarity</b><small>Melihat masalah, peran, dan prioritas dengan lebih jernih.</small></p></div><div><span>02</span><p><b>Capability</b><small>Mengubah insight menjadi percakapan dan keputusan yang lebih baik.</small></p></div><div><span>03</span><p><b>Continuity</b><small>Menjaga ritme refleksi agar perubahan bertahan di luar ruang kelas.</small></p></div></div></div></section>

        <section className="al-section al-section--gray al-faq" id="faq" aria-labelledby="faq-title">
          <div className="container al-faq-grid">
            <div className="al-faq-intro">
              <span className="al-eyebrow">Pertanyaan umum</span>
              <h2 id="faq-title">Sebelum mulai, pastikan jalurnya terasa tepat.</h2>
              <p>Jawaban singkat untuk membantu Anda memilih langkah pertama di PROFAS dengan lebih percaya diri.</p>
              <div className="al-faq-aside">
                <div className="al-faq-aside-icon"><Users2 size={20} /></div>
                <div>
                  <b>Untuk kebutuhan tim</b>
                  <span>Bangun satu bahasa kepemimpinan di organisasi Anda.</span>
                  <a href="mailto:halo@profas.id?subject=Program%20Kepemimpinan%20Organisasi">Diskusikan kebutuhan tim <ArrowRight size={16} /></a>
                </div>
              </div>
            </div>
            <div className="al-faq-list">
              {faqItems.map(([question, answer]) => <details key={question}>
                <summary><span>{question}</span><span className="al-faq-chevron" aria-hidden="true"><ChevronRight size={18} /></span></summary>
                <p>{answer}</p>
              </details>)}
            </div>
          </div>
        </section>

        <section className="al-section al-final-cta"><div className="container"><div className="al-final-box"><span className="al-eyebrow">Mulai dari sini</span><h2>Bangun kapasitas kepemimpinan dengan sistem belajar yang jelas.</h2><p>Masuk ke katalog, pilih program, lanjutkan materi, tuntaskan evaluasi, lalu dapatkan sertifikat PROFAS.</p><div><Link href="/daftar" className="al-btn-primary">Daftar Sekarang<ArrowRight size={18} /></Link><Link href="/masuk" className="al-btn-secondary">Masuk Dashboard</Link></div></div></div></section>
      </main>
      <Footer />
    </div>
  );
}
