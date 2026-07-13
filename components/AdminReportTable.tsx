"use client";

import { useState } from "react";
import { Search, Filter, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { formatDate } from "@/lib/utils";
import { downloadExcelWorkbook } from "@/lib/xlsxExport";
import { ExportReportsButton } from "@/components/ExportReportsButton";

export type ReportRow = {
  id: string;
  name: string;
  email: string;
  course: string;
  progress: number;
  score: number | null;
  status: string;
  enrolledAt: string;
};

export function AdminReportTable({ data }: { data: ReportRow[] }) {
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [exporting, setExporting] = useState(false);

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
      const totalLulus = filtered.filter(r => r.status === "LULUS").length;
      const rasioLulus = totalPeserta > 0 ? ((totalLulus / totalPeserta) * 100).toFixed(1) + "%" : "0%";
      const rataProgres = totalPeserta > 0 ? (filtered.reduce((a, b) => a + (b.progress || 0), 0) / totalPeserta).toFixed(1) + "%" : "0%";
      
      const kpiData = [
        { "Indikator Kinerja Utama (KPI)": "Total Peserta Terdaftar", "Nilai": totalPeserta },
        { "Indikator Kinerja Utama (KPI)": "Peserta Lulus / Bersertifikat", "Nilai": totalLulus },
        { "Indikator Kinerja Utama (KPI)": "Rasio Kelulusan (%)", "Nilai": rasioLulus },
        { "Indikator Kinerja Utama (KPI)": "Rata-rata Progres Belajar (%)", "Nilai": rataProgres },
        { "Indikator Kinerja Utama (KPI)": "Tanggal Ekspor Laporan", "Nilai": new Date().toLocaleDateString("id-ID") }
      ];

      const workbook = new ExcelJS.Workbook();
      const detailSheet = workbook.addWorksheet("Data Detail Peserta");
      detailSheet.columns = Object.keys(detailData[0] ?? {
        "No": 0, "Nama Lengkap": "", "Email": "", "Program Kepemimpinan": "",
        "Progres (%)": 0, "Nilai Rata-rata": "", "Status Kelulusan": "", "Tanggal Daftar": "",
      }).map((header, index) => ({ header, key: header, width: [6, 28, 28, 32, 14, 16, 18, 20][index] ?? 18 }));
      detailSheet.addRows(detailData);
      const kpiSheet = workbook.addWorksheet("Ringkasan KPI");
      kpiSheet.columns = [{ header: "Indikator Kinerja Utama (KPI)", key: "indicator", width: 35 }, { header: "Nilai", key: "value", width: 25 }];
      kpiSheet.addRows(kpiData.map(row => ({ indicator: row["Indikator Kinerja Utama (KPI)"], value: row.Nilai })));
      for (const sheet of [detailSheet, kpiSheet]) {
        sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E5A8F" } };
        sheet.views = [{ state: "frozen", ySplit: 1 }];
      }
      await downloadExcelWorkbook(workbook, `Laporan_LMS_PROFAS_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) {
      console.error("Gagal mengekspor file:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="data-card mt-8 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-[0_10px_30px_-10px_rgba(13,148,136,0.08)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Laporan Detail Peserta</h2>
          <p className="text-sm text-slate-500 mt-1">Filter, urutkan, dan ekspor data analitik peserta ke format spreadsheet Excel profesional.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            disabled={exporting || filtered.length === 0}
            className="btn btn-outline hover-lift flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#2a6ba7]/30 hover:border-[#2a6ba7] bg-[#eff6ff] hover:bg-[#2a6ba7] text-[#1e5a8f] hover:text-white font-semibold text-sm transition disabled:opacity-50"
          >
            <FileSpreadsheet size={18} className="shrink-0" />
            <span>{exporting ? "Mengekspor..." : "Ekspor Excel (.xlsx)"}</span>
          </button>
          <ExportReportsButton label="Ekspor Multi-Sheet Executive (.xlsx)" className="font-semibold text-sm" />
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition" 
          />
        </div>
        <div className="relative md:w-64">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select 
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            aria-label="Filter berdasarkan program kepemimpinan"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-teal-600 focus:bg-white transition appearance-none cursor-pointer"
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
              <th className="py-3.5 px-4 w-48">Progres</th>
              <th className="py-3.5 px-4 text-center">Skor Akhir</th>
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
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                      : row.status === "IN_PROGRESS"
                      ? "bg-sky-100 text-sky-800 border border-sky-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
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
                      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, row.progress || 0))}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-10 text-right">{row.progress || 0}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                  {row.score !== null && row.score !== undefined ? `${row.score} / 100` : "-"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 bg-slate-50/30">
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
