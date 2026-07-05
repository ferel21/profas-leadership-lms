import { getCurrentUser } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar as CalendarIcon, Clock, MapPin, Video, Info, ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string, y?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  const sp = await searchParams;
  const today = new Date();
  const currentMonth = sp.m ? parseInt(sp.m) : today.getMonth() + 1;
  const currentYear = sp.y ? parseInt(sp.y) : today.getFullYear();

  const startDate = new Date(currentYear, currentMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  let courseIds: string[] = [];
  if (user.role === "STUDENT") {
    const enrollments = await prisma.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } });
    courseIds = enrollments.map(e => e.courseId);
  } else if (user.role === "MENTOR") {
    const courses = await prisma.course.findMany({ where: { mentorId: user.id }, select: { id: true } });
    courseIds = courses.map(c => c.id);
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      startTime: { gte: startDate, lte: endDate },
      OR: [
        { courseId: null },
        { courseId: { in: courseIds } }
      ]
    },
    include: { course: { select: { title: true } } },
    orderBy: { startTime: "asc" }
  });

  return (
    <DashboardChrome user={user}>
      <div className="dash-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Kalender Akademik</h1>
          <p>Pantau jadwal kelas *live*, tenggat waktu tugas, dan agenda penting lainnya.</p>
        </div>
        {user.role === "MENTOR" && (
          <button className="btn btn-primary">Tambah Jadwal</button>
        )}
      </div>

      <div className="calendar-layout" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem", marginTop: "2rem", alignItems: "start" }}>
        <main className="calendar-main">
          <div className="data-card" style={{ padding: "0" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarIcon size={20} /> Jadwal Bulan Ini ({new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(startDate)})
              </h2>
            </div>
            
            <div className="event-list" style={{ display: "flex", flexDirection: "column" }}>
              {events.length === 0 ? (
                <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#64748b" }}>
                  <CalendarIcon size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
                  <p>Tidak ada jadwal terdaftar pada bulan ini.</p>
                </div>
              ) : (
                events.map(event => {
                  const eventDate = new Date(event.startTime);
                  const isPast = eventDate < new Date();
                  
                  return (
                    <div key={event.id} style={{ display: "flex", padding: "1.5rem", borderBottom: "1px solid #f1f5f9", opacity: isPast ? 0.6 : 1, transition: "background 0.2s" }} className="event-row">
                      <div style={{ minWidth: "100px", textAlign: "center", borderRight: "1px solid #e2e8f0", paddingRight: "1.5rem", marginRight: "1.5rem" }}>
                        <strong style={{ display: "block", fontSize: "2rem", lineHeight: 1, color: "var(--color-primary)" }}>{eventDate.getDate()}</strong>
                        <small style={{ textTransform: "uppercase", fontWeight: 600, color: "#64748b" }}>
                          {new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(eventDate)}
                        </small>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span className="meta-badge type-evaluation" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>
                            {event.course?.title ?? "Agenda Global"}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "1.125rem", color: "#0f172a", margin: "0 0 0.5rem 0", fontWeight: "600" }}>{event.title}</h3>
                        {event.description && <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "#475569" }}>{event.description}</p>}
                        
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", color: "#64748b", fontSize: "0.875rem" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={14} /> 
                            {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(event.startTime)} - 
                            {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(event.endTime)}
                          </span>
                          {event.location && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", color: event.location.includes("http") ? "var(--color-primary)" : "inherit" }}>
                              {event.location.includes("http") ? <Video size={14} /> : <MapPin size={14} />} 
                              {event.location.includes("http") ? <a href={event.location} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>Link Pertemuan</a> : event.location}
                            </span>
                          )}
                          <Link href="/absensi" style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--color-primary)", fontWeight: 700 }}>
                            <ClipboardCheck size={14} /> {user.role === "STUDENT" ? "Isi Absensi" : "Kelola Absensi"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
        
        <aside className="calendar-sidebar">
          <div className="data-card" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", color: "#334155" }}>
              <Info size={16} /> Info Kalender
            </h3>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
              Jadwal yang ditampilkan di sini adalah agenda spesifik dari program yang Anda ikuti, serta pengumuman global dari institusi.
            </p>
          </div>
        </aside>
      </div>
    </DashboardChrome>
  );
}
