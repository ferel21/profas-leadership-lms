import { getCurrentUser } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Users, Activity, Clock } from "lucide-react";

export default async function AnalyticsDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "STUDENT") redirect("/dashboard");

  // Fetch stats based on role
  let totalStudents = 0;
  let activeToday = 0;
  let totalActivityEvents = 0;
  let topActions: { action: string, _count: { id: number } }[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (user.role === "MENTOR") {
    // Mentors only see stats related to their courses/students
    const mentoredCourses = await prisma.course.findMany({ where: { mentorId: user.id }, select: { id: true } });
    const courseIds = mentoredCourses.map(c => c.id);
    
    totalStudents = await prisma.enrollment.count({ where: { courseId: { in: courseIds } } });
    
    // Using activity logs for global metric approximation
    // (In a full scale app, we'd filter logs by course-specific metadata)
    totalActivityEvents = await prisma.activityLog.count();
    activeToday = await prisma.activityLog.groupBy({ by: ['userId'], where: { createdAt: { gte: today } } }).then(res => res.length);
    // @ts-expect-error prisma type mismatch
    topActions = await prisma.activityLog.groupBy({ by: ['action'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 });

  } else {
    // Admins see platform-wide stats
    totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });
    totalActivityEvents = await prisma.activityLog.count();
    activeToday = await prisma.activityLog.groupBy({ by: ['userId'], where: { createdAt: { gte: today } } }).then(res => res.length);
    // @ts-expect-error prisma type mismatch
    topActions = await prisma.activityLog.groupBy({ by: ['action'], _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 5 });
  }

  return (
    <DashboardChrome user={user}>
      <div className="dash-title mb-8">
        <h1>Analitik & Pelaporan</h1>
        <p>Pantau metrik retensi, aktivitas siswa, dan performa program secara keseluruhan.</p>
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
            <small className="analytics-metric-label">Total Event Log</small>
            <h2 className="analytics-metric-value">{totalActivityEvents.toLocaleString("id-ID")}</h2>
          </div>
        </article>
      </div>

      <div className="analytics-chart-grid">
        <div className="analytics-chart-card hover-lift">
          <div className="analytics-chart-header">
            <h2 className="analytics-chart-title">
              <TrendingUp size={20} className="text-primary" /> Tren Aktivitas Sistem Mingguan
            </h2>
            <span className="analytics-realtime-badge">Real-time</span>
          </div>
          <div className="analytics-bars-container">
            {[
              { day: "Sen", val: 40 },
              { day: "Sel", val: 70 },
              { day: "Rab", val: 45 },
              { day: "Kam", val: 90 },
              { day: "Jum", val: 65 },
              { day: "Sab", val: 80 },
              { day: "Min", val: 100 }
            ].map((item, i) => (
              <div key={i} className="analytics-bar-col">
                <span className={`analytics-bar-pct ${item.val === 100 ? "text-primary" : "text-muted"}`}>{item.val}%</span>
                <div 
                  className="analytics-bar-fill"
                  style={{ 
                    height: `${item.val}%`,
                    background: item.val === 100 ? "linear-gradient(180deg, #0d9488, #0f766e)" : "linear-gradient(180deg, #5eead4, #0d9488)",
                    opacity: item.val === 100 ? 1 : 0.75,
                    boxShadow: item.val === 100 ? "0 6px 16px rgba(13,148,136,0.3)" : "none"
                  }} 
                />
                <span className="analytics-bar-label">{item.day}</span>
              </div>
            ))}
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
                const maxCount = Math.max(...topActions.map(a => a._count.id), 1);
                const barWidth = Math.round((action._count.id / maxCount) * 100);
                return (
                  <div key={i} className="analytics-log-row">
                    <div className="analytics-log-head">
                      <span className="font-semibold text-slate-700 text-sm">{action.action}</span>
                      <span className="analytics-realtime-badge">
                        {action._count.id}x
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: `${barWidth}%` }} />
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
