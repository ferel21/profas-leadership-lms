import { jsPDF } from "jspdf";

export interface SlideDeckModule {
  title: string;
  durationMin?: number;
  type?: string;
  description?: string;
}

export interface SlideDeckOptions {
  courseTitle: string;
  category: string;
  level: string;
  mentorName: string;
  durationHours: number;
  modules: SlideDeckModule[];
  outcomes?: string;
}

/**
 * Utility untuk membuat Executive Slide Deck & Presentation Outline (.pdf/.pptx pack).
 * Didesain dengan filosofi `pptx` & `canvas-design`: rasio 16:9 lanskap eksekutif,
 * tipografi tegas bertingkat (Tidal Editorial Design System), dan slide modular.
 */
export function generateExecutiveSlideDeck({
  courseTitle,
  category,
  level,
  mentorName,
  durationHours,
  modules,
  outcomes = "Peningkatan kompetensi strategis, kepemimpinan transformasional, dan resolusi konflik organisasi.",
}: SlideDeckOptions): void {
  // Rasio 16:9 Widescreen (297 x 167 mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [297, 167],
  });

  const width = 297;
  const height = 167;

  // Helper: Gambar latar belakang dan footer konsisten di setiap slide
  const drawSlideChrome = (slideNum: number, totalSlides: number, slideTitle?: string) => {
    // Canvas background #F4F6F1 (Warm off-white surface dari DESIGN.md)
    doc.setFillColor(244, 246, 241);
    doc.rect(0, 0, width, height, "F");

    // Top accent border (Teal #0F766E)
    doc.setFillColor(15, 118, 110);
    doc.rect(0, 0, width, 4, "F");

    // Bottom dark surface (#173C37)
    doc.setFillColor(23, 60, 55);
    doc.rect(0, height - 14, width, 14, "F");

    // Footer text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("PROFAS LEADERSHIP ACADEMY", 12, height - 5.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(`Executive Presentation Deck — ${courseTitle.substring(0, 45)}${courseTitle.length > 45 ? "..." : ""}`, width / 2, height - 5.5, { align: "center" });
    doc.text(`Slide ${slideNum} of ${totalSlides}`, width - 12, height - 5.5, { align: "right" });

    // Slide Title Header if applicable
    if (slideTitle) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(28, 40, 37); // Ink #1C2825
      doc.text(slideTitle.toUpperCase(), 16, 20);

      doc.setDrawColor(219, 229, 223); // Line #DBE5DF
      doc.setLineWidth(0.5);
      doc.line(16, 24, width - 16, 24);
    }
  };

  const totalSlides = Math.max(3, 2 + Math.ceil(modules.length / 3));

  // --- SLIDE 1: TITLE SLIDE (Cover) ---
  drawSlideChrome(1, totalSlides);

  // Decorative Box di sebelah kiri
  doc.setFillColor(15, 118, 110); // Teal accent
  doc.rect(16, 28, 6, 85, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text(`MODUL KEPEMIMPINAN EKSEKUTIF • ${level.toUpperCase()}`, 28, 38);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(28, 40, 37); // Ink
  const splitTitle = doc.splitTextToSize(courseTitle, width - 60);
  doc.text(splitTitle, 28, 54);

  const titleLinesCount = splitTitle.length;
  const afterTitleY = 54 + titleLinesCount * 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(88, 103, 97); // Body text #586761
  doc.text(`Kategori: ${category}  •  Durasi Program: ${durationHours} Jam Intensif`, 28, afterTitleY);

  // Mentor Info Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(219, 229, 223);
  doc.setLineWidth(0.5);
  doc.roundedRect(28, afterTitleY + 12, 140, 26, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(28, 40, 37);
  doc.text("Instruktur & Mentor Utama:", 34, afterTitleY + 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text(mentorName, 34, afterTitleY + 30);

  // --- SLIDE 2: PROGRAM OUTCOMES & ARCHITECTURE ---
  doc.addPage();
  drawSlideChrome(2, totalSlides, "Rangkuman Target & Capaian Kepemimpinan (Outcomes)");

  // 3 Pillar Columns
  const colWidth = (width - 48) / 3;
  const colY = 35;
  const pillars = [
    {
      title: "1. CLARITY (Kejelasan)",
      desc: "Membentuk ketajaman analitis dalam mengambil keputusan strategis di bawah tekanan eksekutif yang tinggi serta memetakan prioritas.",
    },
    {
      title: "2. CAPABILITY (Kapasitas)",
      desc: "Menguasai framework kepemimpinan praktis, manajemen tim multidisiplin, dan eksekusi program berorientasi hasil terukur.",
    },
    {
      title: "3. CONTINUITY (Keberlanjutan)",
      desc: outcomes || "Membangun budaya inovasi yang tangguh, etika kepemimpinan institusional, serta penciptaan kader penerus organisasi.",
    },
  ];

  pillars.forEach((p, i) => {
    const xPos = 16 + i * (colWidth + 8);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(219, 229, 223);
    doc.setLineWidth(0.6);
    doc.roundedRect(xPos, colY, colWidth, 95, 4, 4, "FD");

    // Pillar Header Box
    doc.setFillColor(23, 60, 55); // Deep surface
    doc.roundedRect(xPos, colY, colWidth, 18, 4, 4, "F");
    doc.rect(xPos, colY + 10, colWidth, 8, "F"); // flatten bottom corners of header

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(p.title, xPos + colWidth / 2, colY + 11.5, { align: "center" });

    // Pillar Desc
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(88, 103, 97);
    const splitDesc = doc.splitTextToSize(p.desc, colWidth - 12);
    doc.text(splitDesc, xPos + 6, colY + 32);
  });

  // --- SLIDE 3+: CURRICULUM MODULES (3 modules per slide) ---
  const modulesPerSlide = 3;
  for (let i = 0; i < modules.length; i += modulesPerSlide) {
    doc.addPage();
    const currentSlideNum = 3 + Math.floor(i / modulesPerSlide);
    drawSlideChrome(currentSlideNum, totalSlides, `Struktur Kurikulum — Modul ${i + 1} s/d ${Math.min(i + modulesPerSlide, modules.length)}`);

    const chunk = modules.slice(i, i + modulesPerSlide);
    chunk.forEach((mod, idx) => {
      const rowY = 36 + idx * 36;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(219, 229, 223);
      doc.setLineWidth(0.6);
      doc.roundedRect(16, rowY, width - 32, 30, 3, 3, "FD");

      // Badge Number
      doc.setFillColor(15, 118, 110);
      doc.roundedRect(22, rowY + 6, 12, 18, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`${i + idx + 1}`, 28, rowY + 18, { align: "center" });

      // Title & Meta
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(28, 40, 37);
      doc.text(mod.title, 40, rowY + 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(15, 118, 110);
      const metaText = `[Tipe: ${mod.type || "VIDEO/MATERI"}]  •  Durasi Estimasi: ${mod.durationMin || 30} Menit`;
      doc.text(metaText, 40, rowY + 22);

      // Description
      if (mod.description) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        const shortDesc = mod.description.length > 90 ? mod.description.substring(0, 90) + "..." : mod.description;
        doc.text(shortDesc, 140, rowY + 18);
      }
    });
  }

  // Save Widescreen Slide Deck PDF
  const safeTitle = courseTitle.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
  doc.save(`Slide_Deck_PROFAS_${safeTitle}.pdf`);
}
