"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, CheckCircle2, Loader2 } from "lucide-react";
import { generateExcelReport, StudentReportRow, AttendanceReportRow, XPReportRow } from "@/lib/xlsxExport";

interface ExportReportsButtonProps {
  label?: string;
  students?: StudentReportRow[];
  attendances?: AttendanceReportRow[];
  xpLogs?: XPReportRow[];
  className?: string;
}

export function ExportReportsButton({
  label = "Unduh Laporan Excel (.xlsx)",
  students = [],
  attendances = [],
  xpLogs = [],
  className = "",
}: ExportReportsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    setLoading(true);
    setSuccess(false);

    try {
      generateExcelReport({
        fileName: `PROFAS-LMS-Analytics-${new Date().toISOString().split("T")[0]}.xlsx`,
        students,
        attendances,
        xpLogs,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Gagal mengunduh laporan Excel:", error);
      alert("Terjadi kesalahan saat membuat file Excel. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 shadow-sm border ${
        success
          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
          : "bg-teal-500/15 hover:bg-teal-500/25 border-teal-500/30 text-teal-300 hover:shadow-teal-500/10 hover:-translate-y-0.5"
      } backdrop-blur-md ${className}`}
      title="Ekspor laporan multi-sheet dalam format Excel (.xlsx)"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
      ) : success ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <FileSpreadsheet className="w-4 h-4 text-teal-400" />
      )}
      <span>{success ? "Laporan Excel Terunduh!" : label}</span>
      {!loading && !success && <Download className="w-3.5 h-3.5 opacity-75" />}
    </button>
  );
}
