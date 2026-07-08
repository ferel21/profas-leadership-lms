import Link from "next/link";
import { 
  ArrowRight, Check, Star, Target, Users2, 
  Award, BookOpen, ShieldCheck, Play, CheckCircle2, 
  BarChart3, Globe 
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";

export default async function Home() {
  const courses = await prisma.course.findMany({ 
    where: { published: true, featured: true }, 
    include: { mentor: { select: { name: true } } }, 
    take: 3 
  });
  
  return (
    <>
      <Header />
      <main className="main-landing-shell">
        
        {/* 1. HERO SECTION CLEAN & LUMINOUS CYAN */}
        <section className="hero-clean">
          <div className="hero-glow-cyan" />
          <div className="hero-glow-teal" />
          
          <div className="container">
            <div className="hero-grid-clean">
              {/* Left Column: High-Impact Clean Typography */}
              <div>
                <div className="badge-pill-cyan">
                  <span className="dot-pulse" />
                  <span>✨ EKOSISTEM KEPEMIMPINAN #1 DI INDONESIA</span>
                </div>
                
                <h1 className="hero-title-clean">
                  Tumbuhkan Kapasitas Memimpin Yang <span className="cyan-text">Berdampak Nyata</span>
                </h1>
                
                <p className="hero-desc-clean">
                  Bukan sekadar teori manajerial biasa. PROFAS adalah platform pembelajaran kepemimpinan eksekutif dengan metodologi terukur (Pre & Post Test), studi kasus nyata, dan bimbingan langsung dari praktisi C-Level serta BUMN.
                </p>
                
                <div className="hero-btns-clean">
                  <Link href="/daftar" className="btn-cyan-primary">
                    Mulai Belajar Sekarang <ArrowRight size={18} />
                  </Link>
                  <Link href="/program" className="btn-cyan-secondary">
                    <Play size={18} fill="currentColor" color="#0891b2" /> Eksplorasi Kurikulum
                  </Link>
                </div>
                
                <div className="hero-footer-trust">
                  <div className="avatar-stack-badges">
                    <span className="avatar-badge-item bg-teal-600">RD</span>
                    <span className="avatar-badge-item bg-cyan-500">NP</span>
                    <span className="avatar-badge-item bg-sky-600">AY</span>
                    <span className="avatar-badge-item bg-amber-500">+2k</span>
                  </div>
                  <div>
                    <div className="star-rating-badge">
                      <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} />
                      <span>4.9 / 5.0</span>
                    </div>
                    <small className="trust-subtext">Dipercaya oleh 2.500+ Eksekutif & Founder di Indonesia</small>
                  </div>
                </div>
              </div>

              {/* Right Column: Structured Clean Mockup Card */}
              <div>
                <div className="hero-mockup-clean">
                  <div className="mockup-top-bar">
                    <div className="mockup-user">
                      <div className="user-avatar-clean">EK</div>
                      <div className="mockup-author">
                        <h4>Eka Kurniawan</h4>
                        <span>VP of Operations — BUMN</span>
                      </div>
                    </div>
                    <span className="badge-active-clean">
                      AKTIF BELAJAR
                    </span>
                  </div>

                  <div className="progress-box-clean">
                    <div className="progress-box-header">
                      <span>Modul 4: Strategic Decision Making</span>
                      <span>85%</span>
                    </div>
                    <div className="progress-track-clean">
                      <div className="progress-fill-cyan" />
                    </div>
                  </div>

                  <div className="stats-compare-grid">
                    <div className="compare-box">
                      <div className="compare-box-label">Nilai Pre-Test</div>
                      <div className="compare-box-value-pre">58 / 100</div>
                    </div>
                    <div className="compare-box highlight">
                      <div className="compare-box-label">Prospek Post-Test</div>
                      <div className="compare-box-value-post">94 / 100 🚀</div>
                    </div>
                  </div>

                  <div className="mockup-footer-banner">
                    <Award size={24} color="#0d9488" />
                    <div>
                      <b className="mockup-footer-title">Sertifikasi Kompetensi Eksekutif</b>
                      <span className="mockup-footer-desc">Terverifikasi Resmi & LinkedIn ID One-Click</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. ENTERPRISE STATS STRIP */}
        <section className="stats-strip-clean">
          <div className="container">
            <div className="stats-grid-clean">
              <div>
                <span className="stat-num-clean">2.500<span>+</span></span>
                <span className="stat-label-clean">Alumni Eksekutif Aktif</span>
              </div>
              <div>
                <span className="stat-num-clean">15<span>+</span></span>
                <span className="stat-label-clean">Mentor C-Level & Praktisi</span>
              </div>
              <div>
                <span className="stat-num-clean">87<span>%</span></span>
                <span className="stat-label-clean">Promosi Karir & Bisnis</span>
              </div>
              <div>
                <span className="stat-num-clean">40<span>+</span></span>
                <span className="stat-label-clean">Modul & Studi Kasus Nyata</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO GRID CLEAN (MENGAPA PROFAS) */}
        <section className="bento-section-clean" id="tentang">
          <div className="container">
            <div className="heading-clean">
              <span className="eyebrow-cyan">KEUNGGULAN EKOSISTEM</span>
              <h2>Mengapa Eksekutif Memilih <span>PROFAS?</span></h2>
              <p className="section-subtitle-clean">
                Kami meninggalkan metode kuliah satu arah yang membosankan dan menggantinya dengan sistem pelatihan interaktif berbasis kompetensi yang terstruktur.
              </p>
            </div>

            <div className="bento-grid-clean">
              {/* Card 1: Span 2 Col */}
              <div className="bento-card-clean span-2">
                <div>
                  <div className="icon-box-cyan">
                    <BarChart3 size={30} />
                  </div>
                  <h3>Metodologi Terukur: Pre-Test vs Post-Test</h3>
                  <p>
                    Setiap program dimulai dengan pemetaan kompetensi awal untuk mengidentifikasi gap kepemimpinan Anda. Setelah seluruh modul dan studi kasus diselesaikan, sistem akan mengukur peningkatan kompetensi secara kuantitatif yang objektif.
                  </p>
                </div>

                <div className="bento-visual-box">
                  <div className="bento-visual-compare-top">
                    <span>Kompetensi Delegasi & Strategi (Rata-rata Alumni)</span>
                    <span>+62% Peningkatan</span>
                  </div>
                  <div className="bento-visual-bars">
                    <div className="bento-bar-pre">
                      Pre: 58%
                    </div>
                    <div className="bento-bar-post">
                      Post: 94% ✨
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bento-card-clean">
                <div className="icon-box-cyan ecosystem-stat-box-teal">
                  <Users2 size={30} />
                </div>
                <h3>Mentor Praktisi Nyata</h3>
                <p>
                  Belajar langsung dari direktur BUMN, founder startup, dan eksekutif korporasi yang membagikan resep rahasia serta kegagalan yang pernah mereka hadapi di lapangan.
                </p>
                <div className="badge-tag-row">
                  <span className="badge-tag-cyan">⚡ C-Level Mentors</span>
                  <span className="badge-tag-cyan">🏢 BUMN & Swasta</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bento-card-clean">
                <div className="icon-box-cyan">
                  <Target size={30} />
                </div>
                <h3>Studi Kasus Kontekstual</h3>
                <p>
                  Kurikulum disesuaikan dengan iklim bisnis di Indonesia. Dari manajemen konflik di UMKM, efisiensi rantai pasok, hingga transformasi digital organisasi.
                </p>
                <div className="badge-tag-amber">
                  <CheckCircle2 size={18} /> 100% Relevan di Indonesia
                </div>
              </div>

              {/* Card 4: Span 2 Col */}
              <div className="bento-card-clean span-2">
                <div>
                  <div className="icon-box-cyan">
                    <ShieldCheck size={30} />
                  </div>
                  <h3>Sertifikasi Kompetensi & Integrasi LinkedIn</h3>
                  <p>
                    Setiap kelulusan dilindungi oleh sistem verifikasi digital berlisensi. Sertifikat Anda dilengkapi dengan Nomor ID Unik serta QR Code yang dapat diverifikasi oleh perusahaan atau rekruter secara instan dengan 1 klik.
                  </p>
                </div>

                <div className="badge-tag-row-lg">
                  <span className="badge-tag-primary-lg">
                    <Award size={16} /> Terakreditasi PROFAS
                  </span>
                  <span className="badge-tag-outline-lg">
                    <Globe size={16} /> LinkedIn One-Click Share
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PROGRAM UNGGULAN SECTION */}
        <section className="programs-section-clean">
          <div className="container">
            <div className="programs-top-row">
              <div>
                <span className="eyebrow-cyan">KURIKULUM UNGGULAN</span>
                <h2 className="programs-title-clean">
                  Pilih Jalur <span className="cyan-text">Kepemimpinan Anda</span>
                </h2>
              </div>
              <Link href="/program" className="btn-cyan-secondary btn-catalog-link">
                Lihat Semua Program ({courses.length > 0 ? courses.length + "+" : "40+"}) <ArrowRight size={16} />
              </Link>
            </div>

            <div className="course-grid">
              {courses.length > 0 ? (
                courses.map(course => <CourseCard key={course.id} course={course} />)
              ) : (
                <div className="course-empty-box">
                  <BookOpen size={48} className="text-cyan-600 mx-auto mb-4" />
                  <h3>Kurikulum Sedang Diperbarui</h3>
                  <p>Silakan kunjungi halaman katalog untuk melihat seluruh program kepemimpinan kami.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. ROADMAP TIMELINE CLEAN (DARK TEAL CONTRAST) */}
        <section className="roadmap-section-clean">
          <div className="container">
            <div className="heading-clean roadmap-heading-clean">
              <span className="eyebrow-cyan cyan-text">ROADMAP BELAJAR</span>
              <h2>Bagaimana Anda Akan <span className="cyan-text">Bertumbuh</span></h2>
              <p>
                Desain alur belajar yang terstruktur secara sekuensial agar setiap konsep kepemimpinan meresap dan dapat langsung dipraktikkan.
              </p>
            </div>

            <div className="roadmap-grid-clean">
              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean">01</div>
                <h3>Asesmen Awal</h3>
                <p>
                  Kerjakan Pre-Test diagnostik untuk mengidentifikasi kekuatan dan area kepemimpinan yang butuh pengasahan.
                </p>
              </div>

              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean border-teal-400 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.4)]">02</div>
                <h3>Modul Interaktif</h3>
                <p>
                  Pelajari video HD beresolusi tinggi, bacaan eksekutif, dan framework manajerial yang bisa diunduh kapan saja.
                </p>
              </div>

              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean border-cyan-300 text-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.4)]">03</div>
                <h3>Uji Studi Kasus</h3>
                <p>
                  Terapkan ilmu pada simulasi kasus bisnis dan kuis akhir modul (Post-Test) untuk mengukur lonjakan kompetensi.
                </p>
              </div>

              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean border-sky-200 text-sky-200 shadow-[0_0_20px_rgba(165,243,252,0.4)]">04</div>
                <h3>Sertifikasi Eksekutif</h3>
                <p>
                  Raih sertifikat kelulusan resmi berlisensi PROFAS dan tunjukkan kredensial baru Anda ke jaringan LinkedIn.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. ECOSYSTEM SHOWCASE */}
        <section className="ecosystem-section-clean">
          <div className="container">
            {/* For Students */}
            <div className="split-row-clean">
              <div>
                <span className="eyebrow-cyan">PENGALAMAN PESERTA</span>
                <h2 className="ecosystem-title-clean">
                  Belajar Fleksibel Sesuai <br /><span className="cyan-text">Jadwal Eksekutif Anda</span>
                </h2>
                <p className="ecosystem-desc-clean">
                  Kami paham padatnya jadwal rapat dan kepemimpinan Anda. Fitur pintar PROFAS menyimpan progres Anda secara real-time di cloud, memungkinkan Anda melanjutkan materi tepat di detik Anda berhenti.
                </p>

                <ul className="feature-list-clean">
                  <li className="ecosystem-feature-item">
                    <div className="icon-check-cyan"><Check size={18} /></div>
                    <div>
                      <h4>Multi-Device Cloud Sync</h4>
                      <p>Akses dari laptop di kantor, tablet saat perjalanan, atau ponsel pintar di rumah tanpa kehilangan jejak.</p>
                    </div>
                  </li>
                  <li className="ecosystem-feature-item">
                    <div className="icon-check-cyan"><Check size={18} /></div>
                    <div>
                      <h4>Pembahasan Kuis Instan</h4>
                      <p>Dapatkan umpan balik langsung atas jawaban Anda untuk memahami logika di balik setiap keputusan manajerial.</p>
                    </div>
                  </li>
                  <li className="ecosystem-feature-item">
                    <div className="icon-check-cyan"><Check size={18} /></div>
                    <div>
                      <h4>Komunitas & Forum Diskusi</h4>
                      <p>Bertukar pikiran dan bangun jaringan profesional dengan sesama pemimpin dari seluruh Indonesia.</p>
                    </div>
                  </li>
                </ul>

                <Link href="/daftar" className="btn-cyan-primary mt-4">
                  Buat Akun Peserta <ArrowRight size={18} />
                </Link>
              </div>

              <div>
                <div className="ecosystem-card-stats">
                  <div className="ecosystem-browser-dots">
                    <div className="dot-red" />
                    <div className="dot-amber" />
                    <div className="dot-green" />
                    <span className="ecosystem-browser-url">profas-lms.app/dashboard</span>
                  </div>
                  <h4 className="ecosystem-stats-title">📈 Statistik Pembelajaran Anda</h4>
                  <div className="ecosystem-stats-grid">
                    <div className="ecosystem-stat-box-cyan">
                      <div className="label">Modul Selesai</div>
                      <div className="val">18 / 20</div>
                    </div>
                    <div className="ecosystem-stat-box-teal">
                      <div className="label">Skor Kompetensi</div>
                      <div className="val">96.5%</div>
                    </div>
                  </div>
                  <div className="ecosystem-ready-banner">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 color="#16a34a" size={26} />
                      <div>
                        <b>Strategic Leadership</b>
                        <small>Sertifikat Terbit</small>
                      </div>
                    </div>
                    <span className="ecosystem-ready-tag">READY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* For Mentors */}
            <div className="split-row-clean reverse">
              <div>
                <span className="eyebrow-cyan teal-text">UNTUK MENTOR & INSTITUSI</span>
                <h2 className="ecosystem-title-clean">
                  Course Builder Canggih <br /><span className="teal-text">Tanpa Batasan Teknis</span>
                </h2>
                <p className="ecosystem-desc-clean">
                  Platform PROFAS memberi kebebasan penuh bagi Anda untuk menyusun kurikulum. Unggah video materi, dokumen panduan, kuis otomatis, atau ujian essay cukup dengan *drag-and-drop*.
                </p>

                <ul className="feature-list-clean">
                  <li className="ecosystem-feature-item">
                    <div className="icon-check-cyan ecosystem-stat-box-teal"><Check size={18} /></div>
                    <div>
                      <h4>Builder Hierarkis (Bab & Modul)</h4>
                      <p>Susun struktur materi dari tingkat dasar hingga lanjutan dengan kemudahan pengaturan urutan materi.</p>
                    </div>
                  </li>
                  <li className="ecosystem-feature-item">
                    <div className="icon-check-cyan ecosystem-stat-box-teal"><Check size={18} /></div>
                    <div>
                      <h4>Sistem Penilaian Otomatis</h4>
                      <p>Hemat waktu Anda dengan sistem grading otomatis untuk evaluasi pilihan ganda dan analisa performa kelas.</p>
                    </div>
                  </li>
                </ul>

                <Link href="mailto:halo@profas.id?subject=Pendaftaran Mentor" className="btn-cyan-secondary mt-4 border-teal-600 text-teal-700">
                  Bergabung Sebagai Mentor <ArrowRight size={18} />
                </Link>
              </div>

              <div>
                <div className="ecosystem-card-stats mentor">
                  <div className="ecosystem-mentor-header">
                    <h4>🛠️ Mentor Course Builder</h4>
                    <span className="ecosystem-pub-tag">PUBLISHED</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="ecosystem-mentor-item cyan">
                      <span>📄 Bab 1: Fondasi Kepemimpinan</span>
                      <span>3 Modul</span>
                    </div>
                    <div className="ecosystem-mentor-item teal">
                      <span>🎥 Bab 2: Komunikasi Eksekutif (HD Video)</span>
                      <span>5 Modul</span>
                    </div>
                    <div className="ecosystem-mentor-item green">
                      <span>📝 Bab 3: Evaluasi Post-Test & Studi Kasus</span>
                      <span>Kuis Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. TESTIMONIALS CLEAN */}
        <section className="testimonials-section-clean" id="insight">
          <div className="container">
            <div className="heading-clean">
              <span className="eyebrow-cyan">BUKTI NYATA ALUMNI</span>
              <h2>Dipercaya Oleh Para <span>Pemimpin & Profesional</span></h2>
            </div>

            <div className="testi-grid-clean">
              <div className="testi-card-clean">
                <div className="testi-stars-clean">
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p className="testi-quote-clean">
                  &quot;Modul Strategic Leadership di PROFAS sangat aplikatif. Tidak bertele-tele dengan teori, langsung membedah studi kasus nyata yang relevan dengan tantangan tim saya di korporasi.&quot;
                </p>
                <div className="testi-author-box">
                  <div className="testi-avatar-icon bg-teal">RD</div>
                  <div className="testi-author-info">
                    <h4>Reza Dwi</h4>
                    <span>Senior Manager — BUMN</span>
                  </div>
                </div>
              </div>

              <div className="testi-card-clean">
                <div className="testi-stars-clean">
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p className="testi-quote-clean">
                  &quot;PROFAS membantu saya menyadari bahwa memimpin UMKM bukan berarti harus memikirkan segalanya sendiri. Saya belajar seni mendelegasi secara sistematis dengan framework yang jelas.&quot;
                </p>
                <div className="testi-author-box">
                  <div className="testi-avatar-icon bg-cyan">NP</div>
                  <div className="testi-author-info">
                    <h4>Nadia Pratama</h4>
                    <span>Founder — UMKM Retail Indonesia</span>
                  </div>
                </div>
              </div>

              <div className="testi-card-clean">
                <div className="testi-stars-clean">
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p className="testi-quote-clean">
                  &quot;Sistem LMS-nya luar biasa modern! Enak diakses dari tablet saat perjalanan dinas. Fitur resume otomatisnya sangat membantu, dan sertifikatnya langsung terhubung ke LinkedIn saya.&quot;
                </p>
                <div className="testi-author-box">
                  <div className="testi-avatar-icon bg-blue">AY</div>
                  <div className="testi-author-info">
                    <h4>Ahmad Yasin</h4>
                    <span>VP of Engineering — Tech Startup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ CLEAN */}
        <section className="faq-section-clean">
          <div className="container">
            <div className="heading-clean">
              <span className="eyebrow-cyan">TANYA JAWAB</span>
              <h2>Pertanyaan Yang Sering <span>Diajukan</span></h2>
            </div>

            <div className="faq-box-clean">
              <div className="faq-item-clean">
                <details>
                  <summary>Berapa lama masa aktif akses program yang saya ikuti?</summary>
                  <div className="faq-answer-clean">
                    Sekali Anda terdaftar pada sebuah program di PROFAS, Anda mendapatkan akses <strong>seumur hidup (Lifetime Access)</strong> ke seluruh materi video, dokumen, dan studi kasus, termasuk semua pembaruan kurikulum di masa depan tanpa biaya tambahan.
                  </div>
                </details>
              </div>

              <div className="faq-item-clean">
                <details>
                  <summary>Apakah sertifikat yang diterbitkan resmi dan dapat diverifikasi?</summary>
                  <div className="faq-answer-clean">
                    Ya, 100%! Semua kelulusan program bersertifikat akan menerbitkan e-Sertifikat berlisensi dengan <strong>Nomor ID Unik</strong> serta <strong>QR Code Verifikasi</strong>. Anda juga dapat membagikan kredensial ini langsung ke bagian Lisensi & Sertifikasi di profil LinkedIn Anda hanya dengan 1 klik.
                  </div>
                </details>
              </div>

              <div className="faq-item-clean">
                <details>
                  <summary>Bagaimana sistem metodologi Pre-Test dan Post-Test bekerja?</summary>
                  <div className="faq-answer-clean">
                    Sebelum memulai modul, Anda akan mengerjakan Pre-Test untuk mengukur pemahaman awal. Setelah menyelesaikan materi dan studi kasus, Anda akan mengerjakan Post-Test. Sistem analitik kami akan membandingkan kedua skor tersebut untuk memperlihatkan persentase peningkatan kompetensi Anda secara objektif.
                  </div>
                </details>
              </div>

              <div className="faq-item-clean">
                <details>
                  <summary>Saya latar belakang non-manajemen, apakah bisa mengikuti program ini?</summary>
                  <div className="faq-answer-clean">
                    Tentu saja! Kurikulum PROFAS disusun secara bertahap mulai dari tingkat fundamental (Essential Leadership) hingga lanjutan (Strategic & Executive Leadership). Anda akan dibimbing langkah demi langkah dengan bahasa praktis yang mudah dipahami tanpa perlu latar belakang akademis bisnis.
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FINAL CTA CLEAN & ROYAL */}
        <section className="cta-section-clean">
          <div className="container">
            <div className="cta-banner-cyan">
              <span className="eyebrow-cyan cta-eyebrow-clean">SIAP MEMIMPIN DENGAN DAMPAK?</span>
              <h2 className="cta-title-clean">
                Mulai Transformasi <br />Kepemimpinan Anda <span>Hari Ini.</span>
              </h2>
              <p className="cta-desc-clean">
                Bergabunglah dengan ribuan eksekutif, founder, dan profesional yang telah meningkatkan karir serta dampak organisasi mereka bersama PROFAS.
              </p>
              <div className="cta-buttons-clean">
                <Link href="/daftar" className="btn-cyan-primary btn-cta-primary">
                  Daftar & Belajar Gratis Sekarang <ArrowRight size={20} />
                </Link>
                <Link href="/program" className="btn-cyan-secondary btn-cta-secondary">
                  Eksplorasi Semua Program
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
