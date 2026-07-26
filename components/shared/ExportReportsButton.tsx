"use client";

import { FileSpreadsheet } from "lucide-react";
import { ExportActionButton } from "@/components/ui/ExportActionButton";
import {
  generateExcelReport,
  StudentReportRow,
  AttendanceReportRow,
  XPReportRow,
} from "@/services/export/xlsxExport";

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
  className,
}: ExportReportsButtonProps) {
  return (
    <ExportActionButton
      variant="spreadsheet"
      icon={FileSpreadsheet}
      label={label}
      successLabel="Laporan Excel Terunduh!"
      title="Ekspor laporan multi-sheet dalam format Excel (.xlsx)"
      className={className}
      errorMessage="Terjadi kesalahan saat membuat file Excel. Silakan coba lagi."
      onExport={() =>
        generateExcelReport({
          fileName: `PROFAS-LMS-Analytics-${new Date().toISOString().split("T")[0]}.xlsx`,
          students,
          attendances,
          xpLogs,
        })
      }
    />
  );
}
