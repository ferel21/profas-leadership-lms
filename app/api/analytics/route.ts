import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const activitySchema = z.object({
  action: z.string().trim().min(1).max(80).regex(/^[\p{L}\p{N} _:-]+$/u),
  metadata: z.record(z.string(), z.union([z.string().max(300), z.number(), z.boolean(), z.null()])).optional(),
}).refine(value => !value.metadata || JSON.stringify(value.metadata).length <= 2000, "Metadata terlalu besar.");

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const parsed = activitySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Data aktivitas tidak valid." }, { status: 400 });
    const { action, metadata } = parsed.data;

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}

export async function GET() {
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
        createdAt: { gte: last30Days }
      }
    });

    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
