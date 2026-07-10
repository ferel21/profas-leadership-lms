"use client";

import { useState } from "react";
import { Check, Download, Share2, Loader2 } from "lucide-react";
import { CertificatePDFButton } from "@/components/CertificatePDFButton";

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

      const canvas = await html2canvasMod(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
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
    <div className="cert-actions flex flex-wrap items-center justify-center gap-3 mt-6">
      <CertificatePDFButton
        recipientName={recipientName}
        courseTitle={title}
        uniqueNumber={uniqueNumber}
        issuedAt={issuedAt}
        mentorName={mentorName}
        label="Unduh Sertifikat Executive (PDF)"
      />
      <button className="btn btn-outline flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-bold text-sm shadow-sm transition" onClick={downloadPdf} disabled={downloading}>
        {downloading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
        <span>{downloading ? "Membuat PDF Screenshot..." : "Print / Simpan Layout"}</span>
      </button>
      <button className="btn btn-outline flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-300 hover:border-slate-400 bg-white text-slate-700 font-bold text-sm shadow-sm transition" onClick={share}>
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-teal-600" />}
        <span>{copied ? "Tautan disalin" : "Bagikan Tautan"}</span>
      </button>
    </div>
  );
}
