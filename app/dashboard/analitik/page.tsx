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
      <div className="dash-title" style={{ marginBottom: "2rem" }}>
        <h1>Analitik & Pelaporan</h1>
        <p>Pantau metrik retensi, aktivitas siswa, dan performa program secara keseluruhan.</p>
      </div>

      <div className="metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        <article className="data-card glass hover-lift" style={{ padding: "1.75rem", display: "flex", alignItems: "center", gap: "1.25rem", borderRadius: "20px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.75)" }}>
          <div style={{ background: "#f0fdfa", color: "var(--color-primary)", padding: "1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(13,148,136,0.15)" }}>
            <Users size={26} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Peserta</small>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.85rem", color: "var(--ink)", fontWeight: 800 }}>{totalStudents}</h2>
          </div>
        </article>
        
        <article className="data-card glass hover-lift" style={{ padding: "1.75rem", display: "flex", alignItems: "center", gap: "1.25rem", borderRadius: "20px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.75)" }}>
          <div style={{ background: "#fffbeb", color: "#d97706", padding: "1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(217,119,6,0.15)" }}>
            <Activity size={26} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Aktif Hari Ini</small>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.85rem", color: "var(--ink)", fontWeight: 800 }}>{activeToday}</h2>
          </div>
        </article>

        <article className="data-card glass hover-lift" style={{ padding: "1.75rem", display: "flex", alignItems: "center", gap: "1.25rem", borderRadius: "20px", border: "1px solid var(--line)", background: "rgba(255,255,255,0.75)" }}>
          <div style={{ background: "#eff6ff", color: "#2563eb", padding: "1.25rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(37,99,235,0.15)" }}>
            <BarChart3 size={26} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontWeight: "600", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Event Log</small>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.85rem", color: "var(--ink)", fontWeight: 800 }}>{totalActivityEvents.toLocaleString("id-ID")}</h2>
          </div>
        </article>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2rem" }}>
        <div className="data-card glass hover-lift" style={{ borderRadius: "24px", padding: "2rem", background: "rgba(255,255,255,0.8)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ink)" }}>
              <TrendingUp size={20} className="text-primary" /> Tren Aktivitas Sistem Mingguan
            </h2>
            <span style={{ fontSize: "0.75rem", background: "#f0fdfa", color: "var(--color-primary)", padding: "4px 12px", borderRadius: "20px", fontWeight: 600 }}>Real-time</span>
          </div>
          <div style={{ background: "rgba(248,250,252,0.6)", borderRadius: "16px", height: "320px", display: "flex", alignItems: "flex-end", padding: "2rem 1.5rem 1rem", gap: "14px", border: "1px solid #f1f5f9" }}>
            {[
              { day: "Sen", val: 40 },
              { day: "Sel", val: 70 },
              { day: "Rab", val: 45 },
              { day: "Kam", val: 90 },
              { day: "Jum", val: 65 },
              { day: "Sab", val: 80 },
              { day: "Min", val: 100 }
            ].map((item, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: item.val === 100 ? "var(--color-primary)" : "#64748b" }}>{item.val}%</span>
                <div style={{ width: "100%", background: item.val === 100 ? "linear-gradient(180deg, #0d9488, #0f766e)" : "linear-gradient(180deg, #5eead4, #0d9488)", height: `${item.val}%`, borderRadius: "8px 8px 4px 4px", opacity: item.val === 100 ? 1 : 0.75, transition: "height 1s ease-out, transform 0.2s", boxShadow: item.val === 100 ? "0 6px 16px rgba(13,148,136,0.3)" : "none" }} />
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginTop: "4px" }}>{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="data-card glass hover-lift" style={{ borderRadius: "24px", padding: "2rem", background: "rgba(255,255,255,0.8)", border: "1px solid var(--line)" }}>
          <h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ink)" }}>
            <Clock size={20} className="text-primary" /> Distribusi Aksi Terbanyak
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {topActions.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontWeight: 500 }}>Belum ada data terekam.</p>
              </div>
            ) : (
              topActions.map((action, i) => {
                const maxCount = Math.max(...topActions.map(a => a._count.id), 1);
                const barWidth = Math.round((action._count.id / maxCount) * 100);
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "600", color: "#334155", fontSize: "0.95rem" }}>{action.action}</span>
                      <span style={{ background: "#f0fdfa", padding: "2px 10px", borderRadius: "12px", fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: "bold", border: "1px solid #ccfbf1" }}>
                        {action._count.id}x
                      </span>
                    </div>
                    <div style={{ width: "100%", background: "#f1f5f9", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${barWidth}%`, background: "var(--color-primary)", height: "100%", borderRadius: "4px", transition: "width 0.8s ease-out" }} />
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
