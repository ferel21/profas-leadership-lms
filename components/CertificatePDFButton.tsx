"use client";

import React, { useState } from "react";
import { Download, CheckCircle2, Loader2, Award } from "lucide-react";
import { generateCertificatePDF, CertificatePDFOptions } from "@/lib/pdfGenerator";

interface CertificatePDFButtonProps extends CertificatePDFOptions {
  className?: string;
  label?: string;
}

export function CertificatePDFButton({
  recipientName,
  courseTitle,
  uniqueNumber,
  issuedAt,
  mentorName,
  roleDescription,
  className = "",
  label = "Unduh Sertifikat Resmi (PDF)",
}: CertificatePDFButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    setSuccess(false);

    try {
      generateCertificatePDF({
        recipientName,
        courseTitle,
        uniqueNumber,
        issuedAt,
        mentorName,
        roleDescription,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (error) {
      console.error("Gagal mengunduh sertifikat PDF:", error);
      alert("Terjadi kesalahan saat menghasilkan PDF sertifikat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 shadow-md border ${
        success
          ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-600/20"
          : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 border-teal-500/40 text-white hover:shadow-teal-500/20 hover:-translate-y-0.5"
      } backdrop-blur-md ${className}`}
      title="Unduh sertifikat PDF berbingkai emas dengan verifikasi QR digital"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      ) : success ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
      ) : (
        <Award className="w-4 h-4 text-amber-300" />
      )}
      <span>{success ? "Sertifikat PDF Terunduh!" : label}</span>
      {!loading && !success && <Download className="w-4 h-4 opacity-80" />}
    </button>
  );
}
