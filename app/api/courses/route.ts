import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseLevel } from "@prisma/client";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const level = searchParams.get("level");
  const parsedLevel = z.nativeEnum(CourseLevel).safeParse(level);
  if (level && !parsedLevel.success) return NextResponse.json({ message: "Level program tidak valid." }, { status: 400 });
  const courses = await prisma.course.findMany({ where: { published: true, ...(category ? { category } : {}), ...(parsedLevel.success ? { level: parsedLevel.data } : {}) }, include: { mentor: { select: { name: true, headline: true } }, _count: { select: { enrollments: true, nodes: true } } } });
  return NextResponse.json(courses, {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" }
  });
}
