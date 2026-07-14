import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CourseLevel } from "@prisma/client";
import { z } from "zod";
import { cachedQuery } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const coursesLimiter = rateLimit({ limit: 60, windowMs: 60 * 1000 });

const getPublicCourses = cachedQuery(
  async (category: string | null, level: CourseLevel | null) => prisma.course.findMany({
    where: {
      published: true,
      ...(category ? { category } : {}),
      ...(level ? { level } : {}),
    },
    include: {
      mentor: { select: { name: true, headline: true } },
      _count: { select: { enrollments: true, nodes: true } },
    },
  }),
  ["public-course-catalog"],
  60,
);

export async function GET(request: Request) {
  const ipCheck = coursesLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan katalog program." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const level = searchParams.get("level");
  const parsedLevel = z.nativeEnum(CourseLevel).safeParse(level);
  if (level && !parsedLevel.success) return NextResponse.json({ message: "Level program tidak valid." }, { status: 400 });

  try {
    const courses = await getPublicCourses(category, parsedLevel.success ? parsedLevel.data : null);
    return NextResponse.json(courses, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=60" }
    });
  } catch (err: unknown) {
    console.warn("[PUBLIC_COURSES_FALLBACK] Database unreachable, returning fallback catalog:", err);
    return NextResponse.json([], {
      status: 200,
      headers: { "Cache-Control": "public, max-age=15, s-maxage=15" }
    });
  }
}
