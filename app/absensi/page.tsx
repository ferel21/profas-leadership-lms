import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AttendanceClient } from "@/components/AttendanceClient";
import { DashboardChrome } from "@/components/DashboardChrome";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  let courseIds: string[] | null = null;

  if (user.role === Role.STUDENT) {
    const enrollments = await prisma.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } });
    courseIds = enrollments.map(item => item.courseId);
  } else if (user.role === Role.MENTOR) {
    const courses = await prisma.course.findMany({ where: { mentorId: user.id }, select: { id: true } });
    courseIds = courses.map(item => item.id);
  }

  const [allStudents, events] = await Promise.all([
    user.role === Role.SUPER_ADMIN
      ? prisma.user.findMany({ where: { role: Role.STUDENT }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    prisma.calendarEvent.findMany({
      where: {
        startTime: { gte: start, lte: end },
        ...(user.role === Role.STUDENT ? { OR: [{ courseId: null }, { courseId: { in: courseIds ?? [] } }] } : {}),
        ...(user.role === Role.MENTOR ? { courseId: { in: courseIds ?? [] } } : {}),
      },
      include: {
        course: {
          select: {
            title: true,
            enrollments: { where: { user: { role: Role.STUDENT } }, select: { user: { select: { id: true, name: true, email: true } } }, orderBy: { user: { name: "asc" } } },
          },
        },
        attendanceRecords: {
          ...(user.role === Role.STUDENT ? { where: { userId: user.id } } : {}),
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { startTime: "desc" },
    }),
  ]);

  const viewEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    courseTitle: event.course?.title ?? "Agenda PROFAS",
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    attendanceEnabled: event.attendanceEnabled,
    attendanceOpenAt: event.attendanceOpenAt?.toISOString() ?? null,
    attendanceCloseAt: event.attendanceCloseAt?.toISOString() ?? null,
    participants: user.role === Role.STUDENT ? [] : (event.course?.enrollments.map(item => item.user) ?? allStudents),
    records: event.attendanceRecords.map(record => ({
      id: record.id,
      userId: record.userId,
      userName: record.user.name,
      status: record.status,
      checkedInAt: record.checkedInAt?.toISOString() ?? null,
      source: record.source,
    })),
  }));

  return <DashboardChrome user={user}>
    <div className="dash-title attendance-title">
      <div>
        <span className="eyebrow">KEHADIRAN KELAS</span>
        <h1>{user.role === Role.STUDENT ? "Absensi Saya" : "Manajemen Absensi"}</h1>
        <p>{user.role === Role.STUDENT ? "Catat kehadiran saat sesi dibuka dan pantau riwayat Anda." : "Buka sesi, pantau kehadiran, dan koreksi status peserta."}</p>
      </div>
    </div>
    <AttendanceClient role={user.role} events={viewEvents} serverNow={now.toISOString()} />
  </DashboardChrome>;
}
