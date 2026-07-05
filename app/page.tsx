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
      <main style={{ background: "#060a12", color: "white", overflowX: "hidden" }}>
        
        {/* 1. HERO SECTION ULTRA-PREMIUM */}
        <section className="hero-ultra">
          <div className="hero-glow-orb-1" />
          <div className="hero-glow-orb-2" />
          
          <div className="container">
            <div className="hero-container-split">
              {/* Left Column: High-Impact Typography */}
              <div>
                <div className="hero-badge-pill">
                  <span className="pulse-dot" />
                  <span>✨ EKOSISTEM KEPEMIMPINAN #1 DI INDONESIA</span>
                </div>
                
                <h1 className="hero-title-main">
                  Tumbuhkan Kapasitas Memimpin Yang <span className="gradient-text">Berdampakah Nyata</span>
                </h1>
                
                <p className="hero-desc-main">
                  Bukan sekadar teori manajerial biasa. PROFAS adalah platform pembelajaran kepemimpinan eksekutif dengan metodologi terukur (Pre & Post Test), studi kasus nyata, dan bimbingan langsung dari praktisi C-Level serta BUMN.
                </p>
                
                <div className="hero-btn-group">
                  <Link href="/daftar" className="btn-ultra-primary">
                    Mulai Belajar Sekarang <ArrowRight size={18} />
                  </Link>
                  <Link href="/program" className="btn-ultra-glass">
                    <Play size={18} fill="currentColor" /> Eksplorasi Kurikulum
                  </Link>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ display: "flex", margin: 0 }} className="avatar-stack">
                    <span style={{ background: "#0d9488" }}>RD</span>
                    <span style={{ background: "#0284c7" }}>NP</span>
                    <span style={{ background: "#8b5cf6" }}>AY</span>
                    <span style={{ background: "#f59e0b" }}>+2k</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontWeight: "700" }}>
                      <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} /> <Star fill="#f59e0b" size={18} />
                      <span style={{ color: "white", marginLeft: "4px" }}>4.9 / 5.0</span>
                    </div>
                    <small style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Dipercaya oleh 2.500+ Eksekutif & Founder di Indonesia</small>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Hero Mockup Showcase */}
              <div className="hero-mockup-wrapper">
                <div className="floating-badge-cert">
                  <Award size={32} color="#f59e0b" />
                  <div>
                    <b style={{ display: "block", fontSize: "0.9rem", color: "white" }}>Sertifikasi Terverifikasi</b>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Lisensi Resmi & LinkedIn ID</span>
                  </div>
                </div>

                <div className="floating-badge-live">
                  <Zap size={28} color="#38bdf8" />
                  <div>
                    <b style={{ display: "block", fontSize: "0.85rem", color: "white" }}>Aktivitas Live</b>
                    <span style={{ fontSize: "0.75rem", color: "#38bdf8" }}>Reza Dwi lulus Strategic Leadership</span>
                  </div>
                </div>

                <div className="mockup-glass-main">
                  <div className="mockup-header">
                    <div className="mockup-user-info">
                      <div className="mockup-avatar">EK</div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1rem", color: "white" }}>Eka Kurniawan</h4>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>VP of Operations — BUMN</span>
                      </div>
                    </div>
                    <span style={{ background: "rgba(13, 148, 136, 0.2)", color: "#2dd4bf", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" }}>
                      AKTIF BELAJAR
                    </span>
                  </div>

                  <div className="mockup-progress-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#e2e8f0" }}>Modul 4: Strategic Decision Making</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "#38bdf8" }}>85%</span>
                    </div>
                    <div className="mockup-progress-bar-bg">
                      <div className="mockup-progress-bar-fill" />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: "4px" }}>Nilai Pre-Test</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#f43f5e" }}>58 / 100</div>
                    </div>
                    <div style={{ background: "rgba(13, 148, 136, 0.1)", padding: "1rem", borderRadius: "14px", border: "1px solid rgba(13, 148, 136, 0.3)" }}>
                      <div style={{ color: "#2dd4bf", fontSize: "0.75rem", marginBottom: "4px" }}>Prospek Post-Test</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#2dd4bf" }}>94 / 100 🚀</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FLOATING ENTERPRISE STATS BAR */}
        <section className="stats-floating-wrapper">
          <div className="container">
            <div className="stats-glass-bar">
              <div className="stat-box-ultra">
                <span className="stat-num-ultra">2,500+</span>
                <span className="stat-label-ultra">Alumni Eksekutif Aktif</span>
              </div>
              <div className="stat-box-ultra">
                <span className="stat-num-ultra">15+</span>
                <span className="stat-label-ultra">Mentor C-Level & Praktisi</span>
              </div>
              <div className="stat-box-ultra">
                <span className="stat-num-ultra">87%</span>
                <span className="stat-label-ultra">Promosi Karir & Bisnis</span>
              </div>
              <div className="stat-box-ultra">
                <span className="stat-num-ultra">40+</span>
                <span className="stat-label-ultra">Modul & Studi Kasus Nyata</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO GRID ADVANCED (MENGAPA PROFAS) */}
        <section className="bento-section" id="tentang">
          <div className="container">
            <div className="section-heading-ultra">
              <span className="eyebrow-ultra">KEUNGGULAN EKOSISTEM</span>
              <h2>Mengapa Eksekutif Memilih <em>PROFAS?</em></h2>
              <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
                Kami meninggalkan metode kuliah satu arah yang membosankan dan menggantinya dengan sistem pelatihan interaktif berbasis kompetensi.
              </p>
            </div>

            <div className="bento-grid">
              {/* Card 1: Span 2 Col */}
              <div className="bento-card span-2">
                <div>
                  <div className="bento-icon-badge">
                    <BarChart3 size={30} />
                  </div>
                  <h3>Metodologi Terukur: Pre-Test vs Post-Test</h3>
                  <p>
                    Setiap program dimulai dengan pemetaan kompetensi awal untuk mengidentifikasi gap kepemimpinan Anda. Setelah seluruh modul dan studi kasus diselesaikan, sistem akan mengukur peningkatan kompetensi secara kuantitatif yang objektif.
                  </p>
                </div>

                <div className="bento-visual-chart">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", fontSize: "0.85rem", color: "#cbd5e1" }}>
                    <span>Kompetensi Delegasi & Strategi (Rata-rata Alumni)</span>
                    <span style={{ color: "#2dd4bf", fontWeight: "700" }}>+62% Peningkatan</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div style={{ width: "38%", background: "#ef4444", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", paddingLeft: "10px", fontSize: "0.75rem", fontWeight: "700" }}>
                      Pre: 58%
                    </div>
                    <div style={{ width: "62%", background: "linear-gradient(90deg, #0d9488, #38bdf8)", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", paddingLeft: "10px", fontSize: "0.75rem", fontWeight: "700" }}>
                      Post: 94% ✨
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bento-card">
                <div className="bento-icon-badge" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a855f7", borderColor: "rgba(139, 92, 246, 0.3)" }}>
                  <Users2 size={30} />
                </div>
                <h3>Mentor Praktisi Nyata</h3>
                <p>
                  Belajar langsung dari direktur BUMN, founder startup, dan eksekutif korporasi yang membagikan resep rahasia serta kegagalan yang pernah mereka hadapi di lapangan.
                </p>
                <div style={{ marginTop: "1.5rem", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "20px", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)" }}>⚡ C-Level Mentors</span>
                  <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "20px", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.1)" }}>🏢 BUMN & Swasta</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bento-card">
                <div className="bento-icon-badge" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                  <Target size={30} />
                </div>
                <h3>Studi Kasus Kontekstual</h3>
                <p>
                  Kurikulum disesuaikan dengan iklim bisnis di Indonesia. Dari manajemen konflik di UMKM, efisiensi rantai pasok, hingga transformasi digital organisasi.
                </p>
                <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "8px", color: "#f59e0b", fontSize: "0.85rem", fontWeight: "600" }}>
                  <CheckCircle2 size={16} /> 100% Relevan di Indonesia
                </div>
              </div>

              {/* Card 4: Span 2 Col */}
              <div className="bento-card span-2" style={{ background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(13, 148, 136, 0.15))", borderColor: "rgba(13, 148, 136, 0.3)" }}>
                <div>
                  <div className="bento-icon-badge" style={{ background: "rgba(13, 148, 136, 0.2)", color: "#2dd4bf", borderColor: "rgba(13, 148, 136, 0.4)" }}>
                    <ShieldCheck size={30} />
                  </div>
                  <h3>Sertifikasi Kompetensi & Integrasi LinkedIn</h3>
                  <p>
                    Setiap kelulusan dilindungi oleh sistem verifikasi digital berlisensi. Sertifikat Anda dilengkapi dengan Nomor ID Unik serta QR Code yang dapat diverifikasi oleh perusahaan atau rekruter secara instan dengan 1 klik.
                  </p>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ background: "#0d9488", color: "white", padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Award size={16} /> Terakreditasi PROFAS
                  </span>
                  <span style={{ background: "rgba(255,255,255,0.08)", color: "#cbd5e1", padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Globe size={16} /> LinkedIn One-Click Share
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. PROGRAM UNGGULAN SECTION */}
        <section className="programs-ultra-section">
          <div className="container">
            <div className="programs-header-row">
              <div>
                <span className="eyebrow-ultra">KURIKULUM UNGGULAN</span>
                <h2 style={{ fontSize: "2.5rem", fontWeight: "800", margin: "0.5rem 0 0" }}>
                  Pilih Jalur <span style={{ color: "#38bdf8" }}>Kepemimpinan Anda</span>
                </h2>
              </div>
              <Link href="/program" className="btn-ultra-glass" style={{ padding: "12px 24px", fontSize: "0.95rem" }}>
                Lihat Semua Program ({courses.length > 0 ? courses.length + "+" : "40+"}) <ArrowRight size={16} />
              </Link>
            </div>

            <div className="course-grid">
              {courses.length > 0 ? (
                courses.map(course => <CourseCard key={course.id} course={course} />)
              ) : (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <BookOpen size={48} color="#38bdf8" style={{ margin: "0 auto 1rem" }} />
                  <h3 style={{ color: "white", marginBottom: "0.5rem" }}>Kurikulum Sedang Diperbarui</h3>
                  <p style={{ color: "#94a3b8" }}>Silakan kunjungi halaman katalog untuk melihat seluruh program kepemimpinan kami.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. ROADMAP TIMELINE ULTRA */}
        <section className="roadmap-ultra-section">
          <div className="container">
            <div className="section-heading-ultra">
              <span className="eyebrow-ultra" style={{ color: "#2dd4bf" }}>ROADMAP BELAJAR</span>
              <h2>Bagaimana Anda Akan <em>Bertumbuh</em></h2>
              <p style={{ color: "#94a3b8", fontSize: "1.1rem" }}>
                Desain alur belajar yang terstruktur secara sekuensial agar setiap konsep kepemimpinan meresap dan dapat langsung dipraktikkan.
              </p>
            </div>

            <div className="roadmap-grid">
              <div className="roadmap-step-card">
                <div className="roadmap-num-glow">01</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Asesmen Awal</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Kerjakan Pre-Test diagnostik untuk mengidentifikasi kekuatan dan area kepemimpinan yang butuh pengasahan.
                </p>
              </div>

              <div className="roadmap-step-card">
                <div className="roadmap-num-glow" style={{ borderColor: "#2dd4bf", color: "#2dd4bf", boxShadow: "0 0 25px rgba(45, 212, 191, 0.4)" }}>02</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Modul Interaktif</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Pelajari video HD beresolusi tinggi, bacaan eksekutif, dan framework manajerial yang bisa diunduh kapan saja.
                </p>
              </div>

              <div className="roadmap-step-card">
                <div className="roadmap-num-glow" style={{ borderColor: "#a855f7", color: "#a855f7", boxShadow: "0 0 25px rgba(168, 85, 247, 0.4)" }}>03</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Uji Studi Kasus</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Terapkan ilmu pada simulasi kasus bisnis dan kuis akhir modul (Post-Test) untuk mengukur lonjakan kompetensi.
                </p>
              </div>

              <div className="roadmap-step-card">
                <div className="roadmap-num-glow" style={{ borderColor: "#f59e0b", color: "#f59e0b", boxShadow: "0 0 25px rgba(245, 158, 11, 0.4)" }}>04</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem", color: "white" }}>Sertifikasi Eksekutif</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Raih sertifikat kelulusan resmi berlisensi PROFAS dan tunjukkan kredensial baru Anda ke jaringan LinkedIn.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. ECOSYSTEM SPLIT SHOWCASE */}
        <section className="ecosystem-section">
          <div className="container">
            {/* For Students */}
            <div className="split-ultra-row">
              <div>
                <span className="eyebrow-ultra">PENGALAMAN PESERTA</span>
                <h2 style={{ fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2", marginBottom: "1.5rem" }}>
                  Belajar Fleksibel Sesuai <br /><span style={{ color: "#38bdf8" }}>Jadwal Eksekutif Anda</span>
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: "1.7" }}>
                  Kami paham padatnya jadwal rapat dan kepemimpinan Anda. Fitur pintar PROFAS menyimpan progres Anda secara real-time di cloud, memungkinkan Anda melanjutkan materi tepat di detik Anda berhenti.
                </p>

                <ul className="feature-list-ultra">
                  <li>
                    <div className="icon-check"><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "white", margin: "0 0 4px" }}>Multi-Device Cloud Sync</h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Akses dari laptop di kantor, tablet saat perjalanan, atau ponsel pintar di rumah tanpa kehilangan jejak.</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon-check"><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "white", margin: "0 0 4px" }}>Pembahasan Kuis Instan</h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Dapatkan umpan balik langsung atas jawaban Anda untuk memahami logika di balik setiap keputusan manajerial.</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon-check"><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "white", margin: "0 0 4px" }}>Komunitas & Forum Diskusi</h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Bertukar pikiran dan bangun jaringan profesional dengan sesama pemimpin dari seluruh Indonesia.</p>
                    </div>
                  </li>
                </ul>

                <Link href="/daftar" className="btn-ultra-primary" style={{ marginTop: "1rem" }}>
                  Buat Akun Peserta <ArrowRight size={18} />
                </Link>
              </div>

              <div className="split-img-box">
                <div style={{ background: "#0f172a", borderRadius: "20px", padding: "2rem", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ fontSize: "0.8rem", color: "#64748b", marginLeft: "10px" }}>profas-lms.app/dashboard</span>
                  </div>
                  <h4 style={{ color: "white", fontSize: "1.2rem", marginBottom: "1rem" }}>📈 Statistik Pembelajaran Anda</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ background: "rgba(56,189,248,0.1)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(56,189,248,0.2)" }}>
                      <div style={{ fontSize: "0.8rem", color: "#38bdf8" }}>Modul Selesai</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "white" }}>18 / 20</div>
                    </div>
                    <div style={{ background: "rgba(16,185,129,0.1)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <div style={{ fontSize: "0.8rem", color: "#10b981" }}>Skor Kompetensi</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "white" }}>96.5%</div>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <CheckCircle2 color="#10b981" size={24} />
                      <div>
                        <b style={{ color: "white", fontSize: "0.9rem", display: "block" }}>Strategic Leadership</b>
                        <small style={{ color: "#94a3b8" }}>Sertifikat Terbit</small>
                      </div>
                    </div>
                    <span style={{ background: "#10b981", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>READY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* For Mentors */}
            <div className="split-ultra-row reverse">
              <div>
                <span className="eyebrow-ultra" style={{ color: "#a855f7" }}>UNTUK MENTOR & INSTITUSI</span>
                <h2 style={{ fontSize: "2.4rem", fontWeight: "800", lineHeight: "1.2", marginBottom: "1.5rem" }}>
                  Course Builder Canggih <br /><span style={{ color: "#a855f7" }}>Tanpa Batasan Teknis</span>
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: "1.7" }}>
                  Platform PROFAS memberi kebebasan penuh bagi Anda untuk menyusun kurikulum. Unggah video materi, dokumen panduan, kuis otomatis, atau ujian essay cukup dengan *drag-and-drop*.
                </p>

                <ul className="feature-list-ultra">
                  <li>
                    <div className="icon-check" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#a855f7" }}><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "white", margin: "0 0 4px" }}>Builder Hierarkis (Bab & Modul)</h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Susun struktur materi dari tingkat dasar hingga lanjutan dengan kemudahan pengaturan urutan materi.</p>
                    </div>
                  </li>
                  <li>
                    <div className="icon-check" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#a855f7" }}><Check size={18} /></div>
                    <div>
                      <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "white", margin: "0 0 4px" }}>Sistem Penilaian Otomatis</h4>
                      <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>Hemat waktu Anda dengan sistem grading otomatis untuk evaluasi pilihan ganda dan analisa performa kelas.</p>
                    </div>
                  </li>
                </ul>

                <Link href="mailto:halo@profas.id?subject=Pendaftaran Mentor" className="btn-ultra-glass" style={{ marginTop: "1rem", borderColor: "rgba(168, 85, 247, 0.4)", color: "#c084fc" }}>
                  Bergabung Sebagai Mentor <ArrowRight size={18} />
                </Link>
              </div>

              <div className="split-img-box" style={{ background: "linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1))", borderColor: "rgba(168, 85, 247, 0.3)" }}>
                <div style={{ background: "#0f172a", borderRadius: "20px", padding: "2rem", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <h4 style={{ color: "white", margin: 0 }}>🛠️ Mentor Course Builder</h4>
                    <span style={{ background: "#a855f7", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>PUBLISHED</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px", borderLeft: "4px solid #38bdf8", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "white", fontSize: "0.9rem" }}>📄 Bab 1: Fondasi Kepemimpinan</span>
                      <span style={{ color: "#38bdf8", fontSize: "0.8rem" }}>3 Modul</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px", borderLeft: "4px solid #a855f7", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "white", fontSize: "0.9rem" }}>🎥 Bab 2: Komunikasi Eksekutif (HD Video)</span>
                      <span style={{ color: "#a855f7", fontSize: "0.8rem" }}>5 Modul</span>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", padding: "1rem", borderRadius: "10px", borderLeft: "4px solid #10b981", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "white", fontSize: "0.9rem" }}>📝 Bab 3: Evaluasi Post-Test & Studi Kasus</span>
                      <span style={{ color: "#10b981", fontSize: "0.8rem" }}>Kuis Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. TESTIMONIALS MODERN */}
        <section className="testimonials-section" id="insight">
          <div className="container">
            <div className="section-heading-ultra">
              <span className="eyebrow-ultra" style={{ color: "#f59e0b" }}>BUKTI NYATA ALUMNI</span>
              <h2>Dipercaya Oleh Para <br /><em>Pemimpin & Profesional</em></h2>
            </div>

            <div className="testi-grid-ultra">
              <div className="testi-card-ultra">
                <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "1.25rem" }}>
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "1rem", lineHeight: "1.7", fontStyle: "italic", marginBottom: "1.8rem" }}>
                  &quot;Modul Strategic Leadership di PROFAS sangat aplikatif. Tidak bertele-tele dengan teori, langsung membedah studi kasus nyata yang relevan dengan tantangan tim saya di korporasi.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #38bdf8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white" }}>RD</div>
                  <div>
                    <h4 style={{ margin: 0, color: "white", fontSize: "1.05rem" }}>Reza Dwi</h4>
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Senior Manager — BUMN</span>
                  </div>
                </div>
              </div>

              <div className="testi-card-ultra">
                <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "1.25rem" }}>
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "1rem", lineHeight: "1.7", fontStyle: "italic", marginBottom: "1.8rem" }}>
                  &quot;PROFAS membantu saya menyadari bahwa memimpin UMKM bukan berarti harus memikirkan segalanya sendiri. Saya belajar seni mendelegasi secara sistematis dengan framework yang jelas.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #a855f7, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white" }}>NP</div>
                  <div>
                    <h4 style={{ margin: 0, color: "white", fontSize: "1.05rem" }}>Nadia Pratama</h4>
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Founder — UMKM Retail Indonesia</span>
                  </div>
                </div>
              </div>

              <div className="testi-card-ultra">
                <div style={{ display: "flex", gap: "4px", color: "#f59e0b", marginBottom: "1.25rem" }}>
                  <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" /> <Star fill="#f59e0b" />
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "1rem", lineHeight: "1.7", fontStyle: "italic", marginBottom: "1.8rem" }}>
                  &quot;Sistem LMS-nya luar biasa modern! Enak diakses dari tablet saat perjalanan dinas. Fitur resume otomatisnya sangat membantu, dan sertifikatnya langsung terhubung ke LinkedIn saya.&quot;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #f59e0b, #ef4444)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "white" }}>AY</div>
                  <div>
                    <h4 style={{ margin: 0, color: "white", fontSize: "1.05rem" }}>Ahmad Yasin</h4>
                    <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>VP of Engineering — Tech Startup</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. FAQ MODERN */}
        <section className="faq-ultra-section">
          <div className="container">
            <div className="section-heading-ultra">
              <span className="eyebrow-ultra">TANYA JAWAB</span>
              <h2>Pertanyaan Yang Sering <em>Diajukan</em></h2>
            </div>

            <div className="faq-ultra-box">
              <div className="faq-item-ultra">
                <details>
                  <summary>Berapa lama masa aktif akses program yang saya ikuti?</summary>
                  <div className="faq-answer-ultra">
                    Sekali Anda terdaftar pada sebuah program di PROFAS, Anda mendapatkan akses <strong>seumur hidup (Lifetime Access)</strong> ke seluruh materi video, dokumen, dan studi kasus, termasuk semua pembaruan kurikulum di masa depan tanpa biaya tambahan.
                  </div>
                </details>
              </div>

              <div className="faq-item-ultra">
                <details>
                  <summary>Apakah sertifikat yang diterbitkan resmi dan dapat diverifikasi?</summary>
                  <div className="faq-answer-ultra">
                    Ya, 100%! Semua kelulusan program bersertifikat akan menerbitkan e-Sertifikat berlisensi dengan <strong>Nomor ID Unik</strong> serta <strong>QR Code Verifikasi</strong>. Anda juga dapat membagikan kredensial ini langsung ke bagian Lisensi & Sertifikasi di profil LinkedIn Anda hanya dengan 1 klik.
                  </div>
                </details>
              </div>

              <div className="faq-item-ultra">
                <details>
                  <summary>Bagaimana sistem metodologi Pre-Test dan Post-Test bekerja?</summary>
                  <div className="faq-answer-ultra">
                    Sebelum memulai modul, Anda akan mengerjakan Pre-Test untuk mengukur pemahaman awal. Setelah menyelesaikan materi dan studi kasus, Anda akan mengerjakan Post-Test. Sistem analitik kami akan membandingkan kedua skor tersebut untuk memperlihatkan persentase peningkatan kompetensi Anda secara objektif.
                  </div>
                </details>
              </div>

              <div className="faq-item-ultra">
                <details>
                  <summary>Saya latar belakang non-manajemen, apakah bisa mengikuti program ini?</summary>
                  <div className="faq-answer-ultra">
                    Tentu saja! Kurikulum PROFAS disusun secara bertahap mulai dari tingkat fundamental (Essential Leadership) hingga lanjutan (Strategic & Executive Leadership). Anda akan dibimbing langkah demi langkah dengan bahasa praktis yang mudah dipahami tanpa perlu latar belakang akademis bisnis.
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FINAL CTA ULTRA */}
        <section className="cta-ultra-section">
          <div className="container">
            <div className="cta-banner-glass">
              <span className="eyebrow-ultra" style={{ color: "#38bdf8", marginBottom: "1rem" }}>SIAP MEMIMPIN DENGAN DAMPAK?</span>
              <h2 style={{ fontSize: "3rem", fontWeight: "900", lineHeight: "1.1", marginBottom: "1.5rem", color: "white" }}>
                Mulai Transformasi <br />Kepemimpinan Anda <em style={{ fontStyle: "normal", color: "#2dd4bf" }}>Hari Ini.</em>
              </h2>
              <p style={{ color: "#cbd5e1", fontSize: "1.2rem", maxWidth: "650px", margin: "0 auto 2.5rem", lineHeight: "1.7" }}>
                Bergabunglah dengan ribuan eksekutif, founder, dan profesional yang telah meningkatkan karir serta dampak organisasi mereka bersama PROFAS.
              </p>
              <div style={{ display: "flex", gap: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/daftar" className="btn-ultra-primary" style={{ padding: "18px 40px", fontSize: "1.1rem" }}>
                  Daftar & Belajar Gratis Sekarang <ArrowRight size={20} />
                </Link>
                <Link href="/program" className="btn-ultra-glass" style={{ padding: "18px 36px", fontSize: "1.1rem" }}>
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
