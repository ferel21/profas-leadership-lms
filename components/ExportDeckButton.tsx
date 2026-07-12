"use client";

import React, { useState } from "react";
import { Presentation, Download, CheckCircle2, Loader2 } from "lucide-react";
import { generateExecutiveSlideDeck, SlideDeckOptions } from "@/lib/pptxGenerator";

interface ExportDeckButtonProps extends SlideDeckOptions {
  className?: string;
  label?: string;
}

export function ExportDeckButton({
  courseTitle,
  category,
  level,
  mentorName,
  durationHours,
  modules,
  outcomes,
  className = "",
  label = "Unduh Slide Deck Presentation (16:9 PDF)",
}: ExportDeckButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setSuccess(false);

    try {
      generateExecutiveSlideDeck({
        courseTitle,
        category,
        level,
        mentorName,
        durationHours,
        modules,
        outcomes,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Gagal mengunduh slide deck:", error);
      alert("Terjadi kesalahan saat menghasilkan slide deck presentasi.");
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
          ? "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-purple-500/10"
          : "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-blue-100 hover:text-white hover:shadow-blue-500/10 hover:-translate-y-0.5"
      } backdrop-blur-md ${className}`}
      title="Unduh Executive Slide Deck & Presentation Outline dengan rasio layar lebar 16:9"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
      ) : success ? (
        <CheckCircle2 className="w-4 h-4 text-purple-400" />
      ) : (
        <Presentation className="w-4 h-4 text-teal-400" />
      )}
      <span>{success ? "Slide Deck Terunduh!" : label}</span>
      {!loading && !success && <Download className="w-3.5 h-3.5 opacity-75" />}
    </button>
  );
}
