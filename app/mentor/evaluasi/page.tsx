import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/DashboardChrome";
import { FileCheck2, Search, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { initials } from "@/lib/utils";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Makassar" }).format(date);
}

export default async function MentorEvaluasiPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const attempts = await prisma.assessmentAttempt.findMany({
    where: { assessment: { course: { mentorId: user.id } } },
    orderBy: { submittedAt: "desc" },
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
        <div className="flex items-center gap-4">
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Cari nama atau email..." className="form-input text-sm w-[250px]" />
          </div>
        </div>
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
                        <i className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold not-italic">
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
                      {attempt.status === 'PENDING_GRADE' ? (
                        <Link href={`/mentor/evaluasi/${attempt.id}`} className="btn btn-primary btn-small text-xs py-1 px-3">
                          Beri Nilai
                        </Link>
                      ) : (
                        <div className={`flex gap-2 items-center font-bold ${attempt.passed ? 'text-emerald-600' : 'text-red-600'}`}>
                          <span>{attempt.score}</span>
                          {attempt.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                          <Link href={`/mentor/evaluasi/${attempt.id}`} className="text-slate-400 hover:text-slate-600 ml-2" title="Lihat Detail">
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
            <p className="m-0 font-medium">Belum ada evaluasi yang dikirim peserta.</p>
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}
