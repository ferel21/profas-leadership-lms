import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";
import { AttemptStatus } from "@prisma/client";

const reportsLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

function sanitizeSpreadsheetText(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.replace(/<[^>]*>?/gm, "").trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export async function GET(request: Request) {
  const ipCheck = reportsLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan data laporan. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  try {
    const { enrollments, attempts } = await prisma.$transaction(async tx => {
      const enrollmentRows = await tx.enrollment.findMany({
        take: 1000,
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          userId: true,
          courseId: true,
          progressPercent: true,
          status: true,
          enrolledAt: true,
          user: { select: { name: true, email: true } },
          course: { select: { title: true } },
        },
      });

      if (enrollmentRows.length === 0) {
        return { enrollments: enrollmentRows, attempts: [] };
      }

      const attemptRows = await tx.assessmentAttempt.findMany({
        where: {
          status: { in: [AttemptStatus.GRADED, AttemptStatus.SUBMITTED] },
          userId: { in: Array.from(new Set(enrollmentRows.map(item => item.userId))) },
          assessment: {
            courseId: { in: Array.from(new Set(enrollmentRows.map(item => item.courseId))) },
          },
        },
        orderBy: { submittedAt: "desc" },
        select: {
          userId: true,
          score: true,
          assessment: { select: { courseId: true, type: true } },
        },
      });

      return { enrollments: enrollmentRows, attempts: attemptRows };
    });

    const scoreBuckets = new Map<string, { total: number; count: number }>();
    const pretestMap = new Map<string, number>(); // key: userId:courseId
    const posttestMap = new Map<string, number>(); // key: userId:courseId
    for (const attempt of attempts) {
      const key = `${attempt.userId}:${attempt.assessment.courseId}`;
      const type = attempt.assessment.type;
      // Average score tracking
      const bucket = scoreBuckets.get(key) ?? { total: 0, count: 0 };
      bucket.total += attempt.score;
      bucket.count += 1;
      scoreBuckets.set(key, bucket);
      // Pre/post tracking (first seen = most recent due to orderBy desc)
      if (type === "PRETEST" && !pretestMap.has(key)) pretestMap.set(key, attempt.score);
      if (type === "POSTTEST" && !posttestMap.has(key)) posttestMap.set(key, attempt.score);
    }

    const rows = enrollments.map(e => ({
      id: e.id,
      userId: e.userId,
      name: sanitizeSpreadsheetText(e.user.name),
      email: sanitizeSpreadsheetText(e.user.email),
      course: sanitizeSpreadsheetText(e.course.title),
      progress: e.progressPercent,
      score: averageScore(scoreBuckets.get(`${e.userId}:${e.courseId}`)),
      pretestScore: pretestMap.get(`${e.userId}:${e.courseId}`) ?? null,
      posttestScore: posttestMap.get(`${e.userId}:${e.courseId}`) ?? null,
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString()
    }));

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" }
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mengambil data laporan" }, { status: 500 });
  }
}

function averageScore(bucket: { total: number; count: number } | undefined) {
  return bucket && bucket.count > 0 ? Math.round(bucket.total / bucket.count) : null;
}


