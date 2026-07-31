import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";
import { AttemptStatus } from "@prisma/client";

const studentReportLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

/**
 * GET /api/admin/reports/student?userId=xxx
 * Returns full progress detail for one student (for PDF generation).
 * Requires SUPER_ADMIN or MENTOR role.
 */
export async function GET(request: Request) {
  const ipCheck = studentReportLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan. Silakan tunggu sebentar." }, { status: 429 });
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "MENTOR")) {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");
  if (!targetUserId) {
    return NextResponse.json({ message: "Parameter userId diperlukan" }, { status: 400 });
  }

  try {
    const [user, enrollments, attempts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          organization: true,
        },
      }),
      prisma.enrollment.findMany({
        where: { userId: targetUserId },
        orderBy: { enrolledAt: "desc" },
        select: {
          progressPercent: true,
          status: true,
          course: {
            select: { id: true, title: true, category: true },
          },
        },
      }),
      prisma.assessmentAttempt.findMany({
        where: {
          userId: targetUserId,
          status: { in: [AttemptStatus.GRADED, AttemptStatus.SUBMITTED] },
        },
        orderBy: { submittedAt: "desc" },
        select: {
          score: true,
          assessment: { select: { courseId: true, type: true } },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: "Peserta tidak ditemukan" }, { status: 404 });
    }

    // Build scoreMap: courseId → { pre, post, final } — keep only first/best attempt per type
    const scoreMap = new Map<string, { pre: number | null; post: number | null; final: number | null }>();
    for (const attempt of attempts) {
      const cid = attempt.assessment.courseId;
      const type = attempt.assessment.type;
      if (!scoreMap.has(cid)) scoreMap.set(cid, { pre: null, post: null, final: null });
      const entry = scoreMap.get(cid)!;
      if (type === "PRETEST" && entry.pre === null) entry.pre = attempt.score;
      if (type === "POSTTEST" && entry.post === null) entry.post = attempt.score;
      if (type === "FINAL" && entry.final === null) entry.final = attempt.score;
    }

    return NextResponse.json({
      studentName: user.name ?? "Tanpa Nama",
      studentEmail: user.email,
      organization: user.organization ?? "",
      courses: enrollments.map(e => ({
        title: e.course.title,
        category: e.course.category ?? "",
        progressPercent: e.progressPercent,
        status: e.status,
        pretestScore: scoreMap.get(e.course.id)?.pre ?? null,
        posttestScore: scoreMap.get(e.course.id)?.post ?? null,
        finalScore: scoreMap.get(e.course.id)?.final ?? null,
      })),
    }, { headers: { "Cache-Control": "private, no-cache, no-store" } });
  } catch (error) {
    console.error("Student report API error:", error);
    return NextResponse.json({ message: "Gagal mengambil data peserta" }, { status: 500 });
  }
}
