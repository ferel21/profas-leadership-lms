import * as XLSX from "xlsx";

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

/**
 * Utility untuk membuat dan mengunduh file Excel (.xlsx) dengan multi-sheet profesional.
 * Dilengkapi dengan pemformatan lebar kolom otomatis dan struktur data eksekutif.
 */
export function generateExcelReport({
  fileName = `PROFAS-LMS-Report-${new Date().toISOString().split("T")[0]}.xlsx`,
  students = [],
  attendances = [],
  xpLogs = [],
}: {
  fileName?: string;
  students?: StudentReportRow[];
  attendances?: AttendanceReportRow[];
  xpLogs?: XPReportRow[];
}): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rekap Nilai & Progres Peserta
  const studentData = students.length > 0 ? students.map((s, idx) => ({
    "No": idx + 1,
    "Nama Peserta": s.name,
    "Email": s.email,
    "Program Kelas": s.courseTitle,
    "Status": s.status,
    "Nilai Akhir / Kuis": s.score !== undefined ? `${s.score} / 100` : "-",
    "Tanggal Selesai": s.completedAt || "-",
  })) : [{
    "No": 1,
    "Nama Peserta": "Demo Peserta",
    "Email": "peserta@profas.id",
    "Program Kelas": "Fondasi Kepemimpinan Berdampak",
    "Status": "COMPLETED",
    "Nilai Akhir / Kuis": "92 / 100",
    "Tanggal Selesai": new Date().toLocaleDateString("id-ID"),
  }];

  const wsStudents = XLSX.utils.json_to_sheet(studentData);
  // Auto-size kolom
  wsStudents["!cols"] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 28 },
    { wch: 35 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, "Rekap Nilai Kuis");

  // Sheet 2: Log Kehadiran & Absensi
  const attendanceData = attendances.length > 0 ? attendances.map((a, idx) => ({
    "No": idx + 1,
    "Nama Acara / Sesi": a.eventName,
    "Nama Peserta": a.userName,
    "Status Kehadiran": a.status,
    "Waktu Check-In": a.checkedInAt,
    "Catatan": a.note || "-",
  })) : [{
    "No": 1,
    "Nama Acara / Sesi": "Masterclass Kepemimpinan Eksekutif",
    "Nama Peserta": "Demo Peserta",
    "Status Kehadiran": "PRESENT",
    "Waktu Check-In": new Date().toLocaleString("id-ID"),
    "Catatan": "Hadir tepat waktu",
  }];

  const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
  wsAttendance["!cols"] = [
    { wch: 6 },
    { wch: 35 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAttendance, "Log Kehadiran");

  // Sheet 3: Leaderboard XP & Aktivitas
  const xpData = xpLogs.length > 0 ? xpLogs.map((x, idx) => ({
    "Peringkat": idx + 1,
    "Nama Pengguna": x.userName,
    "Total XP": x.totalXP,
    "Sumber Utama": x.source,
    "Aktivitas Terakhir": x.lastActivity,
  })) : [
    { "Peringkat": 1, "Nama Pengguna": "Dian Sastrowardoyo", "Total XP": 1450, "Sumber Utama": "Kuis & Modul", "Aktivitas Terakhir": "Hari ini" },
    { "Peringkat": 2, "Nama Pengguna": "Budi Santoso", "Total XP": 1280, "Sumber Utama": "Diskusi Forum", "Aktivitas Terakhir": "Kemarin" },
    { "Peringkat": 3, "Nama Pengguna": "Siti Nurhaliza", "Total XP": 1150, "Sumber Utama": "Penyelesaian Kelas", "Aktivitas Terakhir": "2 hari lalu" },
  ];

  const wsXP = XLSX.utils.json_to_sheet(xpData);
  wsXP["!cols"] = [
    { wch: 10 },
    { wch: 28 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsXP, "Leaderboard XP");

  // Unduh workbook
  XLSX.writeFile(wb, fileName);
}
