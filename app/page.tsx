import type { Metadata } from "next";
import Link from "next/link";
import { Sora, Source_Sans_3 } from "next/font/google";
import {
  ArrowUpRight,
  Check,
  FileText,
  Fingerprint,
  LockKeyhole,
  Network,
  Search,
  Users2,
} from "lucide-react";
import styles from "./profas-legal.module.css";

const displayFont = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-profas-display",
  display: "swap",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-profas-body",
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://profas-leadership-lms.vercel.app";
const consultationHref =
  "mailto:halo@profas.id?subject=Percakapan%20awal%20dengan%20PROFAS&body=Nama%3A%0AOrganisasi%3A%0AKonteks%20singkat%3A%0A%0AMohon%20jangan%20sertakan%20dokumen%20atau%20informasi%20sensitif%20sebelum%20konfirmasi%20penugasan.";

export const metadata: Metadata = {
  title: "PROFAS — Kepastian Hukum untuk Keputusan Bisnis",
  description:
    "Pendampingan hukum bisnis untuk legalitas, kontrak, ketenagakerjaan, tata kelola, dan risiko—disampaikan dengan jernih dan terukur.",
  alternates: { canonical: appUrl },
  openGraph: {
    title: "PROFAS — Kepastian Hukum untuk Keputusan Bisnis",
    description:
      "Penasihat hukum untuk pemimpin dan perusahaan yang membutuhkan pijakan jelas sebelum mengambil keputusan.",
    url: appUrl,
    siteName: "PROFAS",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PROFAS — Kepastian Hukum untuk Keputusan Bisnis",
    description: "Dari konteks yang rumit menuju keputusan yang dapat dipertanggungjawabkan.",
  },
};

const services = [
  {
    code: "CORP / 01",
    title: "Corporate & Commercial",
    heading: "Struktur yang memberi ruang untuk tumbuh.",
    copy: "Menata bentuk usaha, hubungan pemegang saham, transaksi, dan kerja sama komersial agar keputusan bisnis berdiri di atas fondasi yang tepat.",
    deliverables: ["Struktur badan usaha", "Perjanjian pemegang saham", "Legal due diligence"],
  },
  {
    code: "LIC / 02",
    title: "Legalitas & Perizinan",
    heading: "Patuh tanpa kehilangan momentum.",
    copy: "Memetakan kewajiban dan proses perizinan berdasarkan model usaha, skala operasi, dan tahap pertumbuhan—bukan sekadar daftar dokumen.",
    deliverables: ["Pendirian & perubahan", "Perizinan berusaha", "Peta kepatuhan"],
  },
  {
    code: "CON / 03",
    title: "Kontrak & Transaksi",
    heading: "Kesepakatan yang jelas sebelum risiko muncul.",
    copy: "Menyusun dan menelaah kontrak dengan fokus pada tujuan bisnis, pembagian tanggung jawab, mekanisme kontrol, dan jalan keluar yang realistis.",
    deliverables: ["Draft & review kontrak", "Negosiasi", "Transaction checklist"],
  },
  {
    code: "PEO / 04",
    title: "Ketenagakerjaan & HR",
    heading: "Keputusan people dengan dasar yang kuat.",
    copy: "Menyelaraskan kebijakan, hubungan kerja, tindakan disipliner, dan perubahan organisasi dengan aturan serta konteks manusia di baliknya.",
    deliverables: ["Perjanjian kerja", "Kebijakan internal", "Employee relations"],
  },
  {
    code: "RSK / 05",
    title: "Risiko & Sengketa",
    heading: "Pahami pilihan sebelum menentukan posisi.",
    copy: "Membaca fakta, bukti, eksposur, dan opsi penyelesaian sejak dini agar langkah yang dipilih tetap proporsional dan dapat dijalankan.",
    deliverables: ["Legal risk assessment", "Strategi penyelesaian", "Pendampingan sengketa"],
  },
];

const processSteps = [
  {
    index: "01",
    title: "Dengar",
    copy: "Kami mulai dari keputusan yang perlu Anda ambil, pihak yang terlibat, dan konteks operasional yang tidak tertulis di dokumen.",
  },
  {
    index: "02",
    title: "Petakan",
    copy: "Fakta, kewajiban, risiko, serta area abu-abu disusun menjadi peta masalah yang mudah dipahami bersama.",
  },
  {
    index: "03",
    title: "Susun",
    copy: "Pilihan tindakan, keluaran kerja, jadwal, dan biaya dikonfirmasi sebelum pekerjaan substantif dimulai.",
  },
  {
    index: "04",
    title: "Dampingi",
    copy: "Kami membantu menjalankan langkah yang dipilih, merespons perubahan, dan menjaga dokumentasi keputusan tetap rapi.",
  },
];

const scenarios = [
  {
    number: "A",
    title: "Founder menyiapkan putaran pendanaan.",
    context: "Term sheet mulai dibahas, struktur kepemilikan belum rapi, dan setiap pihak membawa ekspektasi yang berbeda.",
    direction: "Rapikan struktur, petakan hak para pihak, lalu negosiasikan dokumen dengan prioritas bisnis yang jelas.",
  },
  {
    number: "B",
    title: "Tim tumbuh lebih cepat daripada kebijakan.",
    context: "Peran berubah, keputusan HR makin sensitif, sementara perjanjian kerja dan aturan internal tertinggal.",
    direction: "Audit dokumen dan praktik, urutkan risiko, kemudian bangun kebijakan yang benar-benar dapat dijalankan tim.",
  },
  {
    number: "C",
    title: "Mitra tidak menjalankan kewajiban.",
    context: "Komunikasi memburuk, dampak operasional meningkat, dan kontrak tidak memberi jawaban sesederhana yang diharapkan.",
    direction: "Amankan bukti, ukur eksposur, evaluasi posisi kontraktual, lalu pilih jalur penyelesaian yang proporsional.",
  },
];

const principles = [
  {
    icon: LockKeyhole,
    title: "Kerahasiaan sejak percakapan pertama",
    copy: "Informasi sensitif hanya dibahas setelah jalur komunikasi, konflik kepentingan, dan ruang lingkup awal dipastikan.",
  },
  {
    icon: Fingerprint,
    title: "Nasihat yang spesifik pada konteks",
    copy: "Kami tidak berhenti pada kutipan regulasi. Setiap rekomendasi menghubungkan aturan, tujuan, risiko, dan realitas pelaksanaan.",
  },
  {
    icon: Network,
    title: "Satu garis antara hukum dan operasi",
    copy: "Dokumen, keputusan, dan pihak yang bertanggung jawab disusun sebagai satu sistem kerja—bukan keluaran yang berdiri sendiri.",
  },
];

const faq = [
  {
    question: "Apa yang terjadi dalam percakapan awal?",
    answer:
      "Kami membahas konteks umum, keputusan yang perlu diambil, urgensi, pihak terkait, dan jenis dukungan yang mungkin dibutuhkan. Percakapan awal belum merupakan pendapat hukum formal atau penugasan.",
  },
  {
    question: "Bagaimana biaya jasa ditentukan?",
    answer:
      "Biaya mengikuti ruang lingkup, kompleksitas, jadwal, dan tingkat keterlibatan. Keluaran kerja, asumsi, biaya, serta ketentuan penugasan dikonfirmasi sebelum pekerjaan dimulai.",
  },
  {
    question: "Berapa lama prosesnya?",
    answer:
      "Waktu pengerjaan bergantung pada kelengkapan informasi, jenis layanan, pihak eksternal, dan tenggat yang berlaku. Estimasi diberikan setelah konteks dan ruang lingkup cukup jelas.",
  },
  {
    question: "Apakah pendampingan bisa dilakukan secara jarak jauh?",
    answer:
      "Bisa untuk banyak kebutuhan konsultasi, review, dan penyusunan dokumen. Pertemuan langsung atau dukungan di lokasi dapat dibahas ketika sifat pekerjaan memerlukannya.",
  },
  {
    question: "Apa yang perlu disiapkan sebelum menghubungi PROFAS?",
    answer:
      "Cukup siapkan ringkasan umum mengenai situasi, tujuan, dan tenggat. Jangan mengirim dokumen atau informasi sangat sensitif sebelum konflik kepentingan dan kanal komunikasi dikonfirmasi.",
  },
];

function Brand() {
  return (
    <span className={styles.brand}>
      <span className={styles.brandMark} aria-hidden="true">P</span>
      <span className={styles.brandType}>
        <strong>PROFAS</strong>
        <small>Legal advisory</small>
      </span>
    </span>
  );
}

function DecisionMap() {
  return (
    <div className={styles.decisionCanvas} aria-hidden="true">
      <div className={styles.canvasHeader}>
        <span>Decision map / PROFAS</span>
        <span>Context first</span>
      </div>
      <svg className={styles.mapSvg} viewBox="0 0 600 520" role="presentation" focusable="false">
        <path className={styles.routeGhost} d="M32 112 C150 112 175 262 300 262 C420 262 438 88 568 88" />
        <path className={styles.routeGhost} d="M32 264 C148 264 182 262 300 262 C416 262 452 260 568 260" />
        <path className={styles.routeGhost} d="M32 408 C148 408 180 262 300 262 C420 262 446 422 568 422" />
        <path className={styles.route} d="M32 112 C150 112 175 262 300 262 C420 262 438 88 568 88" />
        <path className={styles.routeAlt} d="M32 264 C148 264 182 262 300 262 C416 262 452 260 568 260" />
        <path className={styles.routeAccent} d="M32 408 C148 408 180 262 300 262 C420 262 446 422 568 422" />
        <circle className={styles.mapNode} cx="32" cy="112" r="8" />
        <circle className={styles.mapNode} cx="32" cy="264" r="8" />
        <circle className={styles.mapNode} cx="32" cy="408" r="8" />
        <circle className={styles.mapNodeActive} cx="568" cy="88" r="9" />
        <circle className={styles.mapNodeActive} cx="568" cy="260" r="9" />
        <circle className={styles.mapNodeActive} cx="568" cy="422" r="9" />
        <circle className={styles.mapCore} cx="300" cy="262" r="64" />
        <text className={styles.mapCoreText} x="300" y="257" textAnchor="middle">JELAS</text>
        <text className={styles.mapLabel} x="300" y="282" textAnchor="middle">DECISION READY</text>
        <text className={styles.mapLabel} x="48" y="95">KONTEKS</text>
        <text className={styles.mapLabel} x="48" y="247">RISIKO</text>
        <text className={styles.mapLabel} x="48" y="391">TUJUAN</text>
      </svg>
      <div className={styles.decisionStamp}>
        <strong>PROFAS</strong>
        <span>decision-ready</span>
      </div>
      <div className={styles.canvasFooter}>
        <div>
          <span>Output</span>
          <strong>Pilihan yang dapat dijalankan</strong>
        </div>
        <small>Hukum diterjemahkan menjadi arah, tanggung jawab, dan langkah berikutnya.</small>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className={`${styles.page} ${displayFont.variable} ${bodyFont.variable}`}>
      <a className={styles.skipLink} href="#konten-utama">Lewati ke konten utama</a>

      <header className={styles.header}>
        <div className={`${styles.shell} ${styles.headerInner}`}>
          <Link href="/" aria-label="PROFAS — halaman utama"><Brand /></Link>
          <nav className={styles.desktopNav} aria-label="Navigasi utama">
            <a href="#keahlian">Keahlian</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#situasi">Situasi</a>
            <a href="#standar">Standar</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a className={`${styles.primaryButton} ${styles.headerCta}`} href={consultationHref}>
            Jadwalkan konsultasi <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <details className={styles.mobileNav}>
            <summary aria-label="Buka navigasi">
              <span className={styles.menuBars} aria-hidden="true"><i /><i /></span>
            </summary>
            <nav className={styles.mobileMenu} aria-label="Navigasi seluler">
              <a href="#keahlian">Keahlian</a>
              <a href="#cara-kerja">Cara kerja</a>
              <a href="#situasi">Situasi</a>
              <a href="#standar">Standar</a>
              <a href="#faq">FAQ</a>
              <a href={consultationHref}>Jadwalkan konsultasi <ArrowUpRight size={16} /></a>
            </nav>
          </details>
        </div>
      </header>

      <main id="konten-utama">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={`${styles.shell} ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>Penasihat hukum untuk pemimpin bisnis</span>
              <h1 className={styles.heroTitle} id="hero-title">
                <span>Kepastian hukum.</span>
                <span>Keputusan yang <em>berani.</em></span>
              </h1>
              <p className={styles.heroLead}>
                PROFAS membantu pemimpin dan perusahaan menata legalitas, kontrak, ketenagakerjaan,
                tata kelola, dan risiko—dengan arahan yang jernih, proses terukur, dan pendampingan
                yang bertanggung jawab.
              </p>
              <div className={styles.heroActions}>
                <a className={styles.primaryButton} href={consultationHref}>
                  Jadwalkan percakapan awal <ArrowUpRight size={18} aria-hidden="true" />
                </a>
                <a className={styles.secondaryButton} href="#keahlian">Jelajahi keahlian</a>
              </div>
              <p className={styles.heroNote}>
                <Check size={18} aria-hidden="true" />
                Ruang lingkup, keluaran, jadwal, dan biaya dikonfirmasi sebelum pekerjaan dimulai.
              </p>
            </div>
            <div className={styles.decisionVisual}>
              <p className={styles.visuallyHidden}>
                Ilustrasi alur PROFAS yang menyatukan konteks, risiko, dan tujuan menjadi pilihan tindakan.
              </p>
              <DecisionMap />
            </div>
          </div>

          <div className={styles.assuranceRail}>
            <div className={`${styles.shell} ${styles.assuranceGrid}`}>
              <div className={styles.assuranceLabel}>Dirancang untuk kejelasan</div>
              <div className={styles.assuranceItem}><span><Check size={15} /></span>Bahasa hukum yang bisa digunakan</div>
              <div className={styles.assuranceItem}><span><Check size={15} /></span>Alasan di balik setiap rekomendasi</div>
              <div className={styles.assuranceItem}><span><Check size={15} /></span>Langkah lanjut yang memiliki pemilik</div>
            </div>
          </div>
        </section>

        <section className={styles.section} id="keahlian" aria-labelledby="keahlian-title">
          <div className={styles.shell}>
            <div className={styles.sectionHeader}>
              <span className={styles.kicker}>Keahlian / lima ruang keputusan</span>
              <div className={styles.sectionIntro}>
                <h2 className={styles.sectionHeading} id="keahlian-title">Keahlian yang bergerak bersama bisnis.</h2>
                <p>
                  Bukan katalog dokumen. Kami menghubungkan area hukum yang relevan dengan keputusan,
                  pihak, dan konsekuensi yang benar-benar Anda hadapi.
                </p>
              </div>
            </div>
            <div className={styles.serviceGrid}>
              {services.map((service) => (
                <article className={styles.serviceCard} key={service.code}>
                  <div className={styles.serviceTop}>
                    <span className={styles.serviceCode}>{service.code} · {service.title}</span>
                    <span className={styles.annotationMark} aria-hidden="true"><span /></span>
                  </div>
                  <h3>{service.heading}</h3>
                  <p>{service.copy}</p>
                  <div className={styles.deliverables} aria-label="Contoh cakupan">
                    {service.deliverables.map((item) => <span key={item}>{item}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.processSection}`} id="cara-kerja" aria-labelledby="process-title">
          <div className={styles.shell}>
            <div className={styles.processHeader}>
              <div>
                <span className={styles.kicker}>Cara kerja / dari konteks ke keputusan</span>
                <h2 id="process-title">Kompleksitas diurai. Arah disepakati.</h2>
              </div>
              <p>
                Empat tahap ini menjaga pembahasan tetap dekat dengan masalah, transparan dalam ruang
                lingkup, dan disiplin saat masuk ke pelaksanaan.
              </p>
            </div>
            <div className={styles.processGrid}>
              {processSteps.map((step) => (
                <article className={styles.processStep} key={step.index}>
                  <span>{step.index}</span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
            <div className={styles.scopeNote}>
              <FileText size={22} aria-hidden="true" />
              <p><strong>Yang selalu dibuat jelas:</strong> pertanyaan hukum, keluaran, penanggung jawab, tenggat, asumsi, dan biaya.</p>
              <span>No hidden scope</span>
            </div>
          </div>
        </section>

        <section className={styles.section} id="situasi" aria-labelledby="situasi-title">
          <div className={`${styles.shell} ${styles.scenarioLayout}`}>
            <div className={styles.scenarioIntro}>
              <span className={styles.kicker}>Mulai dari situasinya</span>
              <h2 id="situasi-title">Masalah bisnis jarang datang dengan nama dokumen.</h2>
              <p>
                Karena itu, kami memulai dari keputusan yang tertahan—lalu menentukan dukungan hukum
                yang paling masuk akal.
              </p>
            </div>
            <div className={styles.scenarioList}>
              {scenarios.map((scenario) => (
                <article className={styles.scenario} key={scenario.number}>
                  <span className={styles.scenarioNumber}>{scenario.number}</span>
                  <div className={styles.scenarioBody}>
                    <h3>{scenario.title}</h3>
                    <p>{scenario.context}</p>
                    <div className={styles.scenarioDirection}>
                      <span>Arah pendampingan</span>
                      <p>{scenario.direction}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.principlesSection}`} id="standar" aria-labelledby="standar-title">
          <div className={`${styles.shell} ${styles.principleLayout}`}>
            <div className={styles.principleStatement}>
              <span className={styles.kicker}>Standar pendampingan</span>
              <h2 id="standar-title">Kerahasiaan bukan ornamen. Kejelasan bukan bonus.</h2>
              <p>
                Keduanya adalah syarat agar nasihat hukum dapat dipercaya, dipahami oleh pengambil
                keputusan, dan dijalankan oleh tim.
              </p>
            </div>
            <dl className={styles.principleList}>
              {principles.map(({ icon: Icon, title, copy }) => (
                <div className={styles.principleItem} key={title}>
                  <span className={styles.principleIcon} aria-hidden="true"><Icon size={21} /></span>
                  <dt>{title}</dt>
                  <dd>{copy}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.section} id="faq" aria-labelledby="faq-title">
          <div className={`${styles.shell} ${styles.faqGrid}`}>
            <div className={styles.faqIntro}>
              <span className={styles.kicker}>Sebelum memulai</span>
              <h2 id="faq-title">Pertanyaan yang layak dijawab sejak awal.</h2>
              <p>Jawaban singkat untuk membantu Anda memahami proses sebelum membagikan informasi lebih jauh.</p>
            </div>
            <div className={styles.faqList}>
              {faq.map((item) => (
                <details className={styles.faqItem} key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection} aria-labelledby="cta-title">
          <div className={styles.shell}>
            <div className={styles.ctaPanel}>
              <div className={styles.ctaCopy}>
                <span className={styles.kicker}>Langkah berikutnya</span>
                <h2 id="cta-title">Keputusan penting layak dimulai dengan pijakan yang jelas.</h2>
                <p>
                  Ceritakan konteks umumnya. Kami akan membantu menentukan percakapan dan langkah awal
                  yang paling masuk akal.
                </p>
              </div>
              <div className={styles.ctaContact}>
                <span>Hubungi PROFAS</span>
                <a href={consultationHref}>halo@profas.id <ArrowUpRight size={20} aria-hidden="true" /></a>
                <p>Jangan sertakan dokumen atau informasi sangat sensitif sebelum konflik kepentingan dan penugasan dikonfirmasi.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerTop}`}>
          <div className={styles.footerBrand}>
            <Brand />
            <p className={styles.footerSummary}>
              Pendampingan hukum bisnis yang mengubah kompleksitas menjadi arah yang dapat dipahami dan dijalankan.
            </p>
          </div>
          <nav className={styles.footerNav} aria-label="Tautan layanan">
            <strong>Jelajahi</strong>
            <a href="#keahlian">Keahlian</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#faq">FAQ</a>
          </nav>
          <nav className={styles.footerNav} aria-label="Tautan akun dan kebijakan">
            <strong>Akses</strong>
            <Link href="/masuk">Portal klien</Link>
            <Link href="/privasi">Privasi</Link>
            <Link href="/syarat">Ketentuan</Link>
          </nav>
        </div>
        <div className={`${styles.shell} ${styles.footerBottom}`}>
          <p>© {new Date().getFullYear()} PROFAS. Seluruh hak dilindungi.</p>
          <p>Informasi di situs ini bersifat umum dan bukan nasihat hukum.</p>
        </div>
      </footer>
    </div>
  );
}