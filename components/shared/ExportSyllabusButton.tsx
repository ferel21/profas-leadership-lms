"use client";

import { FileText } from "lucide-react";
import { ExportActionButton } from "@/components/ui/ExportActionButton";
import { generateSyllabusDocx, SyllabusDocxOptions } from "@/services/export/docxExport";

interface ExportSyllabusButtonProps extends SyllabusDocxOptions {
  className?: string;
  label?: string;
}

export function ExportSyllabusButton({
  className,
  label = "Unduh Silabus & Catatan (DOCX)",
  ...options
}: ExportSyllabusButtonProps) {
  return (
    <ExportActionButton
      variant="document-dark"
      icon={FileText}
      label={label}
      successLabel="Silabus Word Terunduh!"
      title="Unduh silabus lengkap dan catatan belajar ke format Microsoft Word (.docx)"
      className={className}
      errorMessage="Terjadi kesalahan saat membuat file Word (.docx)."
      onExport={() => generateSyllabusDocx(options)}
    />
  );
}
