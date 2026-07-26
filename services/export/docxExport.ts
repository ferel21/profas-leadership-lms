import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
} from "docx";

export interface SyllabusModule {
  title: string;
  duration: string;
  description: string;
  keyTakeaways: string[];
}

export interface SyllabusDocxOptions {
  courseTitle: string;
  category: string;
  level: string;
  mentorName: string;
  durationHours: number;
  modules?: SyllabusModule[];
  userNotes?: string;
}

/**
 * Utility untuk membuat dokumen Word (.docx) Silabus Program & Catatan Studi.
 * Dibangun menggunakan prinsip `docx` & `doc-coauthoring` dengan cover eksekutif, tabel kurikulum, dan bagian catatan.
 */
export async function generateSyllabusDocx({
  courseTitle,
  category,
  level,
  mentorName = "Dr. H. Hendra Syahputra, M.M.",
  durationHours = 14,
  modules = [],
  userNotes = "",
}: SyllabusDocxOptions): Promise<void> {
  const safeModules = modules.length > 0 ? modules : [
    {
      title: "Modul 1: Fondasi Kepemimpinan & Pengambilan Keputusan Strategis",
      duration: "3.5 Jam Pembelajaran",
      description: "Memahami esensi kepemimpinan di era disrupsi serta framework 5 langkah dalam keputusan bisnis kritis.",
      keyTakeaways: ["Analisis Risiko Keputusan", "Emotional Intelligence bagi C-Level", "Studi Kasus Transformasi BUMN"],
    },
    {
      title: "Modul 2: Komunikasi Eksekutif & Negosiasi Pemangku Kepentingan",
      duration: "4.0 Jam Pembelajaran",
      description: "Teknik menyusun narasi persuasif untuk dewan direksi, pemegang saham, dan tim lintas divisi.",
      keyTakeaways: ["High-Stakes Negotiation", "Executive Storytelling", "Resolusi Konflik Internal"],
    },
    {
      title: "Modul 3: Inovasi Berkelanjutan & Eksekusi Budaya Kinerja Tinggi",
      duration: "4.5 Jam Pembelajaran",
      description: "Membangun sistem akuntabilitas, indikator kinerja utama (KPI), dan inovasi berbasis teknologi.",
      keyTakeaways: ["OKR & Strategic Alignment", "Foster Psychological Safety", "Audit Inovasi Perusahaan"],
    },
    {
      title: "Modul 4: Evaluasi & Rencana Tindak Lanjut Kepemimpinan (IDP)",
      duration: "2.0 Jam Pembelajaran",
      description: "Penyusunan Individual Development Plan (IDP) untuk penerapan kepemimpinan dalam 90 hari pertama.",
      keyTakeaways: ["90-Day Executive Roadmap", "Sistem Mentoring Lanjutan", "Penilaian Kompetensi Akhir"],
    },
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22, // 11pt
            color: "1E293B", // Slate 800
          },
          paragraph: {
            spacing: { after: 120, line: 276 },
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // Cover / Header
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: "PROFAS LEADERSHIP ACADEMY",
                bold: true,
                size: 28,
                color: "0D9488", // Teal 600
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [
              new TextRun({
                text: "SILABUS RESMI & PANDUAN STUDI EKSEKUTIF",
                bold: true,
                size: 36,
                color: "0F172A", // Slate 900
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: courseTitle,
                bold: true,
                size: 32,
                color: "0D9488",
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell("Kategori Program", true),
                  createTableCell(category),
                  createTableCell("Tingkat (Level)", true),
                  createTableCell(level),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Mentor Pengampu", true),
                  createTableCell(mentorName),
                  createTableCell("Total Durasi", true),
                  createTableCell(`${durationHours} Jam Pembelajaran`),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 400, after: 150 }, text: "" }),

          // Deskripsi Eksekutif
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 150 },
            children: [
              new TextRun({
                text: "1. Ringkasan Eksekutif & Tujuan Pembelajaran",
                bold: true,
                size: 26,
                color: "0F172A",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Program "${courseTitle}" dirancang khusus oleh PROFAS Leadership Institute untuk mempersiapkan para pemimpin dalam menghadapi dinamika kepemimpinan modern. Setiap modul mengombinasikan studi kasus nyata, diskusi interaktif, dan kerangka kerja praktis yang langsung dapat diaplikasikan di lingkungan organisasi.`,
              }),
            ],
          }),

          // Struktur Modul
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: "2. Struktur Modul & Kurikulum",
                bold: true,
                size: 26,
                color: "0F172A",
              }),
            ],
          }),

          ...safeModules.flatMap((mod, index) => [
            new Paragraph({
              spacing: { before: 150, after: 60 },
              children: [
                new TextRun({
                  text: `${index + 1}. ${mod.title} (${mod.duration})`,
                  bold: true,
                  size: 24,
                  color: "0D9488",
                }),
              ],
            }),
            new Paragraph({
              spacing: { after: 60 },
              children: [new TextRun({ text: mod.description })],
            }),
            new Paragraph({
              spacing: { after: 40 },
              children: [new TextRun({ text: "Fokus Kompetensi Utama:", bold: true, size: 20, color: "475569" })],
            }),
            ...mod.keyTakeaways.map(
              (item) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 40 },
                  children: [new TextRun({ text: item })],
                })
            ),
            new Paragraph({ spacing: { after: 100 }, text: "" }),
          ]),

          // Bagian Catatan Pribadi
          ...(userNotes
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 150 },
                  children: [
                    new TextRun({
                      text: "3. Catatan Studi Pribadi Peserta",
                      bold: true,
                      size: 26,
                      color: "0F172A",
                    }),
                  ],
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: userNotes,
                      italics: true,
                      color: "334155",
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({ spacing: { before: 400 }, text: "" }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Dokumen ini dibuat otomatis oleh PROFAS Leadership LMS. Hak Cipta Dilindungi Undang-Undang.",
                size: 18,
                color: "94A3B8",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Silabus-PROFAS-${courseTitle.replace(/\s+/g, "-")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function createTableCell(text: string, isHeader = false): TableCell {
  return new TableCell({
    width: { size: 25, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
    },
    shading: isHeader ? { fill: "F1F5F9" } : { fill: "FFFFFF" },
    children: [
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text,
            bold: isHeader,
            size: 20,
            color: isHeader ? "0F172A" : "334155",
          }),
        ],
      }),
    ],
  });
}
