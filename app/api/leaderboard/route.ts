import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Persona } from "@prisma/client";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const leaderboardLimiter = rateLimit({ limit: 60, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = leaderboardLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan papan peringkat. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const persona = searchParams.get("persona");
  const parsed = z.nativeEnum(Persona).nullable().safeParse(persona);
  if (!parsed.success) return NextResponse.json({ message: "Persona tidak valid." }, { status: 400 });

  const timeframe = searchParams.get("timeframe")?.trim().toLowerCase() || "all";
  if (timeframe !== "all" && timeframe !== "weekly" && timeframe !== "monthly") {
    return NextResponse.json({ message: "Parameter timeframe tidak valid (pilihan: all, weekly, monthly)." }, { status: 400 });
  }

  let xpLogsWhere: { createdAt?: { gte: Date } } | undefined = undefined;
  if (timeframe === "weekly") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    xpLogsWhere = { createdAt: { gte: sevenDaysAgo } };
  } else if (timeframe === "monthly") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    xpLogsWhere = { createdAt: { gte: thirtyDaysAgo } };
  }

  const users = await prisma.user.findMany({
    where: { role: "STUDENT", ...(parsed.data ? { persona: parsed.data } : {}) },
    take: 200,
    select: {
      id: true,
      name: true,
      persona: true,
      avatar: true,
      xpLogs: { where: xpLogsWhere, select: { points: true } },
      userBadges: {
        include: {
          badge: {
            select: { id: true, name: true, description: true, imageUrl: true }
          }
        }
      }
    }
  });

  const ranking = users.map(u => ({
    id: u.id,
    name: u.name,
    persona: u.persona,
    avatar: u.avatar,
    xp: u.xpLogs.reduce((a, x) => a + x.points, 0),
    badges: u.userBadges.map(ub => ub.badge)
  })).sort((a, b) => b.xp - a.xp).slice(0, 100);

  return NextResponse.json(ranking, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" }
  });
}
