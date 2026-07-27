"use client";

import React, { useState } from "react";
import { Download, CheckCircle2, Loader2, Award } from "lucide-react";
import type { CertificatePDFOptions } from "@/services/export/pdfGenerator";

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

  const handleDownload = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      // jspdf is ~320 KB uncompressed. /sertifikat/[number] is a public,
      // shareable page, so it is fetched on click rather than shipped to
      // everyone who merely opens a certificate link.
      const { generateCertificatePDF } = await import("@/services/export/pdfGenerator");
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
      className={`cert-action-button cert-action-primary ${success ? "is-success" : ""} ${className}`}
      title="Unduh sertifikat resmi dalam format PDF"
      aria-live="polite"
    >
      {loading ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : success ? (
        <CheckCircle2 aria-hidden="true" />
      ) : (
        <Award aria-hidden="true" />
      )}
      <span>{success ? "PDF berhasil diunduh" : label}</span>
      {!loading && !success && <Download aria-hidden="true" />}
    </button>
  );
}
