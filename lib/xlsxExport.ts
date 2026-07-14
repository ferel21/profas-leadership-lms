import ExcelJS from "exceljs";

export interface StudentReportRow {
  name: string;
  email: string;
  courseTitle: string;
  role: string;
  status: string;
  score?: number;
  completedAt?: string;
}

export interface AttendanceReportRow {
  eventName: string;
  userName: string;
  status: string;
  checkedInAt: string;
  note?: string;
}

export interface XPReportRow {
  userName: string;
  totalXP: number;
  source: string;
  lastActivity: string;
}

type CellValue = string | number;
type ReportRow = Record<string, CellValue>;

function sanitizeCell(val: CellValue): CellValue {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return val;
  }
  return val;
}

function addSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: ReportRow[], widths: number[]) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = headers.map((header, index) => ({ header, key: header, width: widths[index] ?? 18 }));
  if (rows.length > 0) {
    const sanitizedRows = rows.map(row => {
      const cleanRow: ReportRow = {};
      for (const [key, val] of Object.entries(row)) {
        cleanRow[key] = sanitizeCell(val);
      }
      return cleanRow;
    });
    sheet.addRows(sanitizedRows);
  }
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E5A8F" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
}

export async function downloadExcelWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Generates an XLSX workbook in the browser without parsing untrusted files.
 * The previous SheetJS dependency had a known high-severity advisory and also
 * returned demo rows when the API response was empty; empty reports now stay
 * empty and contain headers only.
 */
export async function generateExcelReport({
  fileName = `PROFAS-LMS-Report-${new Date().toISOString().split("T")[0]}.xlsx`,
  students = [],
  attendances = [],
  xpLogs = [],
}: {
  fileName?: string;
  students?: StudentReportRow[];
  attendances?: AttendanceReportRow[];
  xpLogs?: XPReportRow[];
}): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  addSheet(workbook, "Rekap Nilai Kuis", ["No", "Nama Peserta", "Email", "Program Kelas", "Status", "Nilai Akhir / Kuis", "Tanggal Selesai"], students.map((student, index) => ({
    "No": index + 1,
    "Nama Peserta": student.name,
    "Email": student.email,
    "Program Kelas": student.courseTitle,
    "Status": student.status,
    "Nilai Akhir / Kuis": student.score !== undefined ? `${student.score} / 100` : "-",
    "Tanggal Selesai": student.completedAt || "-",
  })), [6, 25, 28, 35, 15, 18, 20]);

  addSheet(workbook, "Log Kehadiran", ["No", "Nama Acara / Sesi", "Nama Peserta", "Status Kehadiran", "Waktu Check-In", "Catatan"], attendances.map((attendance, index) => ({
    "No": index + 1,
    "Nama Acara / Sesi": attendance.eventName,
    "Nama Peserta": attendance.userName,
    "Status Kehadiran": attendance.status,
    "Waktu Check-In": attendance.checkedInAt,
    "Catatan": attendance.note || "-",
  })), [6, 35, 25, 18, 22, 30]);

  addSheet(workbook, "Leaderboard XP", ["Peringkat", "Nama Pengguna", "Total XP", "Sumber Utama", "Aktivitas Terakhir"], xpLogs.map((log, index) => ({
    "Peringkat": index + 1,
    "Nama Pengguna": log.userName,
    "Total XP": log.totalXP,
    "Sumber Utama": log.source,
    "Aktivitas Terakhir": log.lastActivity,
  })), [10, 28, 15, 25, 20]);

  await downloadExcelWorkbook(workbook, fileName);
}
