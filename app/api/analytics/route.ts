import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const analyticsLimiter = rateLimit({ limit: 120, windowMs: 60 * 1000 });

const activitySchema = z.object({
  action: z.string().trim().min(1).max(80).regex(/^[\p{L}\p{N} _:-]+$/u).transform(val => val.replace(/<[^>]*>?/gm, "").trim()),
  metadata: z.record(z.string(), z.union([z.string().max(300), z.number(), z.boolean(), z.null()])).optional(),
}).refine(value => !value.metadata || JSON.stringify(value.metadata).length <= 2000, "Metadata terlalu besar.");

export async function POST(request: Request) {
  const ipCheck = analyticsLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = activitySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Data aktivitas tidak valid." }, { status: 400 });
    const { action, metadata } = parsed.data;

    let cleanMetadata: Record<string, string | number | boolean | null> | null = null;
    if (metadata) {
      cleanMetadata = {};
      for (const [key, val] of Object.entries(metadata)) {
        const cleanKey = key.replace(/<[^>]*>?/gm, "").trim().slice(0, 60);
        if (typeof val === "string") {
          cleanMetadata[cleanKey] = val.replace(/<[^>]*>?/gm, "").trim().slice(0, 300);
        } else {
          cleanMetadata[cleanKey] = val;
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        metadata: cleanMetadata ? JSON.stringify(cleanMetadata) : null
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}

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
