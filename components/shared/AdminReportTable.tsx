"use client";

import { useState } from "react";
import { Search, Filter, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/utils";
import { ExportReportsButton } from "@/components/shared/ExportReportsButton";

export type ReportRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  course: string;
  progress: number;
  score: number | null;
  pretestScore: number | null;
  posttestScore: number | null;
  status: string;
  enrolledAt: string;
};

export function AdminReportTable({ data }: { data: ReportRow[] }) {
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [exporting, setExporting] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  const safeData = data || [];
  const filtered = safeData.filter(r => {
    const nameStr = (r.name || "").toLowerCase();
    const emailStr = (r.email || "").toLowerCase();
    const queryStr = search.toLowerCase();
    const matchSearch = nameStr.includes(queryStr) || emailStr.includes(queryStr);
    const matchCourse = filterCourse ? r.course === filterCourse : true;
    return matchSearch && matchCourse;
  });

  const courses = Array.from(new Set(safeData.map(d => d.course || "Program Umum")));
  const exportStudents = filtered.map(row => ({
    name: row.name || "Tanpa Nama",
    email: row.email || "-",
    courseTitle: row.course || "Program Umum",
    role: "STUDENT",
    status: row.status || "ACTIVE",
    ...(row.score !== null && row.score !== undefined ? { score: row.score } : {}),
  }));

  const handleExport = async () => {
    try {
      setExporting(true);
      const detailData = filtered.map((r, idx) => ({
        "No": idx + 1,
        "Nama Lengkap": r.name || "Tanpa Nama",
        "Email": r.email || "-",
        "Program Kepemimpinan": r.course || "-",
        "Progres (%)": r.progress || 0,
        "Nilai Rata-rata": r.score ?? "-",
        "Status Kelulusan": r.status || "BELUM_LULUS",
        "Tanggal Daftar": r.enrolledAt ? formatDate(new Date(r.enrolledAt)) : "-"
      }));

      const totalPeserta = filtered.length;
      const totalLulus = filtered.filter(r => r.status === "COMPLETED" || r.status === "LULUS").length;
      const rasioLulus = totalPeserta > 0 ? ((totalLulus / totalPeserta) * 100).toFixed(1) + "%" : "0%";
      const rataProgres = totalPeserta > 0 ? (filtered.reduce((a, b) => a + (b.progress || 0), 0) / totalPeserta).toFixed(1) + "%" : "0%";
      
      const kpiData = [
        { "Indikator Kinerja Utama (KPI)": "Total Peserta Terdaftar", "Nilai": totalPeserta },
        { "Indikator Kinerja Utama (KPI)": "Peserta Lulus / Bersertifikat", "Nilai": totalLulus },
        { "Indikator Kinerja Utama (KPI)": "Rasio Kelulusan (%)", "Nilai": rasioLulus },
        { "Indikator Kinerja Utama (KPI)": "Rata-rata Progres Belajar (%)", "Nilai": rataProgres },
        { "Indikator Kinerja Utama (KPI)": "Tanggal Ekspor Laporan", "Nilai": new Date().toLocaleDateString("id-ID") }
      ];

      const { downloadExcelWorkbook } = await import("@/services/export/xlsxExport");
      const detailHeaders = [
        "No",
        "Nama Lengkap",
        "Email",
        "Program Kepemimpinan",
        "Progres (%)",
        "Nilai Rata-rata",
        "Status Kelulusan",
        "Tanggal Daftar",
      ];
      downloadExcelWorkbook([
        {
          name: "Data Detail Peserta",
          headers: detailHeaders,
          rows: detailData.map(row => detailHeaders.map(header => row[header as keyof typeof row])),
          widths: [6, 28, 28, 32, 14, 16, 18, 20],
        },
        {
          name: "Ringkasan KPI",
          headers: ["Indikator Kinerja Utama (KPI)", "Nilai"],
          rows: kpiData.map(row => [row["Indikator Kinerja Utama (KPI)"], row.Nilai]),
          widths: [35, 25],
        },
      ], `Laporan_LMS_PROFAS_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) {
      console.error("Gagal mengekspor file:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportStudentPdf = async (row: ReportRow) => {
    if (downloadingPdfId) return;
    setDownloadingPdfId(row.userId);
    try {
      const res = await fetch(`/api/admin/reports/student?userId=${row.userId}`);
      if (!res.ok) throw new Error("Gagal mengambil data peserta");
      const studentData = await res.json();
      const { generateStudentProgressPDF } = await import("@/services/export/pdfGenerator");
      generateStudentProgressPDF(studentData);
    } catch (err) {
      console.error("Gagal generate PDF:", err);
      alert("Gagal membuat PDF laporan peserta.");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  return (
    <div className="data-card mt-8 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-lg shadow-brand-blue/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Detail Peserta</h2>
          <p className="text-sm text-slate-500 mt-1">Filter, urutkan, dan ekspor data analitik peserta ke format spreadsheet Excel profesional.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            className="btn btn-outline hover-lift flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-blue/30 hover:border-brand-blue bg-brand-blue-soft hover:bg-brand-blue text-brand-blue-dark hover:text-white font-semibold text-sm transition disabled:opacity-50"
          >
            <FileSpreadsheet size={18} className="shrink-0" />
            <span>{exporting ? "Mengekspor..." : "Ekspor Excel (.xlsx)"}</span>
          </button>
          <button
            onClick={() => window.open('/api/admin/reports/export', '_blank')}
            className="btn btn-outline hover-lift flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-brand-green/30 hover:border-brand-green bg-brand-green-soft hover:bg-brand-green text-brand-green-dark hover:text-white font-semibold text-sm transition"
          >
            <FileText size={18} className="shrink-0" />
            <span>Ekspor Semua (CSV)</span>
          </button>
          <ExportReportsButton
            label="Ekspor Multi-Sheet Executive (.xlsx)"
            students={exportStudents}
            className="font-semibold text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama peserta atau email..." 
            aria-label="Cari nama peserta atau email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white transition"
          />
        </div>
        <div className="relative md:w-64">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            aria-label="Filter berdasarkan program kepemimpinan"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white transition appearance-none cursor-pointer"
          >
            <option value="">Semua Program ({safeData.length})</option>
            {courses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200/80">
        <table className="w-full border-collapse text-left text-sm" aria-label="Tabel Laporan Progres Peserta">
          <caption className="sr-only">Laporan Progres Peserta</caption>
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <th className="py-3.5 px-4">Peserta</th>
              <th className="py-3.5 px-4">Program Kepemimpinan</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 w-40">Progres</th>
              <th className="py-3.5 px-4 text-center">Pre-Test</th>
              <th className="py-3.5 px-4 text-center">Post-Test</th>
              <th className="py-3.5 px-4 text-center">Skor Final</th>
              <th className="py-3.5 px-4 text-center">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.slice(0, 50).map(row => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{row.name || "Tanpa Nama"}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{row.email || "-"}</div>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-700">{row.course || "-"}</td>
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                    row.status === "LULUS" || row.status === "COMPLETED"
                      ? "bg-brand-green-soft text-brand-green-dark border border-brand-green/30"
                      : row.status === "IN_PROGRESS"
                      ? "bg-brand-blue-soft text-brand-blue-dark border border-brand-blue/30"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {row.status === "LULUS" || row.status === "COMPLETED" ? "LULUS" : row.status === "IN_PROGRESS" ? "BELAJAR" : row.status || "BELUM"}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={row.progress || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progres belajar ${row.name || "Peserta"}: ${row.progress || 0}%`}
                    >
                      <div className="bg-gradient-to-r from-brand-blue-dark to-brand-blue h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, row.progress || 0))}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-10 text-right">{row.progress || 0}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                  {row.pretestScore !== null && row.pretestScore !== undefined
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-brand-blue-soft text-brand-blue-dark">{row.pretestScore}</span>
                    : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                  {row.posttestScore !== null && row.posttestScore !== undefined
                    ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-brand-green-soft text-brand-green-dark">
                        {row.posttestScore}
                        {row.pretestScore !== null && row.posttestScore > row.pretestScore && (
                          <span className="text-brand-green">↑</span>
                        )}
                      </span>
                    )
                    : <span className="text-slate-300 text-xs">—</span>}
                </td>
                <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                  {row.score !== null && row.score !== undefined ? `${row.score} / 100` : "-"}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleExportStudentPdf(row)}
                    disabled={!!downloadingPdfId}
                    title={`Unduh PDF Laporan ${row.name}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-blue-soft hover:bg-brand-blue text-brand-blue hover:text-white border border-brand-blue/30 hover:border-brand-blue transition disabled:opacity-40"
                  >
                    {downloadingPdfId === row.userId
                      ? <Loader2 size={14} className="animate-spin" />
                      : <FileText size={14} />}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 bg-slate-50/30">
                  <p className="font-medium text-slate-500">Tidak ada data peserta yang sesuai filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter program di atas.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 50 && (
        <p className="text-center text-slate-400 mt-4 text-xs">
          Menampilkan 50 dari <span className="font-semibold text-slate-600">{filtered.length}</span> baris. Klik tombol Ekspor Excel di atas untuk mengunduh seluruh data.
        </p>
      )}
    </div>
  );
}
