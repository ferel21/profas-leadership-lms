"use client";

import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

export type RoleCountItem = {
  role: string;
  total: number;
};

type CertificateVerificationResult = {
  valid: boolean;
  message?: string;
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

type PanelTab = "summary" | "verification" | "export";

const roleMeta: Record<string, { label: string; color: string }> = {
  STUDENT: { label: "Peserta", color: "#2a6ba7" },
  MENTOR: { label: "Mentor", color: "#f3b444" },
  SUPER_ADMIN: { label: "Super Admin", color: "#003466" },
};

export function SuperAdminAnalyticsPanel({
  roleCounts,
  userCount,
  courseCount,
  certificateCount,
  activeStudentsCount,
  avgProgress,
  graduationRate,
  enrollmentCount,
}: SuperAdminAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("summary");
  const [certInput, setCertInput] = useState("");
  const [certLoading, setCertLoading] = useState(false);
  const [certResult, setCertResult] = useState<CertificateVerificationResult | null>(null);

  const normalizedRoleCounts = Object.keys(roleMeta).map(role => {
    const total = roleCounts.find(item => item.role === role)?.total ?? 0;
    return {
      role,
      total,
      label: roleMeta[role].label,
      color: roleMeta[role].color,
      percentage: userCount > 0 ? Math.round((total / userCount) * 100) : 0,
    };
  });

  const handleVerifyCertificate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const number = certInput.trim();
    if (!number) return;

    setCertLoading(true);
    setCertResult(null);
    try {
      const response = await fetch(`/api/certificates/verify?number=${encodeURIComponent(number)}`);
      const data = await response.json() as CertificateVerificationResult;
      if (!response.ok) {
        setCertResult({
          valid: false,
          message: data.message || "Nomor sertifikat belum dapat diperiksa.",
        });
      } else if (data.valid && data.certificate) {
        const issuedAt = new Intl.DateTimeFormat("id-ID", { dateStyle: "long" })
          .format(new Date(data.certificate.issuedAt));
        setCertResult({
          valid: true,
          message: `${data.certificate.user.name} menyelesaikan ${data.certificate.course.title} pada ${issuedAt}.`,
          certificate: data.certificate,
        });
      } else {
        setCertResult({
          valid: false,
          message: "Sertifikat tidak ditemukan dalam basis data PROFAS.",
        });
      }
    } catch {
      setCertResult({
        valid: false,
        message: "Pemeriksaan gagal terhubung. Coba lagi sebentar lagi.",
      });
    } finally {
      setCertLoading(false);
    }
  };

  const exportRoleDistribution = () => {
    downloadCsv(
      `profas_distribusi_role_${dateStamp()}.csv`,
      [
        ["Peran", "Jumlah Akun", "Persentase dari Total Akun"],
        ...normalizedRoleCounts.map(item => [item.label, item.total, `${item.percentage}%`]),
      ],
    );
  };

  const exportPlatformSummary = () => {
    downloadCsv(
      `profas_ringkasan_platform_${dateStamp()}.csv`,
      [
        ["Indikator", "Nilai"],
        ["Total akun", userCount],
        ["Program terbit", courseCount],
        ["Total pendaftaran", enrollmentCount],
        ["Peserta aktif belajar", activeStudentsCount],
        ["Sertifikat diterbitkan", certificateCount],
        ["Rata-rata progres", `${avgProgress}%`],
        ["Rasio sertifikasi terhadap pendaftaran", `${graduationRate}%`],
      ],
    );
  };

  return (
    <section className="dash-chart-card mb-6 overflow-hidden" aria-labelledby="admin-data-panel-title">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1e5a8f]">
              <BarChart3 size={18} aria-hidden="true" />
            </span>
            <h2 id="admin-data-panel-title" className="m-0 text-lg font-bold text-slate-900">
              Data platform
            </h2>
          </div>
          <p className="m-0 mt-1 text-xs text-slate-500">
            Seluruh angka di panel ini berasal dari data platform yang diteruskan oleh dashboard.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Data platform">
          <TabButton
            active={activeTab === "summary"}
            controls="admin-data-summary"
            onClick={() => setActiveTab("summary")}
          >
            Ringkasan
          </TabButton>
          <TabButton
            active={activeTab === "verification"}
            controls="admin-data-verification"
            onClick={() => setActiveTab("verification")}
          >
            Verifikasi sertifikat
          </TabButton>
          <TabButton
            active={activeTab === "export"}
            controls="admin-data-export"
            onClick={() => setActiveTab("export")}
          >
            Ekspor
          </TabButton>
        </div>
      </header>

      {activeTab === "summary" && (
        <div id="admin-data-summary" role="tabpanel" className="space-y-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Total akun" value={userCount} />
            <Metric label="Program terbit" value={courseCount} />
            <Metric label="Total pendaftaran" value={enrollmentCount} />
            <Metric label="Sertifikat diterbitkan" value={certificateCount} />
            <Metric label="Peserta aktif belajar" value={activeStudentsCount} />
            <Metric label="Rata-rata progres" value={`${avgProgress}%`} />
            <Metric label="Rasio sertifikasi" value={`${graduationRate}%`} />
          </dl>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="m-0 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Users size={17} className="text-[#2a6ba7]" aria-hidden="true" />
                  Distribusi role
                </h3>
                <p className="m-0 mt-1 text-xs text-slate-500">
                  Persentase dihitung terhadap {userCount} akun terdaftar.
                </p>
              </div>
            </div>

            {userCount === 0 ? (
              <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Belum ada akun untuk ditampilkan.
              </div>
            ) : (
              <div className="space-y-4">
                {normalizedRoleCounts.map(item => (
                  <div key={item.role}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-700">{item.label}</span>
                      <span className="font-bold text-slate-900">
                        {item.total} akun · {item.percentage}%
                      </span>
                    </div>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`${item.label}: ${item.total} akun`}
                      aria-valuemin={0}
                      aria-valuemax={userCount}
                      aria-valuenow={item.total}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(100, item.percentage)}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "verification" && (
        <div id="admin-data-verification" role="tabpanel" className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="m-0 flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck size={18} className="text-[#2a6ba7]" aria-hidden="true" />
              Periksa nomor sertifikat
            </h3>
            <p className="m-0 mt-1 text-xs text-slate-500">
              Hasil valid hanya diberikan bila nomor ditemukan pada basis data sertifikat.
            </p>

            <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleVerifyCertificate}>
              <label className="relative flex-1">
                <span className="sr-only">Nomor sertifikat</span>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  value={certInput}
                  onChange={event => {
                    setCertInput(event.target.value);
                    setCertResult(null);
                  }}
                  maxLength={80}
                  placeholder="Contoh: PROFAS-2026-XXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#2a6ba7] focus:bg-white"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={certLoading || !certInput.trim()}
                className="btn btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50"
              >
                {certLoading ? "Memeriksa..." : "Verifikasi"}
              </button>
            </form>

            {certResult && (
              <div
                className={`mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  certResult.valid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
                role="status"
              >
                {certResult.valid
                  ? <CheckCircle2 className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
                  : <XCircle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />}
                <div>
                  <strong>{certResult.valid ? "Sertifikat valid" : "Sertifikat tidak valid"}</strong>
                  <p className="m-0 mt-1">{certResult.message}</p>
                  {certResult.certificate && (
                    <small className="mt-1 block">Nomor: {certResult.certificate.uniqueNumber}</small>
                  )}
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rekaman diterbitkan</span>
            <strong className="mt-2 block text-3xl text-slate-900">{certificateCount}</strong>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Jumlah sertifikat yang saat ini tersimpan pada platform.
            </p>
            <a href="/verifikasi" target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-bold text-[#1e5a8f] hover:underline">
              Buka portal verifikasi publik
            </a>
          </aside>
        </div>
      )}

      {activeTab === "export" && (
        <div id="admin-data-export" role="tabpanel" className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ExportCard
            title="Distribusi role"
            description="Jumlah dan persentase akun untuk setiap role yang tampil pada panel ini."
            buttonLabel="Unduh CSV distribusi"
            onClick={exportRoleDistribution}
          />
          <ExportCard
            title="Ringkasan platform"
            description="Akun, program, pendaftaran, aktivitas, progres, dan sertifikat dari data dashboard."
            buttonLabel="Unduh CSV ringkasan"
            onClick={exportPlatformSummary}
          />
        </div>
      )}
    </section>
  );
}

function TabButton({
  active,
  controls,
  onClick,
  children,
}: {
  active: boolean;
  controls: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active ? "bg-[#2a6ba7] text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="m-0 mt-1 text-2xl font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function ExportCard({
  title,
  description,
  buttonLabel,
  onClick,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <FileSpreadsheet size={20} className="text-[#2a6ba7]" aria-hidden="true" />
        <h3 className="m-0 mt-3 text-sm font-bold text-slate-900">{title}</h3>
        <p className="m-0 mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <button type="button" onClick={onClick} className="btn btn-primary mt-5 justify-center">
        <Download size={15} aria-hidden="true" /> {buttonLabel}
      </button>
    </article>
  );
}

function downloadCsv(fileName: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map(row => row.map(value => csvCell(value)).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number) {
  const text = String(value);
  const spreadsheetSafe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${spreadsheetSafe.replace(/"/g, "\"\"")}"`;
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}
