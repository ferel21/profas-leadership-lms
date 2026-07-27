"use client";

import { useState } from "react";
import { Check, Download, Share2, Loader2 } from "lucide-react";
import { CertificatePDFButton } from "@/components/shared/CertificatePDFButton";

interface CertificateActionsProps {
  title: string;
  uniqueNumber: string;
  recipientName?: string;
  issuedAt?: string;
  mentorName?: string;
}

export function CertificateActions({
  title,
  uniqueNumber,
  recipientName = "Peserta PROFAS Leadership",
  issuedAt = new Date().toLocaleDateString("id-ID"),
  mentorName = "Dr. Ratna Maharani",
}: CertificateActionsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function share() {
    const data = { title: `Sertifikat ${title}`, text: `Lihat sertifikat PROFAS Leadership untuk ${title}.`, url: window.location.href };
    if (navigator.share) { await navigator.share(data).catch(() => undefined); return; }
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Salin tautan sertifikat:", window.location.href); }
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const element = document.querySelector(".certificate-paper") as HTMLElement;
      if (!element) return window.print();

      const [html2canvasMod, jsPDFMod] = await Promise.all([
        import("html2canvas").then((m) => m.default),
        import("jspdf").then((m) => m.default),
      ]);

      const canvas = await html2canvasMod(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDFMod("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sertifikat-PROFAS-${uniqueNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="cert-actions">
      <CertificatePDFButton
        recipientName={recipientName}
        courseTitle={title}
        uniqueNumber={uniqueNumber}
        issuedAt={issuedAt}
        mentorName={mentorName}
        label="Unduh PDF resmi"
      />
      <button className="cert-action-button" onClick={downloadPdf} disabled={downloading}>
        {downloading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
        <span>{downloading ? "Menyiapkan salinan…" : "Simpan salinan visual"}</span>
      </button>
      <button className="cert-action-button" onClick={share}>
        {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        <span>{copied ? "Tautan disalin" : "Bagikan Tautan"}</span>
      </button>
    </div>
  );
}
