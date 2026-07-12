"use client";

import React, { useState } from "react";
import { FileText, Download, CheckCircle2, Loader2 } from "lucide-react";
import { generateAcademicTranscriptPDF, TranscriptOptions } from "@/lib/pdfTranscriptGenerator";

interface ExportTranscriptButtonProps extends TranscriptOptions {
  className?: string;
  label?: string;
}

export function ExportTranscriptButton({
  studentName,
  studentEmail,
  organization,
  role,
  totalXP,
  courses,
  badgesCount,
  attendanceRatePercent,
  issuedDate,
  className = "",
  label = "Unduh Transkrip Akademik (PDF Resmi)",
}: ExportTranscriptButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setSuccess(false);

    try {
      generateAcademicTranscriptPDF({
        studentName,
        studentEmail,
        organization,
        role,
        totalXP,
        courses,
        badgesCount,
        attendanceRatePercent,
        issuedDate,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Gagal mengunduh transkrip akademik:", error);
      alert("Terjadi kesalahan saat membuat file Transkrip Akademik PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-sm border ${
        success
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
          : "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-blue-100 hover:text-white hover:shadow-blue-500/10 hover:-translate-y-0.5"
      } backdrop-blur-md ${className}`}
      title="Unduh Transkrip Akademik & Rekapitulasi Portofolio Kepemimpinan dalam format PDF Resmi"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
      ) : success ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <FileText className="w-4 h-4 text-emerald-400" />
      )}
      <span>{success ? "Transkrip Terunduh!" : label}</span>
      {!loading && !success && <Download className="w-3.5 h-3.5 opacity-75" />}
    </button>
  );
}
