import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";

const analyticsLimiter = rateLimit({ limit: 120, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = analyticsLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const logs = await prisma.activityLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where: {
        createdAt: { gte: last30Days },
        ...(user.role === "MENTOR" ? { user: { enrollments: { some: { course: { mentorId: user.id } } } } } : {})
      }
    });

    return NextResponse.json(logs, {
      headers: { "Cache-Control": "private, max-age=60, s-maxage=60" }
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
