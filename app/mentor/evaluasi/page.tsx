import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/ui/DashboardChrome";
import { FileCheck2, Search, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { initials } from "@/utils";
import type { Prisma } from "@prisma/client";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" }).format(date);
}

type EvaluationFilter = "all" | "pending" | "passed" | "failed";

function normalizeStatus(value?: string): EvaluationFilter {
  return value === "pending" || value === "passed" || value === "failed" ? value : "all";
}

export default async function MentorEvaluasiPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; userId?: string }>
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const q = params.q?.trim().slice(0, 100) ?? "";
  const userId = params.userId?.trim() ?? "";
  const status = normalizeStatus(params.status);

  const filters: Prisma.AssessmentAttemptWhereInput[] = [
    { status: { not: "IN_PROGRESS" } },
    ...(user.role === "SUPER_ADMIN"
      ? []
      : [{ assessment: { course: { mentorId: user.id } } }]),
  ];

  if (userId) filters.push({ userId });
  if (q) {
    filters.push({
      OR: [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { email: { contains: q, mode: "insensitive" } } },
        { assessment: { title: { contains: q, mode: "insensitive" } } },
        { assessment: { course: { title: { contains: q, mode: "insensitive" } } } }
      ]
    });
  }
  if (status === "pending") filters.push({ status: "PENDING_GRADE" });
  if (status === "passed") filters.push({ status: "GRADED", passed: true });
  if (status === "failed") filters.push({ status: "GRADED", passed: false });

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { AND: filters },
    orderBy: { submittedAt: "desc" },
    take: 250,
    include: {
      user: { select: { name: true, email: true } },
      assessment: {
        select: {
          title: true,
          type: true,
          course: { select: { title: true } }
        }
      }
    }
  });

  return (
    <DashboardChrome user={user}>
      <div className="dash-title flex justify-between items-center flex-wrap gap-4 mb-6">
        <div>
          <p className="text-primary font-bold text-sm uppercase tracking-wider m-0">Evaluasi Peserta</p>
          <h1 className="text-3xl font-extrabold text-slate-900 m-0">Riwayat Evaluasi</h1>
          <small className="text-slate-500">Daftar seluruh kiriman evaluasi dan kuis dari peserta program Anda.</small>
        </div>
        <form method="get" className="flex items-center gap-2 flex-wrap">
          {userId && <input type="hidden" name="userId" value={userId} />}
          <div className="search-box">
            <Search size={16} />
            <label htmlFor="evaluation-search" className="sr-only">Cari evaluasi</label>
            <input
              id="evaluation-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari peserta atau evaluasi..."
              className="form-input text-sm w-[250px]"
            />
          </div>
          <label htmlFor="evaluation-status" className="sr-only">Filter status</label>
          <select id="evaluation-status" name="status" defaultValue={status} className="form-input text-sm">
            <option value="all">Semua status</option>
            <option value="pending">Perlu dinilai</option>
            <option value="passed">Lulus</option>
            <option value="failed">Belum lulus</option>
          </select>
          <button type="submit" className="btn btn-primary btn-small">Terapkan</button>
          {(q || status !== "all" || userId) && (
            <Link href="/mentor/evaluasi" className="btn btn-outline btn-small">Hapus filter</Link>
          )}
        </form>
      </div>

      <div className="data-card">
        {attempts.length ? (
          <div className="table-responsive">
            <table className="mentor-table">
              <thead>
                <tr>
                  <th>Peserta</th>
                  <th>Program</th>
                  <th>Evaluasi</th>
                  <th>Waktu</th>
                  <th>Skor / Status</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(attempt => (
                  <tr key={attempt.id} className="hover-lift">
                    <td>
                      <div className="flex gap-3 items-center">
                        <i className="w-8 h-8 rounded-full bg-brand-green-soft text-brand-green-dark flex items-center justify-center font-bold not-italic">
                          {initials(attempt.user.name)}
                        </i>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{attempt.user.name}</span>
                          <span className="text-xs text-slate-500">{attempt.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-800 font-medium">{attempt.assessment.course.title}</td>
                    <td>
                      <span className="text-slate-800 block font-medium">{attempt.assessment.title}</span>
                      <small className="block text-xs text-primary font-bold">{attempt.assessment.type}</small>
                    </td>
                    <td className="text-slate-500 text-sm">{formatDate(attempt.submittedAt)}</td>
                    <td>
                      {attempt.status === "PENDING_GRADE" ? (
                        <Link href={`/mentor/evaluasi/${attempt.id}`} className="btn btn-primary btn-small text-xs py-1 px-3">
                          Beri Nilai
                        </Link>
                      ) : attempt.status === "GRADED" ? (
                        <div className={`flex gap-2 items-center font-bold ${attempt.passed ? 'text-brand-green-dark' : 'text-brand-critical'}`}>
                          <span>{attempt.score}</span>
                          {attempt.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          <Link href={`/mentor/evaluasi/${attempt.id}`} className="text-slate-400 hover:text-slate-600 ml-2" title="Lihat Detail">
                            <FileCheck2 size={16} />
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="meta-badge">Belum siap dinilai</span>
                          <Link href={`/mentor/evaluasi/${attempt.id}`} className="text-slate-400 hover:text-slate-600" title="Lihat detail">
                            <FileCheck2 size={16} />
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted">
            <FileCheck2 size={48} className="mx-auto mb-4 opacity-50 text-slate-400" />
            <p className="m-0 font-medium">
              {q || status !== "all" || userId
                ? "Tidak ada evaluasi yang cocok dengan filter."
                : "Belum ada evaluasi yang dikirim peserta."}
            </p>
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}
