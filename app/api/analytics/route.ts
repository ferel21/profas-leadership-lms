import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action, metadata } = await request.json();
    
    if (!action) return NextResponse.json({ error: "Action is required" }, { status: 400 });

    const log = await prisma.activityLog.create({
      data: {
        userId: user.id,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    return NextResponse.json(log);
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
