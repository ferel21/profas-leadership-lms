"use client";

import { FileText } from "lucide-react";
import { ExportActionButton } from "@/components/ui/ExportActionButton";
import { generateAcademicTranscriptPDF, TranscriptOptions } from "@/services/export/pdfTranscriptGenerator";

interface ExportTranscriptButtonProps extends TranscriptOptions {
  className?: string;
  label?: string;
}

export function ExportTranscriptButton({
  className,
  label = "Unduh Transkrip Akademik (PDF Resmi)",
  ...options
}: ExportTranscriptButtonProps) {
  return (
    <ExportActionButton
      variant="document-accent"
      icon={FileText}
      label={label}
      successLabel="Transkrip Terunduh!"
      title="Unduh Transkrip Akademik & Rekapitulasi Portofolio Kepemimpinan dalam format PDF Resmi"
      className={className}
      errorMessage="Terjadi kesalahan saat membuat file Transkrip Akademik PDF."
      onExport={() => generateAcademicTranscriptPDF(options)}
    />
  );
}
