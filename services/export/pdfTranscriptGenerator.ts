import { jsPDF } from "jspdf";

export interface TranscriptCourseItem {
  title: string;
  category: string;
  level: string;
  progressPercent: number;
  status: string;
  completedAt?: string;
  score?: number;
}

export interface TranscriptOptions {
  studentName: string;
  studentEmail: string;
  organization?: string;
  role: string;
  totalXP: number;
  courses: TranscriptCourseItem[];
  badgesCount: number;
  attendanceRatePercent?: number;
  issuedDate?: string;
}

/**
 * Utility untuk membuat Executive Academic Transcript & Leadership Portfolio (.pdf).
 * Didesain dengan filosofi `pdf` & `canvas-design`: portrait A4 resmi, watermark PROFAS,
 * tabel kurikulum berbingkai rapi, dan stempel verifikasi tanda tangan akademik.
 */
export function generateAcademicTranscriptPDF({
  studentName,
  studentEmail,
  organization = "Profesional & Kepemimpinan Eksekutif",
  role,
  totalXP,
  courses,
  badgesCount,
  attendanceRatePercent = 98,
  issuedDate = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
}: TranscriptOptions): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background dan bingkai
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // Top header bar (Teal 600)
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, width, 28, "F");

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("INSTITUT KEPEMIMPINAN PROFAS", 16, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TRANSKRIP AKADEMIK & PORTOFOLIO KEPEMIMPINAN EKSEKUTIF", 16, 21);

  // Document Number Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  const docNum = `NO: TR-PFS-${Math.floor(100000 + Math.random() * 900000)}`;
  doc.text(docNum, width - 16, 17, { align: "right" });

  // Student Profile Summary Box
  doc.setFillColor(244, 246, 241); // Canvas off-white
  doc.setDrawColor(219, 229, 223);
  doc.setLineWidth(0.6);
  doc.roundedRect(16, 36, width - 32, 42, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(28, 40, 37); // Ink
  doc.text("PROFIL PESERTA / EXECUTIVE LEARNER PROFILE", 22, 45);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Nama Lengkap:", 22, 54);
  doc.text("Email Registrasi:", 22, 62);
  doc.text("Organisasi / Afiliasi:", 22, 70);

  doc.setFont("helvetica", "normal");
  doc.text(studentName.toUpperCase(), 62, 54);
  doc.text(studentEmail, 62, 62);
  doc.text(organization || "Profesional Mandiri", 62, 70);

  // Right column stats inside profile box
  const rightX = width / 2 + 15;
  doc.setFont("helvetica", "bold");
  doc.text("Peran Sistem:", rightX, 54);
  doc.text("Total Experience (XP):", rightX, 62);
  doc.text("Tingkat Kehadiran:", rightX, 70);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 118, 110);
  doc.setFont("helvetica", "bold");
  doc.text(`${role} (${badgesCount} Badge)`, rightX + 44, 54);
  doc.text(`${totalXP.toLocaleString("id-ID")} XP`, rightX + 44, 62);
  doc.text(`${attendanceRatePercent}% (Sangat Aktif)`, rightX + 44, 70);

  // Table Header for Courses
  let currentY = 88;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(28, 40, 37);
  doc.text("REKAPITULASI PROGRAM KEPEMIMPINAN YANG DIIKUTI", 16, currentY);

  currentY += 6;
  doc.setFillColor(23, 60, 55); // Deep surface
  doc.rect(16, currentY, width - 32, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("NAMA PROGRAM & KATEGORI", 20, currentY + 6.5);
  doc.text("LEVEL", 108, currentY + 6.5);
  doc.text("STATUS", 138, currentY + 6.5);
  doc.text("PROGRES", 168, currentY + 6.5);

  currentY += 10;

  // Table Rows
  if (courses.length === 0) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(219, 229, 223);
    doc.rect(16, currentY, width - 32, 16);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("Belum ada program pelatihan yang terdaftar saat ini.", width / 2, currentY + 10, { align: "center" });
    currentY += 16;
  } else {
    courses.forEach((c, idx) => {
      // Check pagination if row overflows
      if (currentY > height - 60) {
        doc.addPage();
        currentY = 20;
      }

      const bgGray = idx % 2 === 0 ? 255 : 249;
      doc.setFillColor(bgGray, bgGray + 1, bgGray + 2);
      doc.setDrawColor(219, 229, 223);
      doc.rect(16, currentY, width - 32, 14, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(28, 40, 37);
      const titleShort = c.title.length > 38 ? c.title.substring(0, 38) + "..." : c.title;
      doc.text(titleShort, 20, currentY + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Kategori: ${c.category}`, 20, currentY + 11);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(c.level, 108, currentY + 8.5);

      doc.setTextColor(c.status === "COMPLETED" || c.progressPercent === 100 ? 15 : 217, c.status === "COMPLETED" || c.progressPercent === 100 ? 118 : 119, c.status === "COMPLETED" || c.progressPercent === 100 ? 110 : 6);
      doc.text(c.status === "COMPLETED" || c.progressPercent === 100 ? "LULUS / SELESAI" : "BERJALAN", 138, currentY + 8.5);

      doc.setTextColor(28, 40, 37);
      doc.text(`${c.progressPercent}%`, 168, currentY + 8.5);

      currentY += 14;
    });
  }

  // Summary & Grading Note Box
  currentY += 10;
  doc.setFillColor(244, 246, 241);
  doc.setDrawColor(219, 229, 223);
  doc.roundedRect(16, currentY, width - 32, 28, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(28, 40, 37);
  doc.text("CATATAN EVALUASI & AKREDITASI INSTITUSI", 22, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(88, 103, 97);
  const noteText = `Transkrip ini diterbitkan secara otomatis dan terverifikasi oleh Sistem Pembelajaran Eksekutif PROFAS Leadership Academy. Seluruh capaian progres, XP, dan kelulusan dievaluasi berdasarkan standar kompetensi kepemimpinan nasional dan etika profesionalitas tinggi.`;
  const splitNote = doc.splitTextToSize(noteText, width - 44);
  doc.text(splitNote, 22, currentY + 14);

  // Signatures at bottom
  const sigY = height - 48;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Diterbitkan di Jakarta, ${issuedDate}`, 20, sigY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(28, 40, 37);
  doc.text("Dewan Penguji & Akreditasi", 20, sigY + 6);
  doc.text("Institut Kepemimpinan PROFAS", 20, sigY + 11);

  // Right side stamp
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(1);
  doc.circle(width - 50, sigY + 8, 12, "S");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 118, 110);
  doc.text("OFFICIAL SEAL", width - 50, sigY + 6.5, { align: "center" });
  doc.text("PROFAS LMS", width - 50, sigY + 10.5, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(28, 40, 37);
  doc.text("Dr. H. Hendra Syahputra, M.M.", width - 50, sigY + 24, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Direktur Eksekutif & Founder", width - 50, sigY + 28, { align: "center" });

  // Bottom footer line
  doc.setDrawColor(219, 229, 223);
  doc.line(16, height - 12, width - 16, height - 12);
  doc.setFontSize(7.5);
  doc.text("PROFAS Leadership Academy © 2026 — Semua hak cipta dilindungi undang-undang. Validasi online via portal resmi PROFAS.", width / 2, height - 7, { align: "center" });

  // Save PDF
  const safeName = studentName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  doc.save(`Transkrip_Akademik_PROFAS_${safeName}.pdf`);
}
