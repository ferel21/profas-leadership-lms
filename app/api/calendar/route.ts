import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const calendarLimiter = rateLimit({ limit: 40, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = calendarLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan kalender." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const rawMonth = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const rawYear = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

    if (isNaN(rawMonth) || rawMonth < 1 || rawMonth > 12 || isNaN(rawYear) || rawYear < 2020 || rawYear > 2035) {
      return NextResponse.json({ error: "Parameter bulan atau tahun tidak valid." }, { status: 400 });
    }

    // Determine start and end dates for the given month
    const startDate = new Date(rawYear, rawMonth - 1, 1);
    const endDate = new Date(rawYear, rawMonth, 0, 23, 59, 59);

    // If student, get their enrolled courses events + global events
    // If mentor, get their managed courses events + global events
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
          { courseId: null }, // global events
          { courseId: { in: courseIds } } // specific course events
        ]
      },
      take: 200,
      include: {
        course: { select: { title: true } }
      },
      orderBy: { startTime: "asc" }
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ipCheck = calendarLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan pembuatan jadwal." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Only mentors or admins can create events" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { title, description, startTime, endTime, location, courseId } = body;
    
    if (!title || typeof title !== "string" || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const startDt = new Date(startTime);
    const endDt = new Date(endTime);
    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || startDt > endDt) {
      return NextResponse.json({ error: "Waktu mulai/selesai tidak valid." }, { status: 400 });
    }

    let safeCourseId: string | null = null;
    if (typeof courseId === "string" && courseId.trim() !== "") {
      const course = await prisma.course.findUnique({ where: { id: courseId.trim() } });
      if (!course || (user.role !== "SUPER_ADMIN" && course.mentorId !== user.id)) {
        return NextResponse.json({ error: "Anda tidak memiliki izin untuk kelas ini." }, { status: 403 });
      }
      safeCourseId = course.id;
    } else {
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Mentor wajib menentukan kelas (courseId) untuk jadwal acara." }, { status: 403 });
      }
    }

    const cleanTitle = title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150);
    const cleanDesc = typeof description === "string" ? description.replace(/<[^>]*>?/gm, "").trim().slice(0, 500) : "";
    const cleanLocation = typeof location === "string" ? location.replace(/<[^>]*>?/gm, "").trim().slice(0, 150) : "";
    if (!cleanTitle) {
      return NextResponse.json({ error: "Judul acara tidak valid." }, { status: 400 });
    }

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.calendarEvent.create({
        data: {
          title: cleanTitle,
          description: cleanDesc || null,
          startTime: startDt,
          endTime: endDt,
          location: cleanLocation || null,
          courseId: safeCourseId
        }
      });
      await tx.activityLog.create({
        data: { userId: user.id, action: "CREATE_CALENDAR_EVENT", metadata: JSON.stringify({ eventId: created.id, title: cleanTitle, courseId: safeCourseId }) }
      });
      return created;
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ipCheck = calendarLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan pembaruan jadwal." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Only mentors or admins can update events" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { id, title, description, startTime, endTime, location, courseId } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id jadwal diperlukan." }, { status: 400 });
    }

    const existing = await prisma.calendarEvent.findUnique({
      where: { id: id.trim() },
      include: { course: true }
    });
    if (!existing) {
      return NextResponse.json({ error: "Jadwal acara tidak ditemukan." }, { status: 404 });
    }

    if (existing.courseId) {
      if (user.role !== "SUPER_ADMIN" && (!existing.course || existing.course.mentorId !== user.id)) {
        return NextResponse.json({ error: "Anda tidak memiliki izin untuk jadwal ini." }, { status: 403 });
      }
    } else {
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Hanya Admin yang dapat mengubah jadwal global." }, { status: 403 });
      }
    }

    let safeCourseId = existing.courseId;
    if (courseId !== undefined) {
      if (typeof courseId === "string" && courseId.trim() !== "") {
        const course = await prisma.course.findUnique({ where: { id: courseId.trim() } });
        if (!course || (user.role !== "SUPER_ADMIN" && course.mentorId !== user.id)) {
          return NextResponse.json({ error: "Anda tidak memiliki izin untuk kelas tujuan." }, { status: 403 });
        }
        safeCourseId = course.id;
      } else {
        if (user.role !== "SUPER_ADMIN") {
          return NextResponse.json({ error: "Mentor wajib menentukan kelas (courseId) untuk jadwal acara." }, { status: 403 });
        }
        safeCourseId = null;
      }
    }

    const startDt = startTime ? new Date(startTime) : existing.startTime;
    const endDt = endTime ? new Date(endTime) : existing.endTime;
    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || startDt > endDt) {
      return NextResponse.json({ error: "Waktu mulai/selesai tidak valid." }, { status: 400 });
    }

    const cleanTitle = typeof title === "string" ? title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150) : existing.title;
    const cleanDesc = typeof description === "string" ? description.replace(/<[^>]*>?/gm, "").trim().slice(0, 500) : existing.description;
    const cleanLocation = typeof location === "string" ? location.replace(/<[^>]*>?/gm, "").trim().slice(0, 150) : existing.location;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: cleanTitle || existing.title,
          description: cleanDesc,
          startTime: startDt,
          endTime: endDt,
          location: cleanLocation,
          courseId: safeCourseId
        }
      });
      await tx.activityLog.create({
        data: { userId: user.id, action: "UPDATE_CALENDAR_EVENT", metadata: JSON.stringify({ eventId: result.id, title: result.title }) }
      });
      return result;
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ipCheck = calendarLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan penghapusan jadwal." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Only mentors or admins can delete events" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id jadwal diperlukan." }, { status: 400 });
    }

    const existing = await prisma.calendarEvent.findUnique({
      where: { id: id.trim() },
      include: { course: true }
    });
    if (!existing) {
      return NextResponse.json({ error: "Jadwal acara tidak ditemukan." }, { status: 404 });
    }

    if (existing.courseId) {
      if (user.role !== "SUPER_ADMIN" && (!existing.course || existing.course.mentorId !== user.id)) {
        return NextResponse.json({ error: "Anda tidak memiliki izin untuk jadwal ini." }, { status: 403 });
      }
    } else {
      if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Hanya Admin yang dapat menghapus jadwal global." }, { status: 403 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.calendarEvent.delete({ where: { id: existing.id } });
      await tx.activityLog.create({
        data: { userId: user.id, action: "DELETE_CALENDAR_EVENT", metadata: JSON.stringify({ eventId: existing.id, title: existing.title }) }
      });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
