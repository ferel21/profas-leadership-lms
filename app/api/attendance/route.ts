import { AttendanceStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const attendanceLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("check_in"), eventId: z.string().min(1) }),
  z.object({ action: z.literal("open"), eventId: z.string().min(1), durationMinutes: z.number().int().min(5).max(240).default(60) }),
  z.object({ action: z.literal("close"), eventId: z.string().min(1) }),
  z.object({
    action: z.literal("mark"),
    eventId: z.string().min(1),
    userId: z.string().min(1),
    status: z.nativeEnum(AttendanceStatus),
    note: z.string().trim().max(200).optional(),
  }),
]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk untuk melihat absensi." }, { status: 401 });

  const now = new Date();
  const range = {
    gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
  };

  let eventWhere = {};
  if (user.role === Role.STUDENT) {
    const enrollments = await prisma.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } });
    eventWhere = { OR: [{ courseId: null }, { courseId: { in: enrollments.map(item => item.courseId) } }] };
  } else if (user.role === Role.MENTOR) {
    eventWhere = { course: { mentorId: user.id } };
  }

  const events = await prisma.calendarEvent.findMany({
    where: { ...eventWhere, startTime: range },
    select: {
      id: true, title: true, startTime: true, endTime: true, attendanceEnabled: true,
      attendanceOpenAt: true, attendanceCloseAt: true,
      course: { select: { title: true } },
      attendanceRecords: user.role === Role.STUDENT
        ? { where: { userId: user.id }, select: { status: true, checkedInAt: true } }
        : { select: { status: true, checkedInAt: true, user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json({ events, serverTime: now });
}

export async function POST(request: Request) {
  const ipCheck = attendanceLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan absensi. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sesi Anda telah berakhir. Silakan masuk kembali." }, { status: 401 });

  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Permintaan absensi tidak valid." }, { status: 400 });

  const input = parsed.data;
  const event = await prisma.calendarEvent.findUnique({
    where: { id: input.eventId },
    include: {
      course: {
        select: {
          mentorId: true,
          title: true,
          enrollments: { where: { user: { role: Role.STUDENT } }, select: { userId: true } },
        },
      },
    },
  });
  if (!event) return NextResponse.json({ error: "Sesi kelas tidak ditemukan." }, { status: 404 });

  if (input.action === "check_in") {
    if (user.role !== Role.STUDENT) return NextResponse.json({ error: "Absen mandiri hanya tersedia untuk peserta." }, { status: 403 });
    const enrolled = !event.courseId || event.course?.enrollments.some(item => item.userId === user.id);
    if (!enrolled) return NextResponse.json({ error: "Anda tidak terdaftar pada program ini." }, { status: 403 });

    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: user.id } }
    });
    if (existingRecord && (existingRecord.status === AttendanceStatus.PRESENT || existingRecord.status === AttendanceStatus.LATE || existingRecord.status === AttendanceStatus.EXCUSED)) {
      return NextResponse.json({ record: existingRecord, message: "Anda sudah melakukan absensi sebelumnya." });
    }

    const now = new Date();
    if (!event.attendanceEnabled || !event.attendanceOpenAt || !event.attendanceCloseAt || now < event.attendanceOpenAt || now > event.attendanceCloseAt) {
      return NextResponse.json({ error: "Sesi absensi belum dibuka atau sudah ditutup." }, { status: 409 });
    }

    const lateAfter = new Date(event.startTime.getTime() + 15 * 60 * 1000);
    const status = now > lateAfter ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
    const record = await prisma.$transaction(async tx => {
      const attendance = await tx.attendanceRecord.upsert({
        where: { eventId_userId: { eventId: event.id, userId: user.id } },
        create: { eventId: event.id, userId: user.id, status, checkedInAt: now, source: "SELF" },
        update: { status, checkedInAt: now, source: "SELF", note: null },
      });
      await tx.activityLog.create({
        data: { userId: user.id, action: "ATTENDANCE_CHECK_IN", metadata: JSON.stringify({ eventId: event.id, status }) },
      });
      return attendance;
    });
    return NextResponse.json({ record, message: status === AttendanceStatus.LATE ? "Absensi tercatat sebagai terlambat." : "Kehadiran berhasil dicatat." });
  }

  const canManage = user.role === Role.SUPER_ADMIN || (user.role === Role.MENTOR && event.course?.mentorId === user.id);
  if (!canManage) return NextResponse.json({ error: "Anda tidak memiliki akses untuk mengelola sesi ini." }, { status: 403 });

  if (input.action === "open") {
    const now = new Date();
    const closeAt = new Date(now.getTime() + input.durationMinutes * 60 * 1000);
    await prisma.$transaction(async tx => {
      await tx.calendarEvent.update({
        where: { id: event.id },
        data: { attendanceEnabled: true, attendanceOpenAt: now, attendanceCloseAt: closeAt },
      });
      if (event.course?.enrollments.length) {
        await tx.notification.createMany({
          data: event.course.enrollments.map(item => ({
            userId: item.userId,
            title: "Absensi dibuka",
            message: `Silakan isi kehadiran untuk ${event.title}.`,
            type: "ATTENDANCE",
            link: "/absensi",
          })),
        });
      }
      await tx.activityLog.create({
        data: { userId: user.id, action: "ATTENDANCE_OPEN", metadata: JSON.stringify({ eventId: event.id, closeAt }) },
      });
    });
    return NextResponse.json({ message: `Absensi dibuka selama ${input.durationMinutes} menit.`, closeAt });
  }

  if (input.action === "close") {
    const now = new Date();
    const expectedUserIds = event.course
      ? event.course.enrollments.map(item => item.userId)
      : (await prisma.user.findMany({ where: { role: Role.STUDENT }, select: { id: true } })).map(item => item.id);
    await prisma.$transaction(async tx => {
      await tx.calendarEvent.update({ where: { id: event.id }, data: { attendanceCloseAt: now } });
      if (expectedUserIds.length) {
        await Promise.all(expectedUserIds.map(userId => tx.attendanceRecord.upsert({
          where: { eventId_userId: { eventId: event.id, userId } },
          create: { eventId: event.id, userId, status: AttendanceStatus.ABSENT, source: "SYSTEM" },
          update: {},
        })));
      }
      await tx.activityLog.create({ data: { userId: user.id, action: "ATTENDANCE_CLOSE", metadata: JSON.stringify({ eventId: event.id }) } });
    });
    return NextResponse.json({ message: "Sesi absensi telah ditutup." });
  }

  const target = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, role: true } });
  if (!target || target.role !== Role.STUDENT) return NextResponse.json({ error: "Peserta tidak ditemukan." }, { status: 404 });
  if (event.courseId && !event.course?.enrollments.some(item => item.userId === target.id)) {
    return NextResponse.json({ error: "Peserta tidak terdaftar pada program ini." }, { status: 400 });
  }

  const checkedInAt = input.status === AttendanceStatus.PRESENT || input.status === AttendanceStatus.LATE ? new Date() : null;
  const cleanNote = typeof input.note === "string" ? input.note.replace(/<[^>]*>?/gm, "").trim() : null;
  const record = await prisma.$transaction(async tx => {
    const attendance = await tx.attendanceRecord.upsert({
      where: { eventId_userId: { eventId: event.id, userId: target.id } },
      create: { eventId: event.id, userId: target.id, status: input.status, checkedInAt, source: user.role, note: cleanNote },
      update: { status: input.status, checkedInAt, source: user.role, note: cleanNote },
    });
    await tx.activityLog.create({
      data: { userId: user.id, action: "ATTENDANCE_MARK", metadata: JSON.stringify({ eventId: event.id, targetUserId: target.id, status: input.status }) },
    });
    return attendance;
  });
  return NextResponse.json({ record, message: "Status kehadiran peserta diperbarui." });
}
