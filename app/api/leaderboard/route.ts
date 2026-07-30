import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { Persona } from "@prisma/client";
import { z } from "zod";
import { rateLimit } from "@/services/rate-limit";
import { getCurrentUser } from "@/services/auth";

const leaderboardLimiter = rateLimit({ limit: 60, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: "Silakan masuk untuk melihat papan peringkat." }, { status: 401 });
  }

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
    select: {
      id: true,
      name: true,
      persona: true,
      userBadges: {
        select: {
          badge: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  const totals = users.length
    ? await prisma.xPLog.groupBy({
        by: ["userId"],
        where: {
          userId: { in: users.map(user => user.id) },
          ...xpLogsWhere
        },
        _sum: { points: true }
      })
    : [];
  const xpByUser = new Map(totals.map(total => [total.userId, total._sum.points ?? 0]));

  const ranking = users.map(u => ({
    id: u.id,
    name: u.name,
    persona: u.persona,
    xp: xpByUser.get(u.id) ?? 0,
    badges: u.userBadges.map(ub => ub.badge)
  })).sort((a, b) =>
    (b.xp - a.xp)
    || a.name.localeCompare(b.name, "id-ID")
    || a.id.localeCompare(b.id)
  );

  return NextResponse.json(ranking, {
    headers: { "Cache-Control": "private, max-age=60" }
  });
}
