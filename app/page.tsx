import Link from "next/link";
import { 
  ArrowRight, Check, Star, Target, TrendingUp, Users2, Sparkles, 
  Award, BookOpen, ShieldCheck, Zap, Play, CheckCircle2, 
  BarChart3, Layers, LayoutTemplate, UserCheck, Globe 
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
      <main style={{ background: "#ffffff", color: "#0f172a", overflowX: "hidden" }}>
        
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
                
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #cbd5e1" }}>
                  <div style={{ display: "flex", margin: 0 }} className="avatar-stack">
                    <span style={{ background: "#0d9488", color: "white", fontWeight: "700" }}>RD</span>
                    <span style={{ background: "#06b6d4", color: "white", fontWeight: "700" }}>NP</span>
                    <span style={{ background: "#0284c7", color: "white", fontWeight: "700" }}>AY</span>
                    <span style={{ background: "#f59e0b", color: "white", fontWeight: "700" }}>+2k</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontWeight: "700" }}>
                      <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} />
                      <span style={{ color: "#0f172a", marginLeft: "4px" }}>4.9 / 5.0</span>
                    </div>
                    <small style={{ color: "#64748b", fontSize: "0.85rem" }}>Dipercaya oleh 2.500+ Eksekutif & Founder di Indonesia</small>
                  </div>
                </div>
              </div>

              {/* Right Column: Structured Clean Mockup Card */}
              <div>
                <div className="hero-mockup-clean">
                  <div className="mockup-top-bar">
                    <div className="mockup-user">
                      <div className="user-avatar-clean">EK</div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#0f172a", fontWeight: "800" }}>Eka Kurniawan</h4>
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>VP of Operations — BUMN</span>
                      </div>
                    </div>
                    <span className="badge-active-clean">
                      AKTIF BELAJAR
                    </span>
                  </div>

                  <div className="progress-box-clean">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "#334155" }}>Modul 4: Strategic Decision Making</span>
                      <span style={{ fontSize: "0.9rem", fontWeight: "800", color: "#0891b2" }}>85%</span>
                    </div>
                    <div className="progress-track-clean">
                      <div className="progress-fill-cyan" />
                    </div>
                  </div>

                  <div className="stats-compare-grid">
                    <div className="compare-box">
                      <div style={{ color: "#64748b", fontSize: "0.75rem", marginBottom: "4px", fontWeight: "600" }}>Nilai Pre-Test</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#ef4444" }}>58 / 100</div>
                    </div>
                    <div className="compare-box highlight">
                      <div style={{ color: "#0891b2", fontSize: "0.75rem", marginBottom: "4px", fontWeight: "700" }}>Prospek Post-Test</div>
                      <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "#0d9488" }}>94 / 100 🚀</div>
                    </div>
                  </div>

                  <div className="mockup-footer-banner">
                    <Award size={24} color="#0d9488" />
                    <div>
                      <b style={{ display: "block", fontSize: "0.85rem", color: "#0f172a" }}>Sertifikasi Kompetensi Eksekutif</b>
                      <span style={{ fontSize: "0.75rem", color: "#166534" }}>Terverifikasi Resmi & LinkedIn ID One-Click</span>
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
              <p style={{ color: "#475569", fontSize: "1.1rem" }}>
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
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.85rem", color: "#334155", fontWeight: "700" }}>
                    <span>Kompetensi Delegasi & Strategi (Rata-rata Alumni)</span>
                    <span style={{ color: "#0891b2" }}>+62% Peningkatan</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ width: "38%", background: "#fee2e2", color: "#991b1b", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", paddingLeft: "12px", fontSize: "0.8rem", fontWeight: "700", border: "1px solid #fecaca" }}>
                      Pre: 58%
                    </div>
                    <div style={{ width: "62%", background: "linear-gradient(90deg, #0d9488, #06b6d4)", color: "white", height: "28px", borderRadius: "8px", display: "flex", alignItems: "center", paddingLeft: "12px", fontSize: "0.8rem", fontWeight: "700", boxShadow: "0 4px 12px rgba(6, 182, 212, 0.2)" }}>
                      Post: 94% ✨
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bento-card-clean">
                <div className="icon-box-cyan" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#dcfce7" }}>
                  <Users2 size={30} />
                </div>
                <h3>Mentor Praktisi Nyata</h3>
                <p>
                  Belajar langsung dari direktur BUMN, founder startup, dan eksekutif korporasi yang membagikan resep rahasia serta kegagalan yang pernah mereka hadapi di lapangan.
                </p>
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.75rem", background: "#ecfeff", padding: "6px 12px", borderRadius: "20px", color: "#0891b2", fontWeight: "700", border: "1px solid #cffafe" }}>⚡ C-Level Mentors</span>
                  <span style={{ fontSize: "0.75rem", background: "#ecfeff", padding: "6px 12px", borderRadius: "20px", color: "#0891b2", fontWeight: "700", border: "1px solid #cffafe" }}>🏢 BUMN & Swasta</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bento-card-clean">
                <div className="icon-box-cyan" style={{ background: "#fef3c7", color: "#d97706", borderColor: "#fde68a" }}>
                  <Target size={30} />
                </div>
                <h3>Studi Kasus Kontekstual</h3>
                <p>
                  Kurikulum disesuaikan dengan iklim bisnis di Indonesia. Dari manajemen konflik di UMKM, efisiensi rantai pasok, hingga transformasi digital organisasi.
                </p>
                <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "8px", color: "#d97706", fontSize: "0.85rem", fontWeight: "700" }}>
                  <CheckCircle2 size={18} /> 100% Relevan di Indonesia
                </div>
              </div>

              {/* Card 4: Span 2 Col */}
              <div className="bento-card-clean span-2" style={{ background: "linear-gradient(135deg, #ffffff, #ecfeff)", borderColor: "#a5f3fc" }}>
                <div>
                  <div className="icon-box-cyan" style={{ background: "#0891b2", color: "white", borderColor: "#06b6d4" }}>
                    <ShieldCheck size={30} />
                  </div>
                  <h3>Sertifikasi Kompetensi & Integrasi LinkedIn</h3>
                  <p>
                    Setiap kelulusan dilindungi oleh sistem verifikasi digital berlisensi. Sertifikat Anda dilengkapi dengan Nomor ID Unik serta QR Code yang dapat diverifikasi oleh perusahaan atau rekruter secara instan dengan 1 klik.
                  </p>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ background: "#0d9488", color: "white", padding: "8px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)" }}>
                    <Award size={16} /> Terakreditasi PROFAS
                  </span>
                  <span style={{ background: "#ffffff", color: "#0891b2", padding: "8px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px", border: "1px solid #a5f3fc" }}>
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
                <h2 style={{ fontSize: "2.6rem", fontWeight: "800", color: "#0f172a", margin: "0.5rem 0 0" }}>
                  Pilih Jalur <span style={{ color: "#0891b2" }}>Kepemimpinan Anda</span>
                </h2>
              </div>
              <Link href="/program" className="btn-cyan-secondary" style={{ padding: "12px 24px", fontSize: "0.95rem" }}>
                Lihat Semua Program ({courses.length > 0 ? courses.length + "+" : "40+"}) <ArrowRight size={16} />
              </Link>
            </div>

            <div className="course-grid">
              {courses.length > 0 ? (
                courses.map(course => <CourseCard key={course.id} course={course} />)
              ) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem", background: "#f8fafc", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
                  <BookOpen size={48} color="#0891b2" style={{ margin: "0 auto 1rem" }} />
                  <h3 style={{ color: "#0f172a", marginBottom: "0.5rem" }}>Kurikulum Sedang Diperbarui</h3>
                  <p style={{ color: "#64748b" }}>Silakan kunjungi halaman katalog untuk melihat seluruh program kepemimpinan kami.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. ROADMAP TIMELINE CLEAN (DARK TEAL CONTRAST) */}
        <section className="roadmap-section-clean">
          <div className="container">
            <div className="heading-clean" style={{ marginBottom: "5rem" }}>
              <span className="eyebrow-cyan" style={{ color: "#38bdf8" }}>ROADMAP BELAJAR</span>
              <h2 style={{ color: "white" }}>Bagaimana Anda Akan <span style={{ color: "#38bdf8" }}>Bertumbuh</span></h2>
              <p style={{ color: "#cbd5e1", fontSize: "1.1rem" }}>
                Desain alur belajar yang terstruktur secara sekuensial agar setiap konsep kepemimpinan meresap dan dapat langsung dipraktikkan.
              </p>
            </div>

            <div className="roadmap-grid-clean">
              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean">01</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Asesmen Awal</h3>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Kerjakan Pre-Test diagnostik untuk mengidentifikasi kekuatan dan area kepemimpinan yang butuh pengasahan.
                </p>
              </div>

              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean" style={{ borderColor: "#2dd4bf", color: "#2dd4bf", boxShadow: "0 0 20px rgba(45, 212, 191, 0.4)" }}>02</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Modul Interaktif</h3>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Pelajari video HD beresolusi tinggi, bacaan eksekutif, dan framework manajerial yang bisa diunduh kapan saja.
                </p>
              </div>

              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean" style={{ borderColor: "#67e8f9", color: "#67e8f9", boxShadow: "0 0 20px rgba(103, 232, 249, 0.4)" }}>03</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Uji Studi Kasus</h3>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Terapkan ilmu pada simulasi kasus bisnis dan kuis akhir modul (Post-Test) untuk mengukur lonjakan kompetensi.
                </p>
              </div>

              <div className="roadmap-step-clean">
                <div className="roadmap-num-clean" style={{ borderColor: "#a5f3fc", color: "#a5f3fc", boxShadow: "0 0 20px rgba(165, 243, 252, 0.4)" }}>04</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Sertifikasi Eksekutif</h3>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: "1.6" }}>
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
                <h2 style={{ fontSize: "2.4rem", fontWeight: "800", color: "#0f172a", lineHeight: "1.2", marginBottom: "1.5rem" }}>
                  Belajar Fleksibel Sesuai <br /><span style={{ color: "#0891b2" }}>Jadwal Eksekutif Anda</span>
                </h2>
                <p style={{ color: "#475569", fontSize: "1.1rem", lineHeight: "1.7" }}>
                  Kami paham padatnya jadwal rapat dan kepemimpinan Anda. Fitur pintar PROFAS menyimpan progres Anda secara real-time di cloud, memungkinkan Anda melanjutkan materi tepat di detik Anda berhenti.
                </p>

                <ul className="feature-list-clean">
                  <li>
                    <div className="icon-check-cyan"><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Multi-Device Cloud Sync</h4>
                      <p style={{ color: "#475569", fontSize: "0.95rem", margin: 0 }}>Akses dari laptop di kantor, tablet saat perjalanan, atau ponsel pintar di rumah tanpa kehilangan jejak.</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon-check-cyan"><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Pembahasan Kuis Instan</h4>
                      <p style={{ color: "#475569", fontSize: "0.95rem", margin: 0 }}>Dapatkan umpan balik langsung atas jawaban Anda untuk memahami logika di balik setiap keputusan manajerial.</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon-check-cyan"><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Komunitas & Forum Diskusi</h4>
                      <p style={{ color: "#475569", fontSize: "0.95rem", margin: 0 }}>Bertukar pikiran dan bangun jaringan profesional dengan sesama pemimpin dari seluruh Indonesia.</p>
                    </div>
                  </li>
                </ul>

                <Link href="/daftar" className="btn-cyan-primary" style={{ marginTop: "1rem" }}>
                  Buat Akun Peserta <ArrowRight size={18} />
                </Link>
              </div>

              <div>
                <div style={{ background: "#ffffff", borderRadius: "24px", padding: "2.5rem", border: "1px solid #cbd5e1", boxShadow: "0 25px 50px -12px rgba(6, 182, 212, 0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "10px", fontWeight: "600" }}>profas-lms.app/dashboard</span>
                  </div>
                  <h4 style={{ color: "#0f172a", fontSize: "1.25rem", marginBottom: "1.25rem", fontWeight: "800" }}>📈 Statistik Pembelajaran Anda</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ background: "#ecfeff", padding: "1.25rem", borderRadius: "14px", border: "1px solid #a5f3fc" }}>
                      <div style={{ fontSize: "0.85rem", color: "#0891b2", fontWeight: "700" }}>Modul Selesai</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>18 / 20</div>
                    </div>
                    <div style={{ background: "#f0fdf4", padding: "1.25rem", borderRadius: "14px", border: "1px solid #bbf7d0" }}>
                      <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: "700" }}>Skor Kompetensi</div>
                      <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>96.5%</div>
                    </div>
                  </div>
                  <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <CheckCircle2 color="#16a34a" size={26} />
                      <div>
                        <b style={{ color: "#0f172a", fontSize: "0.95rem", display: "block" }}>Strategic Leadership</b>
                        <small style={{ color: "#64748b" }}>Sertifikat Terbit</small>
                      </div>
                    </div>
                    <span style={{ background: "#16a34a", color: "white", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700" }}>READY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* For Mentors */}
            <div className="split-row-clean reverse">
              <div>
                <span className="eyebrow-cyan" style={{ color: "#0d9488" }}>UNTUK MENTOR & INSTITUSI</span>
                <h2 style={{ fontSize: "2.4rem", fontWeight: "800", color: "#0f172a", lineHeight: "1.2", marginBottom: "1.5rem" }}>
                  Course Builder Canggih <br /><span style={{ color: "#0d9488" }}>Tanpa Batasan Teknis</span>
                </h2>
                <p style={{ color: "#475569", fontSize: "1.1rem", lineHeight: "1.7" }}>
                  Platform PROFAS memberi kebebasan penuh bagi Anda untuk menyusun kurikulum. Unggah video materi, dokumen panduan, kuis otomatis, atau ujian essay cukup dengan *drag-and-drop*.
                </p>

                <ul className="feature-list-clean">
                  <li>
                    <div className="icon-check-cyan" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#dcfce7" }}><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Builder Hierarkis (Bab & Modul)</h4>
                      <p style={{ color: "#475569", fontSize: "0.95rem", margin: 0 }}>Susun struktur materi dari tingkat dasar hingga lanjutan dengan kemudahan pengaturan urutan materi.</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon-check-cyan" style={{ background: "#f0fdf4", color: "#16a34a", borderColor: "#dcfce7" }}><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Sistem Penilaian Otomatis</h4>
                      <p style={{ color: "#475569", fontSize: "0.95rem", margin: 0 }}>Hemat waktu Anda dengan sistem grading otomatis untuk evaluasi pilihan ganda dan analisa performa kelas.</p>
                    </div>
                  </li>
                </ul>

                <Link href="mailto:halo@profas.id?subject=Pendaftaran Mentor" className="btn-cyan-secondary" style={{ marginTop: "1rem", borderColor: "#0d9488", color: "#0f766e" }}>
                  Bergabung Sebagai Mentor <ArrowRight size={18} />
                </Link>
              </div>

              <div>
                <div style={{ background: "#ffffff", borderRadius: "24px", padding: "2.5rem", border: "1px solid #cbd5e1", boxShadow: "0 25px 50px -12px rgba(13, 148, 136, 0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1.25rem", borderBottom: "1px solid #f1f5f9" }}>
                    <h4 style={{ color: "#0f172a", margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>🛠️ Mentor Course Builder</h4>
                    <span style={{ background: "#0d9488", color: "white", padding: "6px 14px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "700" }}>PUBLISHED</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #0891b2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#0f172a", fontSize: "0.95rem", fontWeight: "700" }}>📄 Bab 1: Fondasi Kepemimpinan</span>
                      <span style={{ color: "#0891b2", fontSize: "0.85rem", fontWeight: "700" }}>3 Modul</span>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #0d9488", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#0f172a", fontSize: "0.95rem", fontWeight: "700" }}>🎥 Bab 2: Komunikasi Eksekutif (HD Video)</span>
                      <span style={{ color: "#0d9488", fontSize: "0.85rem", fontWeight: "700" }}>5 Modul</span>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #16a34a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#0f172a", fontSize: "0.95rem", fontWeight: "700" }}>📝 Bab 3: Evaluasi Post-Test & Studi Kasus</span>
                      <span style={{ color: "#16a34a", fontSize: "0.85rem", fontWeight: "700" }}>Kuis Aktif</span>
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
                <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "1.25rem" }}>
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p style={{ color: "#334155", fontSize: "1rem", lineHeight: "1.7", fontStyle: "italic", marginBottom: "1.8rem" }}>
                  &quot;Modul Strategic Leadership di PROFAS sangat aplikatif. Tidak bertele-tele dengan teori, langsung membedah studi kasus nyata yang relevan dengan tantangan tim saya di korporasi.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white" }}>RD</div>
                  <div>
                    <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.05rem", fontWeight: "800" }}>Reza Dwi</h4>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Senior Manager — BUMN</span>
                  </div>
                </div>
              </div>

              <div className="testi-card-clean">
                <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "1.25rem" }}>
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p style={{ color: "#334155", fontSize: "1rem", lineHeight: "1.7", fontStyle: "italic", marginBottom: "1.8rem" }}>
                  &quot;PROFAS membantu saya menyadari bahwa memimpin UMKM bukan berarti harus memikirkan segalanya sendiri. Saya belajar seni mendelegasi secara sistematis dengan framework yang jelas.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #06b6d4, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white" }}>NP</div>
                  <div>
                    <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.05rem", fontWeight: "800" }}>Nadia Pratama</h4>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>Founder — UMKM Retail Indonesia</span>
                  </div>
                </div>
              </div>

              <div className="testi-card-clean">
                <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "1.25rem" }}>
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p style={{ color: "#334155", fontSize: "1rem", lineHeight: "1.7", fontStyle: "italic", marginBottom: "1.8rem" }}>
                  &quot;Sistem LMS-nya luar biasa modern! Enak diakses dari tablet saat perjalanan dinas. Fitur resume otomatisnya sangat membantu, dan sertifikatnya langsung terhubung ke LinkedIn saya.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #0f766e, #0369a1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white" }}>AY</div>
                  <div>
                    <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.05rem", fontWeight: "800" }}>Ahmad Yasin</h4>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>VP of Engineering — Tech Startup</span>
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
              <span className="eyebrow-cyan" style={{ color: "#a5f3fc", marginBottom: "1rem" }}>SIAP MEMIMPIN DENGAN DAMPAK?</span>
              <h2 style={{ fontSize: "3rem", fontWeight: "900", lineHeight: "1.15", marginBottom: "1.5rem", color: "white" }}>
                Mulai Transformasi <br />Kepemimpinan Anda <span style={{ color: "#67e8f9" }}>Hari Ini.</span>
              </h2>
              <p style={{ color: "#e2e8f0", fontSize: "1.2rem", maxWidth: "650px", margin: "0 auto 2.5rem", lineHeight: "1.7" }}>
                Bergabunglah dengan ribuan eksekutif, founder, dan profesional yang telah meningkatkan karir serta dampak organisasi mereka bersama PROFAS.
              </p>
              <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/daftar" className="btn-cyan-primary" style={{ padding: "18px 40px", fontSize: "1.1rem", background: "#ffffff", color: "#0f766e", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                  Daftar & Belajar Gratis Sekarang <ArrowRight size={20} />
                </Link>
                <Link href="/program" className="btn-cyan-secondary" style={{ padding: "18px 36px", fontSize: "1.1rem", background: "transparent", color: "white", borderColor: "rgba(255,255,255,0.4)" }}>
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
