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
      <div className="dash-title dash-title-flex">
        <div>
          <h1>Kalender Akademik</h1>
          <p>Pantau jadwal kelas *live*, tenggat waktu tugas, dan agenda penting lainnya.</p>
        </div>
        {user.role === "MENTOR" && (
          <button className="btn btn-primary">Tambah Jadwal</button>
        )}
      </div>

      <div className="calendar-layout calendar-grid-layout">
        <main className="calendar-main">
          <div className="data-card calendar-card-p0">
            <div className="calendar-card-head">
              <h2 className="calendar-card-title">
                <CalendarIcon size={20} /> Jadwal Bulan Ini ({new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(startDate)})
              </h2>
            </div>
            
            <div className="event-list calendar-event-list">
              {events.length === 0 ? (
                <div className="calendar-empty-box">
                  <CalendarIcon size={48} className="calendar-empty-icon" />
                  <p>Tidak ada jadwal terdaftar pada bulan ini.</p>
                </div>
              ) : (
                events.map(event => {
                  const eventDate = new Date(event.startTime);
                  const isPast = eventDate < new Date();
                  
                  return (
                    <div key={event.id} className={`event-row calendar-event-row ${isPast ? "is-past" : ""}`}>
                      <div className="calendar-date-col">
                        <strong className="calendar-date-num">{eventDate.getDate()}</strong>
                        <small className="calendar-date-day">
                          {new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(eventDate)}
                        </small>
                      </div>
                      <div className="calendar-event-body">
                        <div className="calendar-badge-wrap">
                          <span className="meta-badge type-evaluation calendar-badge-pill">
                            {event.course?.title ?? "Agenda Global"}
                          </span>
                        </div>
                        <h3 className="calendar-event-title">{event.title}</h3>
                        {event.description && <p className="calendar-event-desc">{event.description}</p>}
                        
                        <div className="calendar-event-meta-row">
                          <span className="calendar-meta-item">
                            <Clock size={14} /> 
                            {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(event.startTime)} - 
                            {new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(event.endTime)}
                          </span>
                          {event.location && (
                            <span className={event.location.includes("http") ? "calendar-meta-primary" : "calendar-meta-item"}>
                              {event.location.includes("http") ? <Video size={14} /> : <MapPin size={14} />} 
                              {event.location.includes("http") ? <a href={event.location} target="_blank" rel="noreferrer" className="calendar-meta-link">Link Pertemuan</a> : event.location}
                            </span>
                          )}
                          <Link href="/absensi" className="calendar-absensi-link">
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
          <div className="data-card calendar-info-card">
            <h3 className="calendar-info-title">
              <Info size={16} /> Info Kalender
            </h3>
            <p className="calendar-info-desc">
              Jadwal yang ditampilkan di sini adalah agenda spesifik dari program yang Anda ikuti, serta pengumuman global dari institusi.
            </p>
          </div>
        </aside>
      </div>
    </DashboardChrome>
  );
}
