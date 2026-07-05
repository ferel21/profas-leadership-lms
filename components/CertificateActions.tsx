"use client";

import { useState } from "react";
import { Check, Download, Share2, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function CertificateActions({title, uniqueNumber}:{title:string, uniqueNumber:string}){
  const [copied,setCopied]=useState(false);
  const [downloading, setDownloading] = useState(false);

  async function share(){
    const data={title:`Sertifikat ${title}`,text:`Lihat sertifikat PROFAS Leadership untuk ${title}.`,url:window.location.href};
    if(navigator.share){await navigator.share(data).catch(()=>undefined);return}
    try{await navigator.clipboard.writeText(window.location.href);setCopied(true);window.setTimeout(()=>setCopied(false),2000)}catch{window.prompt("Salin tautan sertifikat:",window.location.href)}
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const element = document.querySelector('.certificate-paper') as HTMLElement;
      if (!element) return window.print(); // Fallback
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sertifikat-PROFAS-${uniqueNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print(); // Fallback
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="cert-actions">
      <button className="btn btn-primary" onClick={downloadPdf} disabled={downloading}>
        {downloading ? <Loader2 className="animate-spin" /> : <Download/>} {downloading ? "Membuat PDF..." : "Unduh Sertifikat (PDF)"}
      </button>
      <button className="btn btn-outline" onClick={share}>
        {copied?<Check/>:<Share2/>} {copied?"Tautan disalin":"Bagikan"}
      </button>
    </div>
  );
}
