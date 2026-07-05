import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import { Search, Trophy, Activity } from "lucide-react";
import Link from "next/link";

export default async function MentorPesertaPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  // Fetch courses with enrollments and students' details
  const courses = await prisma.course.findMany({
    where: { mentorId: user.id },
    include: {
      enrollments: {
        where: { user: { role: "STUDENT" } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              persona: true,
              xpLogs: { select: { points: true } }
            }
          }
        }
      }
    }
  });

  // Flatten and aggregate student data
  type StudentRow = { id: string; name: string; email: string; persona: string | null; programs: string[]; avgProgress: number; totalXp: number; lastActive: string };
  const studentMap = new Map<string, StudentRow>();

  courses.forEach(c => {
    c.enrollments.forEach(e => {
      if (!studentMap.has(e.user.id)) {
        const totalXp = e.user.xpLogs.reduce((acc, log) => acc + log.points, 0);
        studentMap.set(e.user.id, {
          id: e.user.id,
          name: e.user.name,
          email: e.user.email,
          persona: e.user.persona,
          programs: [c.title],
          avgProgress: e.progressPercent,
          totalXp,
          lastActive: "Aktif"
        });
      } else {
        const s = studentMap.get(e.user.id)!;
        s.programs.push(c.title);
        s.avgProgress = Math.round((s.avgProgress + e.progressPercent) / s.programs.length);
      }
    });
  });

  const students = Array.from(studentMap.values()).sort((a, b) => b.totalXp - a.totalXp);

  return (
    <DashboardChrome user={user}>
      <div className="dash-title">
        <div>
          <h1>Manajemen Peserta</h1>
          <p>Pantau progres, nilai, dan tingkat keaktifan siswa yang terdaftar di kelas Anda.</p>
        </div>
      </div>

      <div className="data-card" style={{ marginTop: "2rem" }}>
        <div className="data-title" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem" }}>
          <div>
            <h2>Daftar Peserta Kelas ({students.length})</h2>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div className="search-box">
              <Search size={16} />
              <input type="text" placeholder="Cari nama atau email..." />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="mentor-table">
            <thead>
              <tr>
                <th>Nama Peserta</th>
                <th>Program yang Diikuti</th>
                <th>Rata-rata Progres</th>
                <th>Total XP</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>Belum ada peserta yang mendaftar.</td>
                </tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong>{s.name}</strong>
                      <small style={{ color: "#64748b" }}>{s.email}</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {s.programs.map((p, i) => (
                        <span key={i} className="meta-badge type-lesson">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="progress-line" style={{ margin: 0, width: "120px" }}>
                      <i><em style={{ width: `${s.avgProgress}%`, background: s.avgProgress === 100 ? "var(--color-success)" : "" }} /></i>
                      <b style={{ color: s.avgProgress === 100 ? "var(--color-success)" : "" }}>{s.avgProgress}%</b>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-warning)", fontWeight: "bold" }}>
                      <Trophy size={14} /> {s.totalXp}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-success)", fontSize: "0.875rem" }}>
                      <Activity size={14} /> {s.lastActive}
                    </span>
                  </td>
                  <td>
                    <Link href={`/dashboard/evaluasi?userId=${s.id}`} className="btn btn-outline btn-small">
                      Lihat Evaluasi
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
