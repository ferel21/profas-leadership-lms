"use client";

import React, { useState } from "react";
import { FileText, Download, CheckCircle2, Loader2 } from "lucide-react";
import { generateSyllabusDocx, SyllabusDocxOptions } from "@/lib/docxExport";

interface ExportSyllabusButtonProps extends SyllabusDocxOptions {
  className?: string;
  label?: string;
}

export function ExportSyllabusButton({
  courseTitle,
  category,
  level,
  mentorName,
  durationHours,
  modules,
  userNotes,
  className = "",
  label = "Unduh Silabus & Catatan (DOCX)",
}: ExportSyllabusButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      await generateSyllabusDocx({
        courseTitle,
        category,
        level,
        mentorName,
        durationHours,
        modules,
        userNotes,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Gagal mengunduh silabus DOCX:", error);
      alert("Terjadi kesalahan saat membuat file Word (.docx).");
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
          ? "bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-blue-500/10"
          : "bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-200 hover:text-white hover:shadow-slate-900/20 hover:-translate-y-0.5"
      } backdrop-blur-md ${className}`}
      title="Unduh silabus lengkap dan catatan belajar ke format Microsoft Word (.docx)"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      ) : success ? (
        <CheckCircle2 className="w-4 h-4 text-blue-400" />
      ) : (
        <FileText className="w-4 h-4 text-blue-400" />
      )}
      <span>{success ? "Silabus Word Terunduh!" : label}</span>
      {!loading && !success && <Download className="w-3.5 h-3.5 opacity-75" />}
    </button>
  );
}
