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

      <div className="metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <article className="data-card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "#f0fdfa", color: "var(--color-primary)", padding: "1rem", borderRadius: "12px" }}>
            <Users size={24} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontWeight: "600", fontSize: "0.875rem" }}>Total Peserta</small>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.5rem" }}>{totalStudents}</h2>
          </div>
        </article>
        
        <article className="data-card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "#fffbeb", color: "#d97706", padding: "1rem", borderRadius: "12px" }}>
            <Activity size={24} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontWeight: "600", fontSize: "0.875rem" }}>Aktif Hari Ini</small>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.5rem" }}>{activeToday}</h2>
          </div>
        </article>

        <article className="data-card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "#eff6ff", color: "#2563eb", padding: "1rem", borderRadius: "12px" }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <small style={{ color: "#64748b", fontWeight: "600", fontSize: "0.875rem" }}>Total Event Log</small>
            <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.5rem" }}>{totalActivityEvents.toLocaleString("id-ID")}</h2>
          </div>
        </article>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }}>
        <div className="data-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} /> Tren Aktivitas Sistem
            </h2>
          </div>
          <div style={{ background: "#f8fafc", borderRadius: "8px", height: "300px", display: "flex", alignItems: "flex-end", padding: "2rem", gap: "10px" }}>
            {/* Mock chart representation */}
            {[40, 70, 45, 90, 65, 80, 100].map((val, i) => (
              <div key={i} style={{ flex: 1, background: "var(--color-primary)", height: `${val}%`, borderRadius: "4px 4px 0 0", opacity: val === 100 ? 1 : 0.6, transition: "height 1s ease-out" }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "0.75rem", marginTop: "1rem", padding: "0 1rem" }}>
            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
          </div>
        </div>

        <div className="data-card">
          <h2 style={{ fontSize: "1.125rem", margin: "0 0 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={18} /> Aksi Terbanyak
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {topActions.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Belum ada data terekam.</p>
            ) : (
              topActions.map((action, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.75rem", borderBottom: i !== topActions.length - 1 ? "1px dashed #e2e8f0" : "none" }}>
                  <span style={{ fontWeight: "500", color: "#334155" }}>{action.action}</span>
                  <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", color: "#475569", fontWeight: "bold" }}>
                    {action._count.id}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardChrome>
  );
}
