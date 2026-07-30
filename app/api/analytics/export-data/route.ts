import { NextResponse } from "next/server";
import { AttemptStatus, Role } from "@prisma/client";
import { getCurrentUser } from "@/services/auth";
import {
  buildMentorAnalyticsScope,
  mentorXpSourceIds,
} from "@/services/mentor-analytics-scope";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";

const exportLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

function sanitizeSpreadsheetText(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.replace(/<[^>]*>?/gm, "").trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * API ekspor data LMS. Semua nilai laporan berasal dari record yang tersimpan;
 * field yang tidak memiliki record sumber dikembalikan kosong atau dihilangkan.
 */
export async function GET(request: Request) {
  const ipCheck = exportLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan ekspor data. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Sesi tidak valid. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "EXPORT_DATA",
        metadata: JSON.stringify({ role: user.role }),
      },
    }).catch(() => {});

    if (user.role === Role.SUPER_ADMIN || user.role === Role.MENTOR) {
      return NextResponse.json(await buildStaffExport(user.id, user.role));
    }

    const studentExport = await buildStudentExport(user.id);
    if (!studentExport) {
      return NextResponse.json({ message: "Data pengguna tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json(studentExport);
  } catch (error: unknown) {
    console.error("Export Data API Error:", error);
    return NextResponse.json({ message: "Gagal memproses data ekspor dari database." }, { status: 500 });
  }
}

async function buildStaffExport(userId: string, role: Role) {
  const isMentor = role === Role.MENTOR;

  const coursesRaw = await prisma.course.findMany({
    where: isMentor ? { mentorId: userId } : undefined,
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      level: true,
      durationHours: true,
      outcomes: true,
      mentor: { select: { name: true } },
      assessments: { select: { id: true } },
      nodes: {
        select: {
          id: true,
          title: true,
          type: true,
          durationMin: true,
          description: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
    },
  });

  const staffScope = buildMentorAnalyticsScope(coursesRaw);
  const courseIds = staffScope.courseIds;
  const scopedXpSourceIds = mentorXpSourceIds(staffScope);

  const studentUsers = await prisma.user.findMany({
    where: {
      role: Role.STUDENT,
      ...(isMentor ? { enrollments: { some: { courseId: { in: courseIds } } } } : {}),
    },
    take: 300,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      enrollments: {
        where: isMentor ? { courseId: { in: courseIds } } : undefined,
        take: 20,
        orderBy: { enrolledAt: "desc" },
        select: {
          courseId: true,
          status: true,
          completedAt: true,
          course: { select: { title: true } },
        },
      },
      attempts: {
        where: {
          status: AttemptStatus.GRADED,
          ...(isMentor ? { assessment: { courseId: { in: courseIds } } } : {}),
        },
        select: {
          score: true,
          assessment: { select: { courseId: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const studentIds = studentUsers.map(student => student.id);
  const [attendanceRecords, xpRecords] = await prisma.$transaction([
    prisma.attendanceRecord.findMany({
      where: isMentor ? { event: { courseId: { in: courseIds } } } : undefined,
      select: {
        status: true,
        checkedInAt: true,
        note: true,
        user: { select: { name: true } },
        event: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.xPLog.findMany({
      where: {
        userId: { in: studentIds },
        ...(isMentor ? { sourceId: { in: scopedXpSourceIds } } : {}),
      },
      select: {
        userId: true,
        points: true,
        source: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const xpByUser = groupXpByUser(xpRecords);

  const students = studentUsers.flatMap(student => {
    const xpTotal = xpByUser.get(student.id)?.total ?? 0;
    return student.enrollments.map(enrollment => {
      const scores = student.attempts
        .filter(attempt => attempt.assessment.courseId === enrollment.courseId)
        .map(attempt => attempt.score);
      const score = average(scores);

      return {
        name: sanitizeSpreadsheetText(student.name),
        email: sanitizeSpreadsheetText(student.email),
        courseTitle: sanitizeSpreadsheetText(enrollment.course.title),
        role: student.role,
        status: enrollment.status,
        ...(score !== null ? { score } : {}),
        ...(enrollment.completedAt ? { completedAt: dateOnly(enrollment.completedAt) } : {}),
        totalXP: xpTotal,
      };
    });
  });

  const attendances = attendanceRecords.map(record => ({
    eventName: sanitizeSpreadsheetText(record.event.title),
    userName: sanitizeSpreadsheetText(record.user.name),
    status: record.status,
    checkedInAt: record.checkedInAt ? dateOnly(record.checkedInAt) : "",
    ...(record.note ? { note: sanitizeSpreadsheetText(record.note) } : {}),
  }));

  const xpLogs = studentUsers.flatMap(student => {
    const xp = xpByUser.get(student.id);
    if (!xp) return [];
    return [{
      userName: sanitizeSpreadsheetText(student.name),
      totalXP: xp.total,
      source: sanitizeSpreadsheetText(xp.latestSource),
      lastActivity: dateOnly(xp.latestActivity),
    }];
  });

  const courses = coursesRaw.map(course => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    category: course.category,
    level: course.level,
    durationHours: course.durationHours,
    outcomes: course.outcomes,
    mentorName: course.mentor.name,
    modules: course.nodes.map(node => ({
      title: node.title,
      type: node.type,
      durationMin: node.durationMin,
      ...(node.description ? { description: node.description } : {}),
    })),
  }));

  return {
    success: true,
    role,
    students,
    attendances,
    xpLogs,
    courses,
  };
}

async function buildStudentExport(userId: string) {
  const studentData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      organization: true,
      role: true,
      xpLogs: {
        select: { points: true, source: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      userBadges: { select: { id: true } },
      attempts: {
        where: { status: AttemptStatus.GRADED },
        select: {
          score: true,
          assessment: { select: { courseId: true } },
        },
      },
      attendances: {
        select: {
          status: true,
          checkedInAt: true,
          note: true,
          event: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        select: {
          courseId: true,
          progressPercent: true,
          status: true,
          completedAt: true,
          course: {
            select: {
              title: true,
              category: true,
              level: true,
              durationHours: true,
              outcomes: true,
              mentor: { select: { name: true } },
              nodes: {
                select: {
                  title: true,
                  type: true,
                  durationMin: true,
                  description: true,
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!studentData) {
    return null;
  }

  const totalXP = studentData.xpLogs.reduce((total, log) => total + log.points, 0);
  const courses = studentData.enrollments.map(enrollment => ({
    title: enrollment.course.title,
    category: enrollment.course.category,
    level: enrollment.course.level,
    progressPercent: enrollment.progressPercent,
    status: enrollment.status,
    durationHours: enrollment.course.durationHours,
    outcomes: enrollment.course.outcomes,
    mentorName: enrollment.course.mentor.name,
    modules: enrollment.course.nodes.map(node => ({
      title: node.title,
      type: node.type,
      durationMin: node.durationMin,
      ...(node.description ? { description: node.description } : {}),
    })),
  }));

  const students = studentData.enrollments.map(enrollment => {
    const score = average(
      studentData.attempts
        .filter(attempt => attempt.assessment.courseId === enrollment.courseId)
        .map(attempt => attempt.score),
    );

    return {
      name: sanitizeSpreadsheetText(studentData.name),
      email: sanitizeSpreadsheetText(studentData.email),
      courseTitle: sanitizeSpreadsheetText(enrollment.course.title),
      role: studentData.role,
      status: enrollment.status,
      ...(score !== null ? { score } : {}),
      ...(enrollment.completedAt ? { completedAt: dateOnly(enrollment.completedAt) } : {}),
    };
  });

  const attendances = studentData.attendances.map(record => ({
    eventName: sanitizeSpreadsheetText(record.event.title),
    userName: sanitizeSpreadsheetText(studentData.name),
    status: record.status,
    checkedInAt: record.checkedInAt ? dateOnly(record.checkedInAt) : "",
    ...(record.note ? { note: sanitizeSpreadsheetText(record.note) } : {}),
  }));

  const latestXp = studentData.xpLogs[0];
  const xpLogs = latestXp
    ? [{
        userName: sanitizeSpreadsheetText(studentData.name),
        totalXP,
        source: sanitizeSpreadsheetText(latestXp.source),
        lastActivity: dateOnly(latestXp.createdAt),
      }]
    : [];

  return {
    success: true,
    role: studentData.role,
    studentName: sanitizeSpreadsheetText(studentData.name),
    studentEmail: sanitizeSpreadsheetText(studentData.email),
    organization: sanitizeSpreadsheetText(studentData.organization),
    totalXP,
    badgesCount: studentData.userBadges.length,
    courses,
    students,
    attendances,
    xpLogs,
  };
}

function groupXpByUser(records: Array<{ userId: string; points: number; source: string; createdAt: Date }>) {
  const grouped = new Map<string, { total: number; latestSource: string; latestActivity: Date }>();
  for (const record of records) {
    const existing = grouped.get(record.userId);
    if (existing) {
      existing.total += record.points;
      continue;
    }
    grouped.set(record.userId, {
      total: record.points,
      latestSource: record.source,
      latestActivity: record.createdAt,
    });
  }
  return grouped;
}

function average(values: number[]) {
  return values.length > 0
    ? Math.round(values.reduce((total, value) => total + value, 0) / values.length)
    : null;
}

function dateOnly(value: Date) {
  return value.toISOString().split("T")[0];
}
