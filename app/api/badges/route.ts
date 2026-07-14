import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const badgesLimiter = rateLimit({ limit: 40, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = badgesLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan lencana." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const catalog = searchParams.get("catalog");
    if (catalog === "true") {
      const allBadges = await prisma.badge.findMany({
        orderBy: { name: "asc" }
      });
      return NextResponse.json(allBadges);
    }

    const userId = searchParams.get("userId") || user.id;
    if (userId !== user.id && user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Anda hanya dapat melihat badge milik sendiri." }, { status: 403 });
    }

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: {
        id: true,
        awardedAt: true,
        badge: { select: { id: true, name: true, description: true, imageUrl: true } },
      },
      orderBy: { awardedAt: "desc" }
    });

    return NextResponse.json(userBadges);
  } catch {
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
  }
}

// System API for awarding a badge (called by internal functions)
export async function POST(request: Request) {
  const ipCheck = badgesLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan pemberian lencana." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { userId, badgeId } = body;
    if (!userId || typeof userId !== "string" || !badgeId || typeof badgeId !== "string") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.userBadge.findFirst({
      where: { userId, badgeId }
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const userBadge = await prisma.userBadge.create({
      data: { userId, badgeId }
    });

    return NextResponse.json(userBadge, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to award badge" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ipCheck = badgesLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan penghapusan lencana." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only admins can revoke badges" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const badgeId = searchParams.get("badgeId");

    if (id) {
      await prisma.userBadge.delete({ where: { id: id.trim() } });
    } else if (userId && badgeId) {
      await prisma.userBadge.deleteMany({
        where: { userId: userId.trim(), badgeId: badgeId.trim() }
      });
    } else {
      return NextResponse.json({ error: "id atau userId + badgeId diperlukan." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to revoke badge" }, { status: 500 });
  }
}
