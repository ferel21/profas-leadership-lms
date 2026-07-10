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
 * Utility untuk membuat dokumen PDF Sertifikat Kelulusan bergaya eksekutif.
 * Didesain dengan filosofi `canvas-design` lanskap, bingkai ornamental emas/teal, dan stempel digital.
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

  // Background krem lembut / putih bersih
  doc.setFillColor(254, 254, 253);
  doc.rect(0, 0, width, height, "F");

  // Outer Border (Emas Tua / Slate)
  doc.setDrawColor(15, 23, 42); // Slate 900
  doc.setLineWidth(2.5);
  doc.rect(10, 10, width - 20, height - 20);

  // Inner Border (Teal 600 / Emerald)
  doc.setDrawColor(13, 148, 136); // Teal 600
  doc.setLineWidth(0.8);
  doc.rect(14, 14, width - 28, height - 28);

  // Corner Ornaments (Canvas Design Philosophy)
  const cornerSize = 12;
  doc.setDrawColor(217, 119, 6); // Amber 600 (Emas)
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
  doc.setTextColor(13, 148, 136); // Teal 600
  doc.text("PROFAS LEADERSHIP ACADEMY", width / 2, 34, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("SERTIFIKAT KELULUSAN", width / 2, 48, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text("Diberikan sebagai pengakuan atas dedikasi dan keunggulan kepemimpinan kepada:", width / 2, 64, { align: "center" });

  // Recipient Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42);
  doc.text(recipientName.toUpperCase(), width / 2, 84, { align: "center" });

  // Line under name
  doc.setDrawColor(217, 119, 6); // Amber / Gold
  doc.setLineWidth(0.8);
  const nameWidth = doc.getTextWidth(recipientName.toUpperCase());
  doc.line(width / 2 - nameWidth / 2 - 10, 88, width / 2 + nameWidth / 2 + 10, 88);

  // Course Description & Title
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text("Telah berhasil menyelesaikan seluruh rangkaian kurikulum, evaluasi, dan pretest pada program:", width / 2, 104, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(13, 148, 136); // Teal 600
  doc.text(`"${courseTitle}"`, width / 2, 118, { align: "center" });

  // Role Description
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(100, 116, 139);
  const splitDesc = doc.splitTextToSize(roleDescription, width - 80);
  doc.text(splitDesc, width / 2, 132, { align: "center" });

  // Verification Box & Stamp (Left side bottom)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Nomor Sertifikat Resmi:", 35, 160);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(uniqueNumber, 35, 166);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tanggal Terbit: ${issuedAt}`, 35, 173);

  // Digital Verification Seal (Middle circle)
  const sealX = width / 2;
  const sealY = 168;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.2);
  doc.circle(sealX, sealY, 15, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(217, 119, 6);
  doc.text("VERIFIED", sealX, sealY - 2, { align: "center" });
  doc.setFontSize(6.5);
  doc.text("PROFAS ACADEMY", sealX, sealY + 3, { align: "center" });

  // Signature Area (Right side bottom)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(mentorName, width - 65, 168, { align: "center" });

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(width - 95, 171, width - 35, 171);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Direktur Akademik & Mentor Utama", width - 65, 176, { align: "center" });

  // Footer URL
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Verifikasi keaslian sertifikat secara online di: https://profas-leadership-lms.vercel.app/sertifikat/${uniqueNumber}`, width / 2, 194, { align: "center" });

  // Save PDF
  doc.save(`Sertifikat-PROFAS-${uniqueNumber}.pdf`);
}
