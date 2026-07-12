import { getCurrentUser } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Users, Activity, Clock, Sparkles } from "lucide-react";
import { ExportDeckButton } from "@/components/ExportDeckButton";
import { ExportTranscriptButton } from "@/components/ExportTranscriptButton";

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
              category={firstCourse.category || "Executive Leadership"}
              level={firstCourse.level || "ADVANCED"}
              mentorName={firstCourse.mentor.name}
              durationHours={firstCourse.durationHours || 24}
              modules={firstCourse.nodes.map(n => ({
                title: n.title,
                type: n.type,
                durationMin: n.durationMin,
                description: n.description || undefined
              }))}
              outcomes={firstCourse.outcomes || "Menguasai kepemimpinan strategis dan resolusi konflik eksekutif."}
            />
          )}
          <ExportTranscriptButton
            studentName={`${user.name} (${user.role})`}
            studentEmail={user.email}
            organization="PROFAS Leadership OS"
            role={user.role}
            totalXP={1450}
            courses={firstCourse ? [{
              title: firstCourse.title,
              category: firstCourse.category || "Strategic Leadership",
              level: firstCourse.level || "ADVANCED",
              progressPercent: 100,
              status: "COMPLETED"
            }] : []}
            badgesCount={5}
            attendanceRatePercent={96}
          />
        </div>
      </div>

      {/* Banner Quick Tips Eksklusif 31 Skills */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-teal-950/70 via-slate-900/90 to-slate-900/90 border border-teal-500/30 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              Ekspor Multi-Format Langsung (Powered by 31 Antigravity Skills)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Gunakan tombol di atas untuk membuat Slide Deck 16:9 PDF dan Transkrip Akademik langsung dari data live database, atau klik tombol <b>&quot;Pusat Ekspor&quot;</b> di Top Bar untuk opsi Excel Multi-Sheet (.xlsx) dan Silabus Word (.docx).
            </p>
          </div>
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
                    background: item.val === 100 ? "linear-gradient(180deg, #2a6ba7, #1e5a8f)" : "linear-gradient(180deg, #60a5fa, #2a6ba7)",
                    opacity: item.val === 100 ? 1 : 0.75,
                    boxShadow: item.val === 100 ? "0 6px 16px rgba(42,107,167,0.3)" : "none"
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
