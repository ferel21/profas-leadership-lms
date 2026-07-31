import { jsPDF } from "jspdf";

export interface CertificatePDFOptions {
  recipientName: string;
  courseTitle: string;
  uniqueNumber: string;
  issuedAt: string;
  mentorName?: string;
  roleDescription?: string;
}

/**
 * Utility untuk membuat dokumen PDF sertifikat dalam bahasa visual PROFAS.
 * Dokumen menggunakan kanvas A4 lanskap, warna biru PROFAS, aksen emas, dan stempel digital.
 */
export function generateCertificatePDF({
  recipientName,
  courseTitle,
  uniqueNumber,
  issuedAt,
  mentorName = "Dr. H. Hendra Syahputra, M.M.",
  roleDescription = "Peserta telah memenuhi kualifikasi kepemimpinan eksekutif dan lulus seluruh evaluasi modul dengan predikat Sangat Memuaskan.",
}: CertificatePDFOptions): void {
  // Lanskap A4 (297 x 210 mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Warm white canvas.
  doc.setFillColor(250, 251, 248);
  doc.rect(0, 0, width, height, "F");

  // Deep-blue outer rule.
  doc.setDrawColor(23, 63, 115);
  doc.setLineWidth(2.5);
  doc.rect(10, 10, width - 20, height - 20);

  // PROFAS-blue inner rule.
  doc.setDrawColor(42, 107, 167);
  doc.setLineWidth(0.8);
  doc.rect(14, 14, width - 28, height - 28);

  // Gold corner markers.
  const cornerSize = 12;
  doc.setDrawColor(243, 180, 68);
  doc.setLineWidth(1.2);
  // Top-left corner
  doc.line(14, 14 + cornerSize, 14, 14);
  doc.line(14, 14, 14 + cornerSize, 14);
  // Top-right corner
  doc.line(width - 14 - cornerSize, 14, width - 14, 14);
  doc.line(width - 14, 14, width - 14, 14 + cornerSize);
  // Bottom-left corner
  doc.line(14, height - 14 - cornerSize, 14, height - 14);
  doc.line(14, height - 14, 14 + cornerSize, height - 14);
  // Bottom-right corner
  doc.line(width - 14 - cornerSize, height - 14, width - 14, height - 14);
  doc.line(width - 14, height - 14, width - 14, height - 14 - cornerSize);

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(42, 107, 167);
  doc.text("PROFAS LEADERSHIP", width / 2, 34, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(16, 21, 25);
  doc.text("SERTIFIKAT PENYELESAIAN", width / 2, 48, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text("Diberikan sebagai pengakuan atas penyelesaian perjalanan belajar kepada:", width / 2, 64, { align: "center" });

  // Recipient Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(16, 21, 25);
  doc.text(recipientName.toUpperCase(), width / 2, 84, { align: "center" });

  // Line under name
  doc.setDrawColor(243, 180, 68);
  doc.setLineWidth(0.8);
  const nameWidth = doc.getTextWidth(recipientName.toUpperCase());
  doc.line(width / 2 - nameWidth / 2 - 10, 88, width / 2 + nameWidth / 2 + 10, 88);

  // Course Description & Title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(75, 85, 99);
  doc.text("Telah berhasil menyelesaikan rangkaian kurikulum dan evaluasi pada program:", width / 2, 104, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 90, 143);
  doc.text(`"${courseTitle}"`, width / 2, 118, { align: "center" });

  // Role Description
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(107, 114, 128);
  const splitDesc = doc.splitTextToSize(roleDescription, width - 80);
  doc.text(splitDesc, width / 2, 132, { align: "center" });

  // Verification Box & Stamp (Left side bottom)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 128);
  doc.text("Nomor Sertifikat Resmi:", 35, 160);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(16, 21, 25);
  doc.text(uniqueNumber, 35, 166);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 128);
  doc.text(`Tanggal Terbit: ${issuedAt}`, 35, 173);

  // Digital Verification Seal (Middle circle)
  const sealX = width / 2;
  const sealY = 168;
  doc.setDrawColor(243, 180, 68);
  doc.setLineWidth(1.2);
  doc.circle(sealX, sealY, 15, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(173, 112, 0);
  doc.text("VERIFIED", sealX, sealY - 2, { align: "center" });
  doc.setFontSize(6.5);
  doc.text("PROFAS LEADERSHIP", sealX, sealY + 3, { align: "center" });

  // Signature Area (Right side bottom)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(16, 21, 25);
  doc.text(mentorName, width - 65, 168, { align: "center" });

  doc.setDrawColor(23, 63, 115);
  doc.setLineWidth(0.5);
  doc.line(width - 95, 171, width - 35, 171);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(107, 114, 128);
  doc.text("Direktur Akademik & Mentor Utama", width - 65, 176, { align: "center" });

  // Footer URL
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const verificationOrigin = typeof window === "undefined" ? "" : window.location.origin;
  doc.text(`Verifikasi kredensial: ${verificationOrigin}/sertifikat/${uniqueNumber}`, width / 2, 194, { align: "center" });

  // Save PDF
  doc.save(`Sertifikat-PROFAS-${uniqueNumber}.pdf`);
}

// ============================================================
// Student Progress Report PDF (A4 Portrait)
// ============================================================

export interface StudentProgressCourse {
  title: string;
  category: string;
  progressPercent: number;
  status: string;
  pretestScore: number | null;
  posttestScore: number | null;
  finalScore: number | null;
}

export interface StudentProgressPDFOptions {
  studentName: string;
  studentEmail: string;
  organization?: string;
  totalXP: number;
  badgesCount: number;
  courses: StudentProgressCourse[];
  generatedBy?: string;
}

/**
 * Membuat laporan progres belajar peserta individual dalam format PDF A4 portrait.
 * Mencakup: identitas, tabel program (progres, skor pre-test, post-test, final), dan KPI ringkasan.
 */
export function generateStudentProgressPDF({
  studentName,
  studentEmail,
  organization = "",
  totalXP,
  badgesCount,
  courses,
  generatedBy = "Admin PROFAS Leadership",
}: StudentProgressPDFOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();  // 297
  const margin = 18;
  let y = margin;

  // --- Background ---
  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, W, H, "F");

  // --- Header bar ---
  doc.setFillColor(30, 90, 143);
  doc.rect(0, 0, W, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text("PROFAS LEADERSHIP", margin, 15);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(186, 214, 240);
  doc.text("Laporan Progres Belajar Peserta", margin, 22);
  doc.setFontSize(8);
  doc.setTextColor(163, 197, 230);
  doc.text(`Digenerate: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}  •  Oleh: ${generatedBy}`, margin, 30);
  y = 50;

  // --- Identity card ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, W - margin * 2, 34, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(16, 21, 25);
  doc.text(studentName, margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(studentEmail, margin + 6, y + 17);
  if (organization) doc.text(organization, margin + 6, y + 23);

  // KPI pills (right side)
  const pillX = W - margin - 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(42, 107, 167);
  doc.text(`${totalXP.toLocaleString("id-ID")} XP`, pillX, y + 10, { align: "right" });
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.text("Total XP Diperoleh", pillX, y + 16, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 163, 74);
  doc.text(`${badgesCount} Badge`, pillX, y + 24, { align: "right" });
  doc.setTextColor(107, 114, 128);
  doc.setFont("helvetica", "normal");
  doc.text("Penghargaan", pillX, y + 30, { align: "right" });

  y += 44;

  // --- Table header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 21, 25);
  doc.text("Detail Progres Per Program", margin, y);
  y += 7;

  const colX = [margin, margin + 64, margin + 100, margin + 118, margin + 136, margin + 154];
  const colW = [64, 36, 18, 18, 18, 18];
  const headers = ["Program Kepemimpinan", "Status", "Pre", "Post", "Final", "Progres"];

  // Table header row
  doc.setFillColor(30, 90, 143);
  doc.rect(margin, y, W - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  headers.forEach((h, i) => {
    doc.text(h, colX[i] + colW[i] / 2, y + 5.5, { align: "center" });
  });
  y += 8;

  // Table rows
  const maxRows = courses.slice(0, 20); // max 20 rows per page
  maxRows.forEach((c, idx) => {
    const rowBg = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, W - margin * 2, 9, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(16, 21, 25);

    // Program title (truncate if long)
    const title = c.title.length > 36 ? c.title.substring(0, 34) + "…" : c.title;
    doc.text(title, colX[0] + 2, y + 5.5);

    // Status badge color
    const isCompleted = c.status === "COMPLETED" || c.status === "LULUS";
    const isInProgress = c.status === "ACTIVE" || c.status === "IN_PROGRESS";
    if (isCompleted) doc.setTextColor(16, 163, 74);
    else if (isInProgress) doc.setTextColor(42, 107, 167);
    else doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "bold");
    const statusLabel = isCompleted ? "LULUS" : isInProgress ? "AKTIF" : "BELUM";
    doc.text(statusLabel, colX[1] + colW[1] / 2, y + 5.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(16, 21, 25);

    // Skor
    doc.text(c.pretestScore !== null ? String(c.pretestScore) : "—", colX[2] + colW[2] / 2, y + 5.5, { align: "center" });
    doc.text(c.posttestScore !== null ? String(c.posttestScore) : "—", colX[3] + colW[3] / 2, y + 5.5, { align: "center" });
    doc.text(c.finalScore !== null ? String(c.finalScore) : "—", colX[4] + colW[4] / 2, y + 5.5, { align: "center" });

    // Progress bar
    const barX = colX[5] + 2;
    const barW = colW[5] - 4;
    const barY = y + 3;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(barX, barY, barW, 3.5, 1, 1, "F");
    const fill = Math.min(100, Math.max(0, c.progressPercent));
    if (fill > 0) {
      doc.setFillColor(42, 107, 167);
      doc.roundedRect(barX, barY, barW * fill / 100, 3.5, 1, 1, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`${fill}%`, colX[5] + colW[5] / 2, y + 8, { align: "center" });

    // Draw bottom border
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 9, W - margin, y + 9);

    y += 9;
  });

  y += 10;

  // --- KPI Summary box ---
  const totalLulus = courses.filter(c => c.status === "COMPLETED" || c.status === "LULUS").length;
  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((a, c) => a + c.progressPercent, 0) / courses.length)
    : 0;
  const preScores = courses.filter(c => c.pretestScore !== null).map(c => c.pretestScore as number);
  const postScores = courses.filter(c => c.posttestScore !== null).map(c => c.posttestScore as number);
  const avgPre = preScores.length > 0 ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length) : null;
  const avgPost = postScores.length > 0 ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length) : null;

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, W - margin * 2, 40, 4, 4, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 90, 143);
  doc.text("Ringkasan KPI Peserta", margin + 6, y + 9);

  const kpiItems = [
    { label: "Total Program", value: String(courses.length) },
    { label: "Program Lulus", value: String(totalLulus) },
    { label: "Rata-rata Progres", value: `${avgProgress}%` },
    { label: "Rata-rata Pre-Test", value: avgPre !== null ? String(avgPre) : "—" },
    { label: "Rata-rata Post-Test", value: avgPost !== null ? String(avgPost) : "—" },
    { label: "Peningkatan Skor", value: (avgPre !== null && avgPost !== null) ? `+${avgPost - avgPre} poin` : "—" },
  ];

  const kpiColW = (W - margin * 2 - 12) / 3;
  kpiItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = margin + 6 + col * kpiColW;
    const ky = y + 16 + row * 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 21, 25);
    doc.text(item.value, kx, ky);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(item.label, kx, ky + 5);
  });

  y += 50;

  // --- Footer ---
  doc.setFillColor(30, 90, 143);
  doc.rect(0, H - 18, W, 18, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(186, 214, 240);
  doc.text("PROFAS Leadership — Platform Pelatihan Kepemimpinan Terstruktur", W / 2, H - 10, { align: "center" });
  doc.text(`Dokumen ini digenerate secara otomatis dari sistem LMS PROFAS pada ${new Date().toLocaleString("id-ID")}`, W / 2, H - 5, { align: "center" });

  doc.save(`Laporan-Progres-${studentName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);
}

