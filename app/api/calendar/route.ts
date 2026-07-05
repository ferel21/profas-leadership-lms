import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : new Date().getMonth() + 1;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();

    // Determine start and end dates for the given month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

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
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") return NextResponse.json({ error: "Only mentors can create events" }, { status: 403 });

  try {
    const { title, description, startTime, endTime, location, courseId } = await request.json();
    
    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // verify mentor owns the course
    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course || course.mentorId !== user.id) {
        return NextResponse.json({ error: "You don't have permission for this course" }, { status: 403 });
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location,
        courseId
      }
    });

    return NextResponse.json(event);
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
