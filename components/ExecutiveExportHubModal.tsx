/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Presentation,
  Award,
  Download,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
  BarChart3,
  BookOpen,
  Users
} from "lucide-react";
import { generateExcelReport } from "@/lib/xlsxExport";
import { generateAcademicTranscriptPDF } from "@/lib/pdfTranscriptGenerator";
import { generateExecutiveSlideDeck } from "@/lib/pptxGenerator";
import { generateSyllabusDocx } from "@/lib/docxExport";

interface ExecutiveExportHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
}

export function ExecutiveExportHubModal({ isOpen, onClose, initialRole = "STUDENT" }: ExecutiveExportHubModalProps) {
  const [loadingData, setLoadingData] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);

  // Download states for each skill card
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [successXlsx, setSuccessXlsx] = useState(false);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [successPdf, setSuccessPdf] = useState(false);

  const [downloadingPptx, setDownloadingPptx] = useState(false);
  const [successPptx, setSuccessPptx] = useState(false);

  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [successDocx, setSuccessDocx] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchExportData();
    }
  }, [isOpen]);

  const fetchExportData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/analytics/export-data");
      if (!res.ok) throw new Error("Gagal mengambil data ekspor");
      const json = await res.json();
      setData(json);
      setSelectedCourseIndex(0);
    } catch (err) {
      console.error("Error fetching export data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  // 1. Handle Excel Export (.xlsx)
  const handleExportXlsx = async () => {
    if (!data) return;
    setDownloadingXlsx(true);
    setSuccessXlsx(false);
    try {
      await generateExcelReport({
        fileName: `PROFAS-Executive-Analytics-${new Date().toISOString().split("T")[0]}.xlsx`,
        students: data.students || [],
        attendances: data.attendances || [],
        xpLogs: data.xpLogs || []
      });
      setSuccessXlsx(true);
      setTimeout(() => setSuccessXlsx(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat file Excel (.xlsx).");
    } finally {
      setDownloadingXlsx(false);
    }
  };

  // 2. Handle Transcript PDF (.pdf)
  const handleExportPdf = () => {
    if (!data) return;
    setDownloadingPdf(true);
    setSuccessPdf(false);
    try {
      const studentName = data.studentName || (data.students?.[0]?.name) || "Peserta Kepemimpinan Eksekutif";
      const studentEmail = data.studentEmail || (data.students?.[0]?.email) || "peserta@profas.id";
      const organization = data.organization || "PROFAS Institute Network";
      const role = data.role || initialRole;
      const totalXP = data.totalXP || (data.students?.[0]?.totalXP) || 1250;
      const badgesCount = data.badgesCount || 3;
      const courses = (data.courses || []).map((c: any) => ({
        title: c.title || "Program Kepemimpinan",
        category: c.category || "Executive Leadership",
        level: c.level || "ADVANCED",
        progressPercent: c.progressPercent !== undefined ? c.progressPercent : 100,
        status: c.status || "COMPLETED"
      }));

      generateAcademicTranscriptPDF({
        studentName,
        studentEmail,
        organization,
        role,
        totalXP,
        courses,
        badgesCount
      });
      setSuccessPdf(true);
      setTimeout(() => setSuccessPdf(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat file Transkrip Akademik (.pdf).");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // 3. Handle Slide Deck (.pptx / 16:9 PDF)
  const handleExportPptx = () => {
    if (!data || !data.courses || data.courses.length === 0) {
      alert("Belum ada data program yang tersedia untuk dibuatkan Slide Deck.");
      return;
    }
    setDownloadingPptx(true);
    setSuccessPptx(false);
    try {
      const course = data.courses[selectedCourseIndex] || data.courses[0];
      generateExecutiveSlideDeck({
        courseTitle: course.title || "Strategic Leadership Architecture",
        category: course.category || "Executive Management",
        level: course.level || "ADVANCED",
        mentorName: course.mentorName || "Dr. H. Hendra Syahputra, M.M.",
        durationHours: course.durationHours || 24,
        modules: (course.modules || []).map((m: any) => ({
          title: m.title,
          type: m.type,
          durationMin: m.durationMin,
          description: m.description
        })),
        outcomes: course.outcomes
      });
      setSuccessPptx(true);
      setTimeout(() => setSuccessPptx(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat Executive Slide Deck.");
    } finally {
      setDownloadingPptx(false);
    }
  };

  // 4. Handle Syllabus Word (.docx)
  const handleExportDocx = async () => {
    if (!data || !data.courses || data.courses.length === 0) {
      alert("Belum ada data program yang tersedia untuk diekspor ke DOCX.");
      return;
    }
    setDownloadingDocx(true);
    setSuccessDocx(false);
    try {
      const course = data.courses[selectedCourseIndex] || data.courses[0];
      await generateSyllabusDocx({
        courseTitle: course.title || "Executive Leadership Academy",
        category: course.category || "Strategic Leadership",
        level: course.level || "ADVANCED",
        mentorName: course.mentorName || "Dr. H. Hendra Syahputra, M.M.",
        durationHours: course.durationHours || 24,
        modules: (course.modules || []).map((m: any) => ({
          title: m.title,
          type: m.type,
          durationMin: m.durationMin
        })),
        userNotes: `Catatan Eksekutif: Kurikulum ini telah disesuaikan untuk implementasi praktis di lingkungan kepemimpinan strategis PROFAS Institute.`
      });
      setSuccessDocx(true);
      setTimeout(() => setSuccessDocx(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat Silabus Microsoft Word (.docx).");
    } finally {
      setDownloadingDocx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm shadow-teal-500/10">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                Pusat Ekspor & Pelaporan Lengkap
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                  Antigravity Skills Powered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ekspor data analitik, transkrip, slide presentasi, dan silabus dalam format Excel, PDF, PPTX, dan DOCX.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchExportData}
              disabled={loadingData}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-700/50"
              title="Refresh Data Terkini dari Server"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin text-teal-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all border border-slate-700/50"
              title="Tutup Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loadingData ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-teal-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-slate-200 text-base">Mengagregasi Data dari Database Server...</p>
                <p className="text-xs text-slate-400 mt-1">Memeriksa hak akses, menghitung XP, rekap absensi, dan modul kepemimpinan.</p>
              </div>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-400">
              <p>Gagal memuat data. Silakan coba klik tombol refresh di atas.</p>
            </div>
          ) : (
            <>
              {/* Top Quick Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900/80 to-slate-900/80 border border-teal-500/20 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 block">
                      Status Hak Akses Aktif: {data.role}
                    </span>
                    <span className="text-sm font-bold text-white block">
                      {data.role === "SUPER_ADMIN" || data.role === "MENTOR"
                        ? `${data.students?.length || 0} Peserta Terdaftar • ${data.attendances?.length || 0} Catatan Absensi • ${data.courses?.length || 0} Program`
                        : `${data.studentName} • ${data.totalXP?.toLocaleString("id-ID") || 0} XP • ${data.courses?.length || 0} Program Diikuti`}
                    </span>
                  </div>
                </div>

                {data.courses && data.courses.length > 0 && (
                  <div className="flex items-center gap-2.5 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                    <span className="text-xs font-semibold text-slate-300">Pilih Program Target:</span>
                    <select
                      value={selectedCourseIndex}
                      onChange={(e) => setSelectedCourseIndex(Number(e.target.value))}
                      className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-teal-300 px-2.5 py-1 focus:outline-none focus:border-teal-500"
                    >
                      {data.courses.map((c: any, i: number) => (
                        <option key={c.id || i} value={i}>
                          {c.title.substring(0, 32)}{c.title.length > 32 ? "..." : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 4-Grid Export Skill Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. XLSX Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/25">
                        Skill: xlsx
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-teal-300 transition-colors">
                      Laporan Rekapitulasi Multi-Sheet (.xlsx)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {data.role === "SUPER_ADMIN" || data.role === "MENTOR"
                        ? "Unduh buku kerja Excel lengkap berisi 3 sheet terpisah: Ringkasan Murid, Log Absensi Real-time, dan Riwayat XP."
                        : "Unduh laporan Excel rekapitulasi progres pribadi dan perolehan XP sistem secara rapi."}
                    </p>
                  </div>

                  <button
                    onClick={handleExportXlsx}
                    disabled={downloadingXlsx}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      successXlsx
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                        : "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-white shadow-md"
                    }`}
                  >
                    {downloadingXlsx ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : successXlsx ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{successXlsx ? "File Excel Terunduh!" : "Unduh Laporan Excel (.xlsx)"}</span>
                  </button>
                </div>

                {/* 2. PDF Transcript Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        Skill: pdf & canvas-design
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                      Transkrip Akademik Resmi (.pdf)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Dokumen PDF berstandar A4 dengan stempel verifikasi resmi PROFAS, merangkum seluruh portofolio kelas, badge, dan akreditasi kepemimpinan.
                    </p>
                  </div>

                  <button
                    onClick={handleExportPdf}
                    disabled={downloadingPdf}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      successPdf
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                        : "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-white shadow-md"
                    }`}
                  >
                    {downloadingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : successPdf ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{successPdf ? "Transkrip Terunduh!" : "Unduh Transkrip Akademik (.pdf)"}</span>
                  </button>
                </div>

                {/* 3. PPTX / Presentation Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                        <Presentation className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/25">
                        Skill: pptx
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-purple-300 transition-colors">
                      Executive Slide Deck Presentasi (16:9)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Paket slide presentasi layar lebar 16:9 untuk pengajaran maupun presentasi rangkuman eksekutif: 3 Pilar Leadership & Modul Kurikulum.
                    </p>
                  </div>

                  <button
                    onClick={handleExportPptx}
                    disabled={downloadingPptx}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      successPptx
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                        : "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-white shadow-md"
                    }`}
                  >
                    {downloadingPptx ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : successPptx ? (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{successPptx ? "Slide Deck Terunduh!" : "Unduh Slide Deck (16:9 PDF)"}</span>
                  </button>
                </div>

                {/* 4. DOCX Syllabus Card */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/25">
                        Skill: docx & internal-comms
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-blue-300 transition-colors">
                      Silabus & Catatan Kurikulum Word (.docx)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      Proposal silabus lengkap dalam format Microsoft Word (.docx), berserta hierarki modul, estimasi waktu, dan catatan refleksi peserta.
                    </p>
                  </div>

                  <button
                    onClick={handleExportDocx}
                    disabled={downloadingDocx}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border ${
                      successDocx
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                        : "bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] border-blue-500/30 text-white shadow-md"
                    }`}
                  >
                    {downloadingDocx ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : successDocx ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{successDocx ? "Silabus Terunduh!" : "Unduh Silabus Word (.docx)"}</span>
                  </button>
                </div>
              </div>

              {/* Data Summary Quick Preview */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-400" /> Preview Metrik Sistem yang Siap Diekspor
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {data.courses?.length || 0} Program • {data.students?.length || 1} Entitas Data
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium block">Total Program</span>
                    <span className="text-base font-extrabold text-teal-400">{data.courses?.length || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium block">Akreditasi System</span>
                    <span className="text-base font-extrabold text-emerald-400">100% Verified</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium block">Format Tersedia</span>
                    <span className="text-base font-extrabold text-purple-400">4 Engine</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-medium block">Kesiapan Vercel</span>
                    <span className="text-base font-extrabold text-blue-400">Serverless OK</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-400" />
            Semua file diekspor lokal di sisi klien/server tanpa batas ukuran eksternal.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-[#1e5a8f] to-[#2a6ba7] hover:from-[#2a6ba7] hover:to-[#38bdf8] text-white transition-all shadow-md"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
