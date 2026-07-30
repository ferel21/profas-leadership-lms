"use client";

import { FileSpreadsheet } from "lucide-react";
import { ExportActionButton } from "@/components/ui/ExportActionButton";
import type {
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
  loadLatest?: boolean;
}

export function ExportReportsButton({
  label = "Unduh Laporan Excel (.xlsx)",
  students = [],
  attendances = [],
  xpLogs = [],
  className,
  loadLatest = false,
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
      onExport={async () => {
        let latestStudents = students;
        let latestAttendances = attendances;
        let latestXpLogs = xpLogs;
        if (loadLatest) {
          const response = await fetch("/api/analytics/export-data");
          const data = await response.json().catch(() => null);
          if (!response.ok || !data) {
            throw new Error(data?.message ?? "Data laporan belum dapat dimuat.");
          }
          latestStudents = Array.isArray(data.students) ? data.students : [];
          latestAttendances = Array.isArray(data.attendances) ? data.attendances : [];
          latestXpLogs = Array.isArray(data.xpLogs) ? data.xpLogs : [];
        }
        const { generateExcelReport } = await import("@/services/export/xlsxExport");
        return generateExcelReport({
          fileName: `PROFAS-LMS-Analytics-${new Date().toISOString().split("T")[0]}.xlsx`,
          students: latestStudents,
          attendances: latestAttendances,
          xpLogs: latestXpLogs,
        });
      }}
    />
  );
}
