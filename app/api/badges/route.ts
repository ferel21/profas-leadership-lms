import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || user.id;

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: "desc" }
    });

    return NextResponse.json(userBadges);
  } catch {
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

// System API for awarding a badge (called by internal functions)
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { userId, badgeId } = await request.json();
    
    if (!userId || !badgeId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const userBadge = await prisma.userBadge.create({
      data: { userId, badgeId }
    });

    return NextResponse.json(userBadge);
  } catch {
    return NextResponse.json({ error: "Failed to award badge" }, { status: 500 });
  }
}
