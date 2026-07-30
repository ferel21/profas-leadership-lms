import { getCurrentUser } from "@/services/auth";
import { DashboardChrome } from "@/components/ui/DashboardChrome";
import { redirect } from "next/navigation";
import { prisma } from "@/services/prisma";
import { BarChart3, TrendingUp, Users, Activity, Clock } from "lucide-react";
import { ExportDeckButton } from "@/components/shared/ExportDeckButton";
import { ExportTranscriptButton } from "@/components/shared/ExportTranscriptButton";
import {
  activityMetadataBelongsToMentorScope,
  buildMentorActivityWhere,
  buildMentorAnalyticsScope,
} from "@/services/mentor-analytics-scope";

const DISPLAY_TIME_ZONE = "Asia/Makassar";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const dayLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: "short"
});

function startOfMakassarDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find(item => item.type === type)?.value ?? 0);

  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")) - (8 * 60 * 60 * 1000));
}

export default async function AnalyticsDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT") redirect("/dashboard");

  const isMentor = user.role === "MENTOR";
  const mentorScope = buildMentorAnalyticsScope(isMentor
    ? await prisma.course.findMany({
        where: { mentorId: user.id },
        select: {
          id: true,
          nodes: { select: { id: true } },
          assessments: { select: { id: true } },
          calendarEvents: { select: { id: true } },
          enrollments: {
            where: { user: { role: "STUDENT" } },
            select: { userId: true },
          },
        },
      })
    : []);
  const participantIds = mentorScope.participantIds;

  const today = startOfMakassarDay(new Date());
  const weekStart = new Date(today.getTime() - (6 * ONE_DAY_MS));

  const profileStatsPromise = prisma.user.findUnique({
    where: { id: user.id },
    select: {
      organization: true,
      xpLogs: { select: { points: true } },
      userBadges: { select: { id: true } },
      attendances: { select: { status: true } },
      enrollments: {
        select: {
          progressPercent: true,
          status: true,
          completedAt: true,
          course: {
            select: { title: true, category: true, level: true }
          }
        }
      }
    }
  });

  type TopAction = { action: string; _count: { id: number } };
  let totalStudents = 0;
  let totalActivityEvents = 0;
  let activeToday = 0;
  let topActions: TopAction[] = [];
  let weeklyLogs: Array<{ createdAt: Date }> = [];

  if (isMentor) {
    const candidateLogs = await prisma.activityLog.findMany({
      where: buildMentorActivityWhere(mentorScope),
      select: {
        userId: true,
        action: true,
        metadata: true,
        createdAt: true,
      },
    });
    const scopedLogs = candidateLogs.filter(log => (
      activityMetadataBelongsToMentorScope(log.metadata, mentorScope)
    ));
    const actionCounts = new Map<string, number>();
    for (const log of scopedLogs) {
      actionCounts.set(log.action, (actionCounts.get(log.action) ?? 0) + 1);
    }

    totalStudents = participantIds.length;
    totalActivityEvents = scopedLogs.length;
    activeToday = new Set(
      scopedLogs
        .filter(log => log.createdAt >= today)
        .map(log => log.userId),
    ).size;
    topActions = Array.from(actionCounts, ([action, count]) => ({
      action,
      _count: { id: count },
    }))
      .sort((left, right) => right._count.id - left._count.id)
      .slice(0, 5);
    weeklyLogs = scopedLogs
      .filter(log => log.createdAt >= weekStart)
      .map(log => ({ createdAt: log.createdAt }));
  } else {
    const [
      platformStudentCount,
      platformActivityCount,
      activeTodayRows,
      platformTopActions,
      platformWeeklyLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.activityLog.count(),
      prisma.activityLog.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: today } },
      }),
      prisma.activityLog.groupBy({
        by: ["action"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.activityLog.findMany({
        where: { createdAt: { gte: weekStart } },
        select: { createdAt: true },
      }),
    ]);

    totalStudents = platformStudentCount;
    totalActivityEvents = platformActivityCount;
    activeToday = activeTodayRows.length;
    topActions = platformTopActions;
    weeklyLogs = platformWeeklyLogs;
  }

  const profileStats = await profileStatsPromise;
  const weeklyCounts = new Map<string, number>();
  weeklyLogs.forEach(log => {
    const key = dateKeyFormatter.format(log.createdAt);
    weeklyCounts.set(key, (weeklyCounts.get(key) ?? 0) + 1);
  });
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getTime() + (index * ONE_DAY_MS));
    const key = dateKeyFormatter.format(date);
    return {
      key,
      day: dayLabelFormatter.format(date),
      count: weeklyCounts.get(key) ?? 0
    };
  });
  const maxWeeklyCount = Math.max(...weeklyActivity.map(item => item.count), 1);

  const transcriptTotalXP = profileStats?.xpLogs.reduce((total, log) => total + log.points, 0) ?? 0;
  const attendedSessions = profileStats?.attendances.filter(record =>
    record.status === "PRESENT" || record.status === "LATE"
  ).length ?? 0;
  const attendanceRate = profileStats?.attendances.length
    ? Math.round((attendedSessions / profileStats.attendances.length) * 100)
    : 0;

  // Fetch course details for Executive Deck Export
  const firstCourse = await prisma.course.findFirst({
    where: user.role === "MENTOR" ? { mentorId: user.id } : undefined,
    select: {
      title: true,
      category: true,
      level: true,
      durationHours: true,
      outcomes: true,
      mentor: { select: { name: true } },
      nodes: {
        select: { title: true, type: true, durationMin: true, description: true, order: true },
        orderBy: { order: "asc" }
      }
    }
  });

  return (
    <DashboardChrome user={user}>
      <div className="dash-title mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1>Analitik & Pelaporan</h1>
          <p>Pantau metrik retensi, aktivitas siswa, dan performa program secara keseluruhan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {firstCourse && (
            <ExportDeckButton
              courseTitle={firstCourse.title}
              category={firstCourse.category}
              level={firstCourse.level}
              mentorName={firstCourse.mentor.name}
              durationHours={firstCourse.durationHours}
              modules={firstCourse.nodes.map(n => ({
                title: n.title,
                type: n.type,
                durationMin: n.durationMin,
                description: n.description || undefined
              }))}
              outcomes={firstCourse.outcomes}
            />
          )}
          <ExportTranscriptButton
            studentName={`${user.name} (${user.role})`}
            studentEmail={user.email}
            organization={profileStats?.organization ?? undefined}
            role={user.role}
            totalXP={transcriptTotalXP}
            courses={(profileStats?.enrollments ?? []).map(enrollment => ({
              title: enrollment.course.title,
              category: enrollment.course.category,
              level: enrollment.course.level,
              progressPercent: enrollment.progressPercent,
              status: enrollment.status,
              completedAt: enrollment.completedAt?.toISOString()
            }))}
            badgesCount={profileStats?.userBadges.length ?? 0}
            attendanceRatePercent={attendanceRate}
          />
        </div>
      </div>

      <div className="analytics-metric-grid">
        <article className="analytics-card-flex hover-lift">
          <div className="analytics-icon-wrap analytics-icon-teal">
            <Users size={26} />
          </div>
          <div>
            <small className="analytics-metric-label">Total Peserta</small>
            <h2 className="analytics-metric-value">{totalStudents}</h2>
          </div>
        </article>
        
        <article className="analytics-card-flex hover-lift">
          <div className="analytics-icon-wrap analytics-icon-amber">
            <Activity size={26} />
          </div>
          <div>
            <small className="analytics-metric-label">Aktif Hari Ini</small>
            <h2 className="analytics-metric-value">{activeToday}</h2>
          </div>
        </article>

        <article className="analytics-card-flex hover-lift">
          <div className="analytics-icon-wrap analytics-icon-blue">
            <BarChart3 size={26} />
          </div>
          <div>
            <small className="analytics-metric-label">{isMentor ? "Aktivitas Peserta" : "Total Event Log"}</small>
            <h2 className="analytics-metric-value">{totalActivityEvents.toLocaleString("id-ID")}</h2>
          </div>
        </article>
      </div>

      <div className="analytics-chart-grid">
        <div className="analytics-chart-card hover-lift">
          <div className="analytics-chart-header">
            <h2 className="analytics-chart-title">
              <TrendingUp size={20} className="text-primary" /> {isMentor ? "Aktivitas Peserta 7 Hari Terakhir" : "Aktivitas Sistem 7 Hari Terakhir"}
            </h2>
            <span className="analytics-realtime-badge">Data aktual</span>
          </div>
          <div className="analytics-bars-container">
            {weeklyActivity.map(item => {
              const isPeak = item.count > 0 && item.count === maxWeeklyCount;
              const height = item.count > 0
                ? `${Math.max(8, Math.round((item.count / maxWeeklyCount) * 100))}%`
                : "2px";

              return (
              <div key={item.key} className="analytics-bar-col">
                <span className={`analytics-bar-pct ${isPeak ? "text-primary" : "text-muted"}`}>{item.count}</span>
                <div 
                  className="analytics-bar-fill"
                  aria-label={`${item.count} aktivitas pada ${item.day}`}
                  style={{ 
                    height,
                    background: isPeak ? "linear-gradient(180deg, #2a6ba7, #1e5a8f)" : "linear-gradient(180deg, #60a5fa, #2a6ba7)",
                    opacity: isPeak ? 1 : 0.75,
                    boxShadow: isPeak ? "0 6px 16px rgba(42,107,167,0.3)" : "none"
                  }} 
                />
                <span className="analytics-bar-label">{item.day}</span>
              </div>
              );
            })}
          </div>
        </div>

        <div className="analytics-chart-card hover-lift">
          <h2 className="analytics-chart-title mb-6">
            <Clock size={20} className="text-primary" /> Distribusi Aksi Terbanyak
          </h2>
          <div className="flex flex-col gap-5">
            {topActions.length === 0 ? (
              <div className="p-12 text-center text-muted">
                <p className="m-0 font-medium">Belum ada data terekam.</p>
              </div>
            ) : (
              topActions.map((action, i) => {
                const countVal = action._count.id;
                const maxCount = Math.max(...topActions.map(a => a._count.id), 1);
                const barWidth = Math.min(100, Math.max(10, Math.round((countVal / maxCount) * 100)));
                return (
                  <div key={i} className="analytics-log-row">
                    <div className="analytics-log-head">
                      <span className="font-semibold text-slate-700 text-sm">{action.action}</span>
                      <span className="analytics-realtime-badge" style={{ background: "#eff6ff", color: "#1e5a8f", borderColor: "#bfdbfe" }}>
                        {countVal}x
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barWidth}%`, background: "linear-gradient(90deg, #1e5a8f, #2a6ba7)" }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
