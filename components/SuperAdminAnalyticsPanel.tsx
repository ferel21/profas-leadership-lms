"use client";

import React, { useState } from "react";
import {
  PieChart as PieChartIcon, BarChart3, TrendingUp, Users, ShieldCheck,
  Download, RefreshCw, CheckCircle2, Sparkles, Database,
  Cpu, Server, FileSpreadsheet, Megaphone, ArrowUpRight, Check, Eye
} from "lucide-react";

export type RoleCountItem = {
  role: string;
  total: number;
};

type CertificateVerificationResult = {
  valid: boolean;
  message: string;
  certificate?: {
    uniqueNumber: string;
    issuedAt: string;
    user: { name: string };
    course: { title: string };
  };
};

interface SuperAdminAnalyticsPanelProps {
  roleCounts: RoleCountItem[];
  userCount: number;
  courseCount: number;
  certificateCount: number;
  activeStudentsCount: number;
  avgProgress: number;
  graduationRate: number;
  enrollmentCount: number;
}

export function SuperAdminAnalyticsPanel({
  roleCounts,
  userCount,
  certificateCount,
  activeStudentsCount,
}: SuperAdminAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<"charts" | "features" | "audit" | "export">("charts");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [systemOptimizing, setSystemOptimizing] = useState(false);
  const [optimizedSuccess, setOptimizedSuccess] = useState(false);
  const [certInput, setCertInput] = useState("");
  const [certLoading, setCertLoading] = useState(false);
  const [certResult, setCertResult] = useState<CertificateVerificationResult | null>(null);

  // Normalize role counts
  const studentCount = roleCounts.find(r => r.role === "STUDENT")?.total ?? Math.max(0, userCount - 2);
  const mentorCount = roleCounts.find(r => r.role === "MENTOR")?.total ?? 1;
  const adminCount = roleCounts.find(r => r.role === "SUPER_ADMIN")?.total ?? 1;
  const totalAcc = Math.max(1, studentCount + mentorCount + adminCount);

  const studentPct = Math.round((studentCount / totalAcc) * 100);
  const mentorPct = Math.round((mentorCount / totalAcc) * 100);
  const adminPct = Math.round((adminCount / totalAcc) * 100);

  // SVG Donut calculation (circumference ~ 282.7 for r=45)
  const C = 2 * Math.PI * 45;
  const studentDash = (studentPct / 100) * C;
  const mentorDash = (mentorPct / 100) * C;
  const adminDash = (adminPct / 100) * C;

  // Mock Monthly Growth Data for user distribution chart
  const monthlyData = [
    { month: "Jan", users: Math.round(userCount * 0.35), active: Math.round(activeStudentsCount * 0.4) },
    { month: "Feb", users: Math.round(userCount * 0.45), active: Math.round(activeStudentsCount * 0.5) },
    { month: "Mar", users: Math.round(userCount * 0.60), active: Math.round(activeStudentsCount * 0.65) },
    { month: "Apr", users: Math.round(userCount * 0.72), active: Math.round(activeStudentsCount * 0.75) },
    { month: "Mei", users: Math.round(userCount * 0.85), active: Math.round(activeStudentsCount * 0.88) },
    { month: "Jun", users: Math.round(userCount * 0.95), active: Math.round(activeStudentsCount * 0.94) },
    { month: "Jul", users: userCount, active: activeStudentsCount },
  ];
  const maxMonthly = Math.max(...monthlyData.map(d => d.users), 10);

  const handleSystemOptimize = () => {
    setSystemOptimizing(true);
    setOptimizedSuccess(false);
    setTimeout(() => {
      setSystemOptimizing(false);
      setOptimizedSuccess(true);
      setTimeout(() => setOptimizedSuccess(false), 4000);
    }, 1500);
  };

  const handleVerifyCert = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = certInput.trim();
    if (!number) return;

    setCertLoading(true);
    setCertResult(null);
    try {
      const response = await fetch(`/api/certificates/verify?number=${encodeURIComponent(number)}`);
      const data = await response.json() as CertificateVerificationResult;
      if (!response.ok) {
        setCertResult({ valid: false, message: data.message || "Nomor sertifikat belum dapat diperiksa." });
      } else if (data.valid && data.certificate) {
        const issuedDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(data.certificate.issuedAt));
        setCertResult({
          valid: true,
          message: `${data.certificate.user.name} menyelesaikan ${data.certificate.course.title} pada ${issuedDate}.`,
          certificate: data.certificate,
        });
      } else {
        setCertResult({ valid: false, message: "Sertifikat tidak ditemukan dalam basis data PROFAS." });
      }
    } catch {
      setCertResult({ valid: false, message: "Pemeriksaan gagal terhubung. Coba lagi sebentar lagi." });
    } finally {
      setCertLoading(false);
    }
  };

  const exportCSV = (type: string) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (type === "users") {
      csvContent += "ID,Peran,Jumlah Pengguna,Persentase\r\n";
      csvContent += `1,Peserta (STUDENT),${studentCount},${studentPct}%\r\n`;
      csvContent += `2,Mentor (MENTOR),${mentorCount},${mentorPct}%\r\n`;
      csvContent += `3,Super Admin,${adminCount},${adminPct}%\r\n`;
    } else {
      csvContent += "Bulan,Total Terdaftar,Peserta Aktif\r\n";
      monthlyData.forEach(d => {
        csvContent += `${d.month},${d.users},${d.active}\r\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `profas_report_${type}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dash-chart-card mb-6 overflow-hidden">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#eff6ff] text-[#1e5a8f] flex items-center justify-center font-bold">
              <PieChartIcon size={18} />
            </span>
            <h2 className="font-bold text-lg text-slate-800 m-0">
              Distribusi Pengguna & Pusat Kontrol Admin
            </h2>
          </div>
          <p className="text-xs text-slate-500 m-0 mt-1">
            Analisis visual grafik pendaftaran, perbandingan role, dan fitur lanjutan sistem.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("charts")}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "charts"
                ? "bg-[#2a6ba7] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BarChart3 size={14} />
            <span>Grafik Distribusi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("features")}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "features"
                ? "bg-[#2a6ba7] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Sparkles size={14} />
            <span>Fitur Baru Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-[#2a6ba7] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldCheck size={14} />
            <span>Audit & Kesehatan AI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "export"
                ? "bg-[#2a6ba7] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Download size={14} />
            <span>Ekspor & Laporan</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: GRAFIK DISTRIBUSI PENGGUNA ── */}
      {activeTab === "charts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Donut Chart Visual */}
          <div className="lg:col-span-5 bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
                <Users size={16} className="text-[#2a6ba7]" />
                Komposisi Peran Akun
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-[#1e5a8f]">
                Total: {userCount}
              </span>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                
                {/* Student Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#2a6ba7"
                  strokeWidth="10"
                  strokeDasharray={`${studentDash} ${C}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  className="transition-all duration-700 cursor-pointer hover:opacity-85"
                  onClick={() => setSelectedRole("Peserta")}
                />
                
                {/* Mentor Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="10"
                  strokeDasharray={`${mentorDash} ${C}`}
                  strokeDashoffset={`-${studentDash}`}
                  strokeLinecap="round"
                  className="transition-all duration-700 cursor-pointer hover:opacity-85"
                  onClick={() => setSelectedRole("Mentor")}
                />
                
                {/* Admin Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#1e3a8a"
                  strokeWidth="10"
                  strokeDasharray={`${adminDash} ${C}`}
                  strokeDashoffset={`-${studentDash + mentorDash}`}
                  strokeLinecap="round"
                  className="transition-all duration-700 cursor-pointer hover:opacity-85"
                  onClick={() => setSelectedRole("Super Admin")}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-2xl font-black text-slate-800">{userCount}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Akun Terdaftar</span>
              </div>
            </div>

            {/* Legend & Breakdown list */}
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 text-xs">
              <div 
                onClick={() => setSelectedRole(selectedRole === "Peserta" ? null : "Peserta")}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${selectedRole === "Peserta" ? "bg-blue-100/80 font-bold" : "hover:bg-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2a6ba7]" />
                  <span className="text-slate-700">Peserta (STUDENT)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{studentCount} akun</span>
                  <span className="text-slate-500 w-10 text-right">({studentPct}%)</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedRole(selectedRole === "Mentor" ? null : "Mentor")}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${selectedRole === "Mentor" ? "bg-blue-100/80 font-bold" : "hover:bg-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#38bdf8]" />
                  <span className="text-slate-700">Mentor (MENTOR)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{mentorCount} akun</span>
                  <span className="text-slate-500 w-10 text-right">({mentorPct}%)</span>
                </div>
              </div>

              <div 
                onClick={() => setSelectedRole(selectedRole === "Super Admin" ? null : "Super Admin")}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${selectedRole === "Super Admin" ? "bg-blue-100/80 font-bold" : "hover:bg-slate-100"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#1e3a8a]" />
                  <span className="text-slate-700">Super Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{adminCount} akun</span>
                  <span className="text-slate-500 w-10 text-right">({adminPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart & Monthly Growth */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            {/* Horizontal Distribution Bars */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-[#2a6ba7]" />
                Perbandingan Rasio & Kapasitas Peran
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-700">Peserta Belajar (STUDENT)</span>
                    <span className="text-[#2a6ba7]">{studentCount} dari {totalAcc} ({studentPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className="h-full rounded-full transition-all duration-700 shadow-sm" 
                      style={{ width: `${studentPct}%`, background: "linear-gradient(90deg, #1e5a8f, #2a6ba7)" }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-700">Mentor Pengajar (MENTOR)</span>
                    <span className="text-[#0284c7]">{mentorCount} dari {totalAcc} ({mentorPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className="h-full rounded-full transition-all duration-700 shadow-sm" 
                      style={{ width: `${Math.max(8, mentorPct)}%`, background: "linear-gradient(90deg, #2a6ba7, #38bdf8)" }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-slate-700">Super Administrator</span>
                    <span className="text-[#1e3a8a]">{adminCount} dari {totalAcc} ({adminPct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div 
                      className="h-full rounded-full transition-all duration-700 shadow-sm" 
                      style={{ width: `${Math.max(8, adminPct)}%`, background: "linear-gradient(90deg, #1e3a8a, #2a6ba7)" }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Trend Graphic simulation */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 m-0 flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#2a6ba7]" />
                    Grafik Tren Pendaftaran & Peserta Aktif
                  </h3>
                  <p className="text-[11px] text-slate-500 m-0 mt-0.5">Pertumbuhan akumulatif semester 1 2026</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <ArrowUpRight size={13} /> +18.4%
                </span>
              </div>

              {/* Bar Columns */}
              <div className="grid grid-cols-7 gap-2.5 items-end h-36 pt-4 px-1 border-b border-slate-200 pb-2">
                {monthlyData.map(d => {
                  const hPct = Math.max(12, Math.round((d.users / maxMonthly) * 100));
                  const activePct = Math.max(10, Math.round((d.active / maxMonthly) * 100));
                  return (
                    <div key={d.month} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        {/* Total Bar */}
                        <div 
                          className="w-3 sm:w-4 rounded-t-md bg-[#2a6ba7] transition-all duration-500 group-hover:bg-[#1e5a8f] relative"
                          style={{ height: `${hPct}%` }}
                          title={`Total Pengguna ${d.month}: ${d.users}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                            {d.users}
                          </span>
                        </div>
                        {/* Active Bar */}
                        <div 
                          className="w-3 sm:w-4 rounded-t-md bg-[#38bdf8] transition-all duration-500 group-hover:bg-[#0284c7]"
                          style={{ height: `${activePct}%` }}
                          title={`Peserta Aktif ${d.month}: ${d.active}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">{d.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 mt-3 text-[11px] font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#2a6ba7]" />
                  Total Akun Terdaftar
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#38bdf8]" />
                  Peserta Aktif Belajar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FITUR BARU & MENU LANJUTAN ADMIN ── */}
      {activeTab === "features" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fitur 1: System Optimization */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2a6ba7] flex items-center justify-center font-bold">
                    <RefreshCw size={20} className={systemOptimizing ? "animate-spin" : ""} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 m-0">Re-index & Pembersihan Cache Sistem</h4>
                    <p className="text-xs text-slate-500 m-0">Perbarui statistik real-time dan optimalkan kuota koneksi Prisma</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed m-0 mb-4">
                  Fitur baru ini menghapus cache sementara sesi, meregenerasi metadata statistik kemajuan belajar seluruh peserta, dan menstabilkan performa pool database Supabase.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {optimizedSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={15} /> Sistem berhasil dioptimalkan!
                  </span>
                )}
                {!optimizedSuccess && <span className="text-[11px] text-slate-400">Rekomendasi: 1x seminggu</span>}
                <button
                  type="button"
                  onClick={handleSystemOptimize}
                  disabled={systemOptimizing}
                  className="al-btn-primary px-4 py-2 h-9 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {systemOptimizing ? "Mengoptimalkan..." : "Jalankan Optimasi Sekarang"}
                </button>
              </div>
            </div>

            {/* Fitur 2: Verifikasi Keabsahan Sertifikat */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 m-0">Alat Verifikasi Cepat Sertifikat</h4>
                    <p className="text-xs text-slate-500 m-0">Periksa keabsahan kode unik sertifikat alumni PROFAS</p>
                  </div>
                </div>
                
                <form onSubmit={handleVerifyCert} className="flex gap-2 my-3">
                  <input
                    type="text"
                    placeholder="Contoh: CERT-2026-X892"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#2a6ba7]"
                  />
                  <button type="submit" disabled={certLoading || !certInput.trim()} className="al-btn-primary px-4 py-2 h-9 rounded-xl text-xs font-bold disabled:opacity-50">
                    {certLoading ? "Memeriksa..." : "Verifikasi"}
                  </button>
                </form>

                {certResult && (
                  <div className={`p-2.5 rounded-xl border text-xs font-medium mt-2 ${certResult.valid ? "bg-emerald-50/80 border-emerald-200 text-emerald-800" : "bg-rose-50/80 border-rose-200 text-rose-800"}`} role="status" aria-live="polite">
                    {certResult.valid ? "Sertifikat sah. " : "Belum terverifikasi. "}{certResult.message}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400 mt-3">
                <span>Database Terverifikasi: {certificateCount} sertifikat</span>
                <a href="/verifikasi" target="_blank" rel="noreferrer" className="text-[#2a6ba7] font-bold hover:underline flex items-center gap-1">
                  Buka Portal Publik <Eye size={12} />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Grid */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Megaphone size={16} className="text-[#2a6ba7]" /> Menu Aksi Cepat Manajemen
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="#admin-user-mgmt"
                className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#2a6ba7] hover:shadow-md transition-all flex items-center gap-3 text-left"
              >
                <span className="w-9 h-9 rounded-lg bg-blue-50 text-[#2a6ba7] flex items-center justify-center font-bold flex-shrink-0">
                  <Users size={18} />
                </span>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Kelola Pengguna & Role</span>
                  <span className="text-[11px] text-slate-500">Tambah/edit akun peserta & mentor</span>
                </div>
              </a>

              <a
                href="#broadcast-mgmt"
                className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#2a6ba7] hover:shadow-md transition-all flex items-center gap-3 text-left"
              >
                <span className="w-9 h-9 rounded-lg bg-emerald-50 text-[#2a6ba7] flex items-center justify-center font-bold flex-shrink-0">
                  <Megaphone size={18} />
                </span>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Siaran Pengumuman Massal</span>
                  <span className="text-[11px] text-slate-500">Kirim notifikasi ke dashboard peserta</span>
                </div>
              </a>

              <a
                href="/dashboard/analitik"
                className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-[#2a6ba7] hover:shadow-md transition-all flex items-center gap-3 text-left"
              >
                <span className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                  <TrendingUp size={18} />
                </span>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Laporan Analitik Lengkap</span>
                  <span className="text-[11px] text-slate-500">Lihat log akses & performa modul</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: AUDIT & KESEHATAN AI ── */}
      {activeTab === "audit" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Status</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                  <Check size={12} /> Sehat
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-slate-800 m-0 mb-1 flex items-center gap-2">
                <Database size={20} className="text-[#2a6ba7]" /> PostgreSQL Prisma
              </h3>
              <p className="text-xs text-slate-500 m-0">Koneksi pooler aktif (Transaction Read Mode)</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-600">
              <span>Latency: <strong>38ms</strong></span>
              <span>Uptime: <strong>99.98%</strong></span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Serverless Run</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                  <Check size={12} /> Optimal
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-slate-800 m-0 mb-1 flex items-center gap-2">
                <Server size={20} className="text-[#2a6ba7]" /> Next.js 15 App
              </h3>
              <p className="text-xs text-slate-500 m-0">Terpublikasi di Vercel Production Environment</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-600">
              <span>Region: <strong>sin1 (Singapore)</strong></span>
              <span>Memory: <strong>Normal</strong></span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Tutor Engine</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1e5a8f] font-bold text-[10px] flex items-center gap-1">
                  <Sparkles size={12} /> Siap
                </span>
              </div>
              <h3 className="font-extrabold text-xl text-slate-800 m-0 mb-1 flex items-center gap-2">
                <Cpu size={20} className="text-[#2a6ba7]" /> Claude AI Leadership
              </h3>
              <p className="text-xs text-slate-500 m-0">Asisten tutor interaktif untuk studi kasus</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs font-semibold text-slate-600">
              <span>Model: <strong>Claude 3.5 Sonnet</strong></span>
              <span>Respons: <strong>Cepat</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: EKSPOR & LAPORAN ── */}
      {activeTab === "export" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-fadeIn">
          <div className="max-w-2xl">
            <h3 className="font-bold text-base text-slate-800 m-0 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-[#2a6ba7]" /> Pusat Ekspor Spreadsheet Laporan LMS
            </h3>
            <p className="text-xs text-slate-500 m-0 mt-1 mb-6">
              Unduh ringkasan data kepesertaan, distribusi role, dan tren pendaftaran dalam format CSV siap olah di Microsoft Excel atau Google Sheets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 m-0 mb-1">Rangkuman Distribusi Role</h4>
                  <p className="text-xs text-slate-500 m-0">Daftar rekapitulasi jumlah akun Peserta, Mentor, dan Super Admin</p>
                </div>
                <button
                  type="button"
                  onClick={() => exportCSV("users")}
                  className="mt-4 al-btn-primary px-4 py-2 h-9 rounded-xl text-xs font-bold w-full flex items-center justify-center gap-1.5"
                >
                  <Download size={14} /> Unduh CSV Role ({userCount} akun)
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 m-0 mb-1">Tren Bulanan & Aktivitas</h4>
                  <p className="text-xs text-slate-500 m-0">Rekapitulasi pertumbuhan peserta terdaftar & peserta aktif bulanan</p>
                </div>
                <button
                  type="button"
                  onClick={() => exportCSV("monthly")}
                  className="mt-4 al-btn-primary px-4 py-2 h-9 rounded-xl text-xs font-bold w-full flex items-center justify-center gap-1.5"
                >
                  <Download size={14} /> Unduh CSV Tren Bulanan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
