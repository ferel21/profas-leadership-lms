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

      <div className="data-card" style={{ marginTop: "2rem" }}>
        <div className="data-title" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem" }}>
          <div>
            <h2>Riwayat Kiriman Evaluasi ({attempts.length})</h2>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {userId && <Link href="/dashboard/evaluasi" className="btn btn-outline btn-small">Hapus Filter</Link>}
            <button className="btn btn-outline btn-small"><Filter size={14} /> Filter</button>
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
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Belum ada evaluasi yang dikirim.</td>
                </tr>
              ) : attempts.map(a => (
                <tr key={a.id}>
                  <td><small>{formatDate(a.submittedAt)}</small></td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{a.user.name}</strong>
                      <small style={{ color: "#64748b" }}>{a.user.email}</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{a.assessment.title}</strong>
                      <small style={{ color: "#64748b" }}>{a.assessment.course.title}</small>
                    </div>
                  </td>
                  <td><span className="meta-badge">{a.assessment.type}</span></td>
                  <td><strong>{a.score}</strong></td>
                  <td>
                    {a.passed ? 
                      <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.875rem" }}><CheckCircle2 size={14}/> Lulus</span> : 
                      <span style={{ color: "var(--color-error)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.875rem" }}><XCircle size={14}/> Gagal</span>
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
