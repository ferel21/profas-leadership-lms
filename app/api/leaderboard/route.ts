import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Persona } from "@prisma/client";
import { z } from "zod";

export async function GET(request: Request) {
  const persona = new URL(request.url).searchParams.get("persona");
  const parsed = z.nativeEnum(Persona).nullable().safeParse(persona);
  if (!parsed.success) return NextResponse.json({ message: "Persona tidak valid." }, { status: 400 });
  const users = await prisma.user.findMany({
    where: { role: "STUDENT", ...(parsed.data ? { persona: parsed.data } : {}) },
    select: { id: true, name: true, persona: true, xpLogs: { select: { points: true } } }
  });
  const ranking = users.map(u => ({
    id: u.id,
    name: u.name,
    persona: u.persona,
    xp: u.xpLogs.reduce((a, x) => a + x.points, 0)
  })).sort((a, b) => b.xp - a.xp);

  return NextResponse.json(ranking, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" }
  });
}
