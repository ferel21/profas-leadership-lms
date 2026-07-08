import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import { Filter, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function MentorEvaluasiPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const { userId } = await searchParams;

  const whereClause: Record<string, unknown> = {
    assessment: { course: { mentorId: user.id } }
  };
  if (userId) {
    whereClause.userId = userId;
  }

  const attempts = await prisma.assessmentAttempt.findMany({
    where: whereClause,
    orderBy: { submittedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assessment: { select: { id: true, title: true, type: true, course: { select: { title: true } } } }
    }
  });

  return (
    <DashboardChrome user={user}>
      <div className="dash-title">
        <div>
          <h1>Pemantauan Riwayat Kuis / Tugas</h1>
          <p>Lihat hasil evaluasi peserta Anda untuk memberikan pendampingan yang tepat sasaran.</p>
        </div>
      </div>

      <div className="data-card mt-8">
        <div className="data-title border-b border-slate-200 pb-4 mb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2>Riwayat Kiriman Evaluasi ({attempts.length})</h2>
          </div>
          <div className="flex gap-2">
            {userId && <Link href="/dashboard/evaluasi" className="btn btn-outline btn-small">Hapus Filter</Link>}
            <button className="btn btn-outline btn-small flex items-center gap-1"><Filter size={14} /> Filter</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Peserta</th>
                <th>Evaluasi & Program</th>
                <th>Tipe</th>
                <th>Skor</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted">Belum ada evaluasi yang dikirim.</td>
                </tr>
              ) : attempts.map(a => (
                <tr key={a.id}>
                  <td><small className="text-slate-500">{formatDate(a.submittedAt)}</small></td>
                  <td>
                    <div className="flex flex-col">
                      <strong className="text-slate-800">{a.user.name}</strong>
                      <small className="text-slate-500">{a.user.email}</small>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col">
                      <strong className="text-slate-800">{a.assessment.title}</strong>
                      <small className="text-slate-500">{a.assessment.course.title}</small>
                    </div>
                  </td>
                  <td><span className="meta-badge">{a.assessment.type}</span></td>
                  <td><strong className="text-slate-900">{a.score}</strong></td>
                  <td>
                    {a.passed ? 
                      <span className="flex items-center gap-1 text-emerald-500 text-sm font-semibold"><CheckCircle2 size={14}/> Lulus</span> : 
                      <span className="flex items-center gap-1 text-red-500 text-sm font-semibold"><XCircle size={14}/> Gagal</span>
                    }
                  </td>
                  <td>
                    <Link href={`/dashboard/evaluasi/${a.id}`} className="btn btn-outline btn-small">
                      Cek Jawaban
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardChrome>
  );
}
