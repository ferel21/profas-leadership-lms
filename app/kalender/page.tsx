import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ClipboardCheck, Clock, Info, MapPin, Video } from "lucide-react";
import { CalendarEventManager } from "@/components/shared/CalendarEventManager";
import { DashboardChrome } from "@/components/ui/DashboardChrome";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";

const calendarFormatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Makassar", ...options });

function monthBoundary(year: number, month: number) {
  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+08:00`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const next = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+08:00`);
  return { start, end: new Date(next.getTime() - 1) };
}

function adjacentMonth(year: number, month: number, offset: number) {
  const value = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { month: value.getUTCMonth() + 1, year: value.getUTCFullYear() };
}

function safeMeetingUrl(location: string | null) {
  if (!location) return null;
  try {
    const url = new URL(location);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; y?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  const query = await searchParams;
  const now = new Date();
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const fallbackMonth = Number(nowParts.find(part => part.type === "month")?.value ?? now.getMonth() + 1);
  const fallbackYear = Number(nowParts.find(part => part.type === "year")?.value ?? now.getFullYear());
  const parsedMonth = Number(query.m);
  const parsedYear = Number(query.y);
  const currentMonth = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : fallbackMonth;
  const currentYear = Number.isInteger(parsedYear) && parsedYear >= 2020 && parsedYear <= 2035 ? parsedYear : fallbackYear;
  const { start: startDate, end: endDate } = monthBoundary(currentYear, currentMonth);
  const previous = adjacentMonth(currentYear, currentMonth, -1);
  const next = adjacentMonth(currentYear, currentMonth, 1);

  let courseIds: string[] = [];
  let courseOptions: { id: string; title: string }[] = [];

  if (user.role === Role.STUDENT) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    });
    courseIds = enrollments.map(enrollment => enrollment.courseId);
  } else if (user.role === Role.MENTOR) {
    courseOptions = await prisma.course.findMany({
      where: { mentorId: user.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
    courseIds = courseOptions.map(course => course.id);
  } else {
    courseOptions = await prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  }

  const events = await prisma.calendarEvent.findMany({
    where: {
      startTime: { gte: startDate, lte: endDate },
      ...(user.role === Role.SUPER_ADMIN
        ? {}
        : { OR: [{ courseId: null }, { courseId: { in: courseIds } }] }),
    },
    include: { course: { select: { title: true } } },
    orderBy: { startTime: "asc" },
    take: 200,
  });

  const monthLabel = calendarFormatter({ month: "long", year: "numeric" }).format(startDate);

  return (
    <DashboardChrome user={user}>
      <div className="dash-title dash-title-flex">
        <div>
          <span className="pf-page-kicker">Agenda pembelajaran</span>
          <h1>Kalender Akademik</h1>
          <p>Pantau kelas live, tenggat tugas, dan agenda penting dalam waktu Makassar.</p>
        </div>
        {(user.role === Role.MENTOR || user.role === Role.SUPER_ADMIN) && (
          <CalendarEventManager courses={courseOptions} role={user.role} />
        )}
      </div>

      <div className="calendar-layout calendar-grid-layout">
        <main className="calendar-main">
          <div className="data-card calendar-card-p0">
            <div className="calendar-card-head pf-calendar-month-head">
              <h2 className="calendar-card-title">
                <CalendarIcon size={20} /> {monthLabel}
              </h2>
              <nav aria-label="Navigasi bulan kalender" className="pf-calendar-month-nav">
                <Link href={`/kalender?m=${previous.month}&y=${previous.year}`} aria-label="Bulan sebelumnya">
                  <ChevronLeft aria-hidden="true" />
                </Link>
                <Link href="/kalender">Bulan ini</Link>
                <Link href={`/kalender?m=${next.month}&y=${next.year}`} aria-label="Bulan berikutnya">
                  <ChevronRight aria-hidden="true" />
                </Link>
              </nav>
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
                  const meetingUrl = safeMeetingUrl(event.location);
                  const canManage = user.role === Role.SUPER_ADMIN || (user.role === Role.MENTOR && Boolean(event.courseId));

                  return (
                    <article key={event.id} className={`event-row calendar-event-row ${eventDate < now ? "is-past" : ""}`}>
                      <div className="calendar-date-col">
                        <strong className="calendar-date-num">{calendarFormatter({ day: "numeric" }).format(eventDate)}</strong>
                        <small className="calendar-date-day">{calendarFormatter({ weekday: "short" }).format(eventDate)}</small>
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
                            {calendarFormatter({ hour: "2-digit", minute: "2-digit" }).format(event.startTime)} –{" "}
                            {calendarFormatter({ hour: "2-digit", minute: "2-digit" }).format(event.endTime)}
                          </span>
                          {event.location && (
                            <span className={meetingUrl ? "calendar-meta-primary" : "calendar-meta-item"}>
                              {meetingUrl ? <Video size={14} /> : <MapPin size={14} />}
                              {meetingUrl ? (
                                <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="calendar-meta-link">
                                  Link pertemuan
                                </a>
                              ) : event.location}
                            </span>
                          )}
                          <Link href="/absensi" className="calendar-absensi-link">
                            <ClipboardCheck size={14} /> {user.role === Role.STUDENT ? "Isi Absensi" : "Kelola Absensi"}
                          </Link>
                        </div>

                        {canManage && (
                          <CalendarEventManager
                            courses={courseOptions}
                            role={user.role}
                            event={{
                              id: event.id,
                              title: event.title,
                              description: event.description,
                              startTime: event.startTime.toISOString(),
                              endTime: event.endTime.toISOString(),
                              location: event.location,
                              courseId: event.courseId,
                            }}
                          />
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </main>

        <aside className="calendar-sidebar">
          <div className="data-card calendar-info-card">
            <h3 className="calendar-info-title"><Info size={16} /> Info Kalender</h3>
            <p className="calendar-info-desc">
              {user.role === Role.SUPER_ADMIN
                ? "Admin melihat seluruh agenda global dan program."
                : "Kalender memuat agenda program Anda serta pengumuman global institusi."}
            </p>
          </div>
        </aside>
      </div>
    </DashboardChrome>
  );
}
