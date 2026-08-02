import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { generateCohortCode } from "@/services/cohort-code";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";

const mutationLimiter = rateLimit({ limit: 20, windowMs: 60 * 1000 });

const createCohortSchema = z
  .object({
    courseId: z.string().min(1),
    name: z.string().trim().min(3).max(120),
    organization: z.string().trim().max(120).optional().nullable(),
    capacity: z.coerce.number().int().min(1).max(10_000),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "Tanggal selesai harus setelah tanggal mulai.",
    path: ["endsAt"],
  });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses pengelolaan kohort ditolak." }, { status: 403 });
  }

  const cohorts = await prisma.cohort.findMany({
    where: user.role === "MENTOR" ? { course: { mentorId: user.id } } : undefined,
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      organization: true,
      capacity: true,
      startsAt: true,
      endsAt: true,
      status: true,
      joinCodeHint: true,
      createdAt: true,
      course: { select: { id: true, title: true, slug: true, published: true } },
      _count: { select: { enrollments: { where: { accessRevokedAt: null } } } },
    },
  });

  return NextResponse.json({ cohorts });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses pengelolaan kohort ditolak." }, { status: 403 });
  }

  const limit = mutationLimiter.check(request, user.id);
  if (!limit.success) {
    return NextResponse.json({ message: "Terlalu banyak perubahan kohort. Silakan tunggu sebentar." }, { status: 429 });
  }

  const parsed = createCohortSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Data kohort tidak valid." },
      { status: 400 },
    );
  }

  const course = await prisma.course.findFirst({
    where: {
      id: parsed.data.courseId,
      ...(user.role === "MENTOR" ? { mentorId: user.id } : {}),
    },
    select: { id: true, title: true },
  });
  if (!course) return NextResponse.json({ message: "Program tidak ditemukan." }, { status: 404 });

  const generated = generateCohortCode();
  const cohort = await prisma.$transaction(async (tx) => {
    const created = await tx.cohort.create({
      data: {
        courseId: course.id,
        name: parsed.data.name,
        organization: parsed.data.organization || null,
        capacity: parsed.data.capacity,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        joinCodeHash: generated.hash,
        joinCodeHint: generated.hint,
        createdById: user.id,
      },
      select: {
        id: true,
        name: true,
        organization: true,
        capacity: true,
        startsAt: true,
        endsAt: true,
        status: true,
        joinCodeHint: true,
      },
    });
    await tx.course.update({ where: { id: course.id }, data: { enrollmentMode: "CODE" } });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "COHORT_CREATE",
        metadata: JSON.stringify({ cohortId: created.id, courseId: course.id, capacity: created.capacity }),
      },
    });
    return created;
  });

  return NextResponse.json(
    { cohort: { ...cohort, course }, accessCode: generated.code },
    { status: 201 },
  );
}
