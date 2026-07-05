import Link from "next/link";
import { ArrowRight, Check, LayoutTemplate, Layers, Star, Target, TrendingUp, Users2, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CourseCard } from "@/components/CourseCard";

export default async function Home() {
  const courses = await prisma.course.findMany({ where: { published: true, featured: true }, include: { mentor: { select: { name: true } } }, take: 3 });
  
  return <>
    <Header />
    <main>
      
      {/* 1. HERO SECTION */}
      <section className="hero-lms">
        <div className="hero-glow" />
        <div className="container">
          <span className="eyebrow"><Sparkles size={16}/> PROFAS LEADERSHIP PLATFORM</span>
          <h1>Bangun kapasitas memimpin<br/>yang <em>berdampak nyata.</em></h1>
          <p className="hero-subtitle">Bukan sekadar kursus teori. PROFAS adalah ekosistem pembelajaran kepemimpinan dengan metodologi terukur, studi kasus praktis, dan mentor berpengalaman untuk karir dan bisnis Anda.</p>
          
          <div className="hero-actions-center">
            <Link href="/daftar" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "1.05rem" }}>Mulai Belajar Gratis <ArrowRight size={18}/></Link>
            <Link href="/program" className="btn btn-white" style={{ padding: "14px 28px", fontSize: "1.05rem", color: "#0f172a" }}>Eksplorasi Program</Link>
          </div>
          
          <div className="hero-trust" style={{ justifyContent: "center" }}>
            <div className="avatar-stack"><span>AP</span><span>SR</span><span>DP</span><span>+</span></div>
            <div>
              <div className="stars" style={{ justifyContent: "center" }}><Star fill="#f59e0b" color="#f59e0b"/><Star fill="#f59e0b" color="#f59e0b"/><Star fill="#f59e0b" color="#f59e0b"/><Star fill="#f59e0b" color="#f59e0b"/><Star fill="#f59e0b" color="#f59e0b"/> <b>4.9/5</b></div>
              <small>Dinilai sangat baik oleh 2.500+ alumni</small>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS & SOCIAL PROOF */}
      <section className="stats-row">
        <div className="stat-item"><b>15+</b><span>Mentor Praktisi</span></div>
        <div className="stat-item"><b>2500+</b><span>Peserta Aktif</span></div>
        <div className="stat-item"><b>40+</b><span>Program Pelatihan</span></div>
        <div className="stat-item"><b>87%</b><span>Tingkat Kelulusan</span></div>
      </section>

      {/* 3. PLATFORM BENEFITS */}
      <section className="benefit-section" id="tentang">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow">MENGAPA PROFAS?</span>
            <h2>Ekosistem LMS modern yang<br/><em>dirancang untuk hasil.</em></h2>
          </div>
          <div className="benefit-grid">
            <div className="benefit-card">
              <div className="icon-box"><Target size={28}/></div>
              <h3>Terstruktur & Terukur</h3>
              <p>Sistem kami memetakan kemampuan awal (Pre-test) dan mengukur kemajuan kompetensi Anda setelah pembelajaran selesai secara akurat.</p>
            </div>
            <div className="benefit-card">
              <div className="icon-box"><Users2 size={28}/></div>
              <h3>Belajar dari Praktisi</h3>
              <p>Materi tidak dibuat oleh akademisi teoritis, melainkan oleh profesional dan eksekutif yang menghadapi masalah nyata di industri.</p>
            </div>
            <div className="benefit-card">
              <div className="icon-box"><TrendingUp size={28}/></div>
              <h3>Fokus pada Dampak</h3>
              <p>Setiap program dilengkapi dengan studi kasus interaktif, tugas akhir, dan rencana aksi untuk diimplementasikan langsung ke karir Anda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED PROGRAMS */}
      <section className="section programs-section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div className="section-heading row-heading">
            <div>
              <span className="eyebrow">PROGRAM UNGGULAN</span>
              <h2>Pilih jalur<br/><em>kepemimpinan Anda.</em></h2>
            </div>
            <Link href="/program" className="btn btn-outline">Lihat Semua Program <ArrowRight size={18}/></Link>
          </div>
          <div className="course-grid">
            {courses.map(course => <CourseCard key={course.id} course={course}/>)}
          </div>
        </div>
      </section>

      {/* 5. LEARNING FLOW */}
      <section className="flow-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow" style={{ color: "#38bdf8" }}>ALUR BELAJAR</span>
            <h2>Bagaimana Anda akan <em>bertumbuh.</em></h2>
            <p style={{ maxWidth: "600px", margin: "1rem auto 0" }}>Pengalaman belajar di PROFAS dirancang sekuensial agar pemahaman Anda terbangun secara solid, selangkah demi selangkah.</p>
          </div>
          <div className="flow-grid">
            <div className="flow-step">
              <div className="flow-step-num">1</div>
              <h3>Asesmen Awal</h3>
              <p>Kerjakan Pre-test singkat untuk mengetahui titik mula dan kelemahan yang perlu ditingkatkan.</p>
            </div>
            <div className="flow-step">
              <div className="flow-step-num">2</div>
              <h3>Eksplorasi Materi</h3>
              <p>Akses ratusan jam video, modul interaktif, dan materi bacaan komprehensif kapan saja.</p>
            </div>
            <div className="flow-step">
              <div className="flow-step-num">3</div>
              <h3>Uji Praktis</h3>
              <p>Kerjakan kuis, evaluasi bertahap, serta studi kasus yang dinilai langsung oleh mentor.</p>
            </div>
            <div className="flow-step">
              <div className="flow-step-num">4</div>
              <h3>Sertifikasi Digital</h3>
              <p>Raih sertifikat berlisensi dan bagikan kredensial kepemimpinan Anda ke LinkedIn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURES FOR STUDENTS & MENTORS */}
      <section className="feature-split">
        <div className="container">
          
          <div className="split-row">
            <div className="split-content">
              <span className="eyebrow">UNTUK PESERTA</span>
              <h2>Pengalaman belajar<br/>yang mulus & interaktif.</h2>
              <p>Kami tahu kesibukan Anda. Dasbor PROFAS didesain agar Anda bisa melanjutkan progres belajar tepat di mana Anda berhenti, melalui perangkat apa pun.</p>
              <ul className="feature-list">
                <li><Check className="icon"/><div className="text-content"><h4>Resume Otomatis</h4><p>Sistem menyimpan progres tontonan dan kuis Anda secara real-time.</p></div></li>
                <li><Check className="icon"/><div className="text-content"><h4>Akses Multi-Format</h4><p>Mendukung modul video HD, PDF, presentasi, dan evaluasi pilihan ganda.</p></div></li>
                <li><Check className="icon"/><div className="text-content"><h4>Notifikasi Pengingat</h4><p>Dapatkan pengingat untuk modul yang belum diselesaikan.</p></div></li>
              </ul>
              <Link href="/daftar" className="text-link" style={{ marginTop: "1rem", display: "inline-block" }}>Buat Akun Peserta <ArrowRight size={18}/></Link>
            </div>
            <div className="split-image" style={{ background: "linear-gradient(45deg, #0d9488, #3b82f6)" }}>
               <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
                 <LayoutTemplate size={80} opacity={0.2} />
               </div>
            </div>
          </div>

          <div className="split-row reverse">
            <div className="split-content">
              <span className="eyebrow" style={{ color: "#8b5cf6" }}>UNTUK MENTOR</span>
              <h2>Fleksibilitas total<br/>menyusun kurikulum.</h2>
              <p>Sistem *drag-and-drop* dan unggah folder bebas kami memungkinkan Anda mengajar dengan cara yang paling efektif tanpa terkungkung *template* kaku.</p>
              <ul className="feature-list">
                <li><Check className="icon" style={{ color: "#8b5cf6" }}/><div className="text-content"><h4>Course Builder Dinamis</h4><p>Susun bab, subbab, modul, kuis, dan materi tambahan sebebas mungkin.</p></div></li>
                <li><Check className="icon" style={{ color: "#8b5cf6" }}/><div className="text-content"><h4>Bebas Unggah File</h4><p>Dukung upload video, dokumen Word, presentasi PowerPoint, hingga tautan eksternal.</p></div></li>
                <li><Check className="icon" style={{ color: "#8b5cf6" }}/><div className="text-content"><h4>Penilaian Otomatis & Manual</h4><p>Beri nilai pada ujian pilihan ganda secara instan, atau evaluasi essay secara manual.</p></div></li>
              </ul>
              <Link href="mailto:halo@profas.id?subject=Pendaftaran Mentor" className="text-link" style={{ marginTop: "1rem", display: "inline-block", color: "#8b5cf6" }}>Bergabung sebagai Mentor <ArrowRight size={18}/></Link>
            </div>
            <div className="split-image" style={{ background: "linear-gradient(45deg, #8b5cf6, #ec4899)" }}>
               <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"white" }}>
                 <Layers size={80} opacity={0.2} />
               </div>
            </div>
          </div>

        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section className="testimonial-lms" id="insight">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow">KISAH SUKSES</span>
            <h2>Apa kata alumni kami?</h2>
          </div>
          <div className="testimonial-grid">
            <div className="testi-card">
              <div className="stars"><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/></div>
              <p>&quot;Modul Strategic Leadership di sini sangat praktis. Tidak bertele-tele dengan teori, langsung membedah studi kasus nyata di BUMN yang relevan dengan tim saya saat ini.&quot;</p>
              <div className="testi-author">
                <div className="avatar">RD</div>
                <div><h4>Reza Dwi</h4><span>Manager, BUMN</span></div>
              </div>
            </div>
            <div className="testi-card">
              <div className="stars"><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/></div>
              <p>&quot;PROFAS membantu saya menyadari bahwa memimpin UMKM bukan berarti harus memikirkan segalanya sendiri. Saya belajar Mendelegasi secara sistematis.&quot;</p>
              <div className="testi-author">
                <div className="avatar">NP</div>
                <div><h4>Nadia Pratama</h4><span>Founder UMKM Retail</span></div>
              </div>
            </div>
            <div className="testi-card">
              <div className="stars"><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/><Star fill="currentColor"/></div>
              <p>&quot;Sistemnya sangat modern. Enak diakses dari HP saat saya sedang *commuting*. UI-nya bersih dan fitur resume otomatisnya amat sangat membantu!&quot;</p>
              <div className="testi-author">
                <div className="avatar">AY</div>
                <div><h4>Ahmad Yasin</h4><span>Tech Lead</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="faq-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow">PERTANYAAN UMUM</span>
            <h2>Ada keraguan?</h2>
          </div>
          <div className="faq-container">
            <div className="faq-item">
              <details>
                <summary>Berapa lama akses program yang saya beli?</summary>
                <div className="faq-answer">Sekali Anda terdaftar pada sebuah program, Anda mendapatkan akses **seumur hidup (lifetime access)** ke seluruh materi di dalamnya, termasuk apabila ada pembaruan kurikulum di masa depan.</div>
              </details>
            </div>
            <div className="faq-item">
              <details>
                <summary>Apakah saya mendapatkan sertifikat?</summary>
                <div className="faq-answer">Ya! Semua program bersertifikat resmi PROFAS akan menerbitkan sertifikat digital dengan nomor ID unik yang dapat diverifikasi publik dan dibagikan langsung ke profil LinkedIn Anda.</div>
              </details>
            </div>
            <div className="faq-item">
              <details>
                <summary>Apakah materinya dalam bentuk video atau teks?</summary>
                <div className="faq-answer">Sebagian besar modul menggunakan video *High Definition (HD)* yang dibawakan langsung oleh mentor. Beberapa bab mendalam akan disajikan dalam format teks/dokumen studi kasus interaktif.</div>
              </details>
            </div>
            <div className="faq-item">
              <details>
                <summary>Saya tidak punya dasar manajerial, apakah bisa ikut?</summary>
                <div className="faq-answer">Tentu! PROFAS merancang program dengan alur terstruktur dari dasar (Fundamental) hingga lanjutan (Advanced). Silakan mulai dari program kategori *Essential Leadership*.</div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="section final-cta">
        <div className="container">
          <span className="eyebrow">SIAP BERTUMBUH?</span>
          <h2>Mulai perjalanan kepemimpinan<br/>yang <em>berdampak hari ini.</em></h2>
          <p>Investasikan waktu Anda untuk menjadi pemimpin yang dirindukan tim Anda.</p>
          <div style={{ marginTop: "2rem" }}>
            <Link href="/program" className="btn btn-primary" style={{ padding: "14px 28px", fontSize: "1.05rem" }}>Jelajahi Program <ArrowRight/></Link>
            <Link href="/daftar" className="btn btn-outline" style={{ padding: "14px 28px", fontSize: "1.05rem", background: "rgba(255,255,255,0.1)", color: "white", borderColor: "rgba(255,255,255,0.3)" }}>Buat Akun Gratis</Link>
          </div>
        </div>
      </section>

    </main>
    <Footer />
  </>;
}
