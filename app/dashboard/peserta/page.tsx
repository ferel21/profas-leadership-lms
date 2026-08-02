import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { DashboardChrome } from "@/components/ui/DashboardChrome";
import { Search, Trophy, Activity } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/utils";
import {
  activityMetadataBelongsToMentorScope,
  buildMentorActivityWhere,
  buildMentorAnalyticsScope,
  mentorXpSourceIds,
} from "@/services/mentor-analytics-scope";
import { activeEnrollmentWindowWhere } from "@/services/enrollment-access";

export default async function MentorPesertaPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";

  // Fetch only the mentor-owned course graph used to scope participant data.
  const courses = await prisma.course.findMany({
    where: { mentorId: user.id },
    select: {
      id: true,
      title: true,
      nodes: { select: { id: true } },
      assessments: { select: { id: true } },
      calendarEvents: { select: { id: true } },
      enrollments: {
        where: { ...activeEnrollmentWindowWhere(), user: { role: "STUDENT" } },
        select: {
          userId: true,
          progressPercent: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              persona: true,
            }
          },
        }
      },
    },
  });
  const mentorScope = buildMentorAnalyticsScope(courses);

  // Flatten and aggregate student data
  type StudentRow = {
    id: string;
    name: string;
    email: string;
    persona: string | null;
    programs: string[];
    progressTotal: number;
    programCount: number;
    avgProgress: number;
    totalXp: number;
    lastActiveAt: Date | null;
  };
  const studentMap = new Map<string, StudentRow>();

  courses.forEach(c => {
    c.enrollments.forEach(e => {
      if (!studentMap.has(e.user.id)) {
        studentMap.set(e.user.id, {
          id: e.user.id,
          name: e.user.name,
          email: e.user.email,
          persona: e.user.persona,
          programs: [c.title],
          progressTotal: e.progressPercent,
          programCount: 1,
          avgProgress: e.progressPercent,
          totalXp: 0,
          lastActiveAt: null
        });
      } else {
        const s = studentMap.get(e.user.id)!;
        s.programs.push(c.title);
        s.progressTotal += e.progressPercent;
        s.programCount += 1;
        s.avgProgress = Math.round(s.progressTotal / s.programCount);
      }
    });
  });

  const normalizedQuery = query.toLocaleLowerCase("id-ID");
  const visibleStudents = Array.from(studentMap.values()).filter(student => {
    if (!normalizedQuery) return true;
    return [
      student.name,
      student.email,
      ...student.programs
    ].some(value => value.toLocaleLowerCase("id-ID").includes(normalizedQuery));
  });

  const studentIds = visibleStudents.map(student => student.id);
  if (studentIds.length > 0) {
    const xpStats = await prisma.xPLog.groupBy({
      by: ["userId"],
      where: {
        userId: { in: studentIds },
        sourceId: { in: mentorXpSourceIds(mentorScope) },
      },
      _sum: { points: true },
      _max: { createdAt: true },
    });
    const candidateActivityLogs = await prisma.activityLog.findMany({
      where: buildMentorActivityWhere(mentorScope, studentIds),
      select: {
        userId: true,
        metadata: true,
        createdAt: true,
      },
    });

    const applyLastActivity = (studentId: string, candidate: Date | null) => {
      if (!candidate) return;
      const student = studentMap.get(studentId);
      if (student && (!student.lastActiveAt || candidate > student.lastActiveAt)) {
        student.lastActiveAt = candidate;
      }
    };

    xpStats.forEach(stat => {
      const student = studentMap.get(stat.userId);
      if (student) student.totalXp = stat._sum.points ?? 0;
      applyLastActivity(stat.userId, stat._max.createdAt);
    });
    candidateActivityLogs.forEach(log => {
      if (activityMetadataBelongsToMentorScope(log.metadata, mentorScope)) {
        applyLastActivity(log.userId, log.createdAt);
      }
    });
  }

  const students = visibleStudents.sort((a, b) => b.totalXp - a.totalXp);

  return (
    <DashboardChrome user={user}>
      <div className="dash-title">
        <div>
          <h1>Manajemen Peserta</h1>
          <p>Pantau progres, nilai, dan tingkat keaktifan siswa yang terdaftar di kelas Anda.</p>
        </div>
      </div>

      <div className="data-card mt-8">
        <div className="data-title border-b border-slate-200 pb-4 mb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2>
              Daftar Peserta Kelas ({students.length}
              {query ? ` dari ${studentMap.size}` : ""})
            </h2>
          </div>
          <form method="get" className="flex gap-2 items-center">
            <div className="search-box">
              <Search size={16} />
              <label htmlFor="participant-search" className="sr-only">Cari peserta</label>
              <input
                id="participant-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Cari nama atau email..."
              />
            </div>
            <button type="submit" className="btn btn-primary btn-small">Cari</button>
            {query && <Link href="/dashboard/peserta" className="btn btn-outline btn-small">Hapus</Link>}
          </form>
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
                  <td colSpan={6} className="text-center p-8 text-muted">
                    {query ? "Tidak ada peserta yang cocok dengan pencarian." : "Belum ada peserta yang mendaftar."}
                  </td>
                </tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex flex-col">
                      <strong className="text-slate-800">{s.name}</strong>
                      <small className="text-slate-500">{s.email}</small>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {s.programs.map((p, i) => (
                        <span key={i} className="meta-badge type-lesson">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="progress-line m-0 w-[120px]">
                      <i><em className={s.avgProgress === 100 ? "bg-brand-green" : ""} style={{ width: `${s.avgProgress}%` }} /></i>
                      <b className={s.avgProgress === 100 ? "text-brand-green-dark font-bold" : ""}>{s.avgProgress}%</b>
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-brand-green-dark font-bold">
                      <Trophy size={14} /> {s.totalXp}
                    </span>
                  </td>
                  <td>
                    <span className={`flex items-center gap-1 text-sm ${s.lastActiveAt ? "text-brand-green-dark" : "text-slate-500"}`}>
                      <Activity size={14} /> {formatRelativeTime(s.lastActiveAt)}
                    </span>
                  </td>
                  <td>
                    <Link href={`/mentor/evaluasi?userId=${encodeURIComponent(s.id)}`} className="btn btn-outline btn-small">
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
