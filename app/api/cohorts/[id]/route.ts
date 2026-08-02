import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";

const updateLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });
const cohortIdSchema = z.string().min(1).max(100);
const updateCohortSchema = z
  .object({
    name: z.string().trim().min(3).max(120).optional(),
    organization: z.string().trim().max(120).nullable().optional(),
    capacity: z.coerce.number().int().min(1).max(10_000).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Tidak ada perubahan yang dikirim." });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses pengelolaan kohort ditolak." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!cohortIdSchema.safeParse(id).success) {
    return NextResponse.json({ message: "ID kohort tidak valid." }, { status: 400 });
  }

  const cohort = await prisma.cohort.findFirst({
    where: {
      id,
      ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}),
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
      createdAt: true,
      updatedAt: true,
      course: { select: { id: true, title: true, slug: true, published: true } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        select: {
          id: true,
          source: true,
          status: true,
          progressPercent: true,
          enrolledAt: true,
          completedAt: true,
          accessStartsAt: true,
          accessExpiresAt: true,
          accessRevokedAt: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
    },
  });

  if (!cohort) return NextResponse.json({ message: "Kohort tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ cohort });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses pengelolaan kohort ditolak." }, { status: 403 });
  }

  const limit = updateLimiter.check(request, user.id);
  if (!limit.success) {
    return NextResponse.json({ message: "Terlalu banyak perubahan kohort. Silakan tunggu sebentar." }, { status: 429 });
  }

  const [{ id }, parsed] = await Promise.all([
    context.params,
    request.json().catch(() => null).then((body) => updateCohortSchema.safeParse(body)),
  ]);
  if (!cohortIdSchema.safeParse(id).success) {
    return NextResponse.json({ message: "ID kohort tidak valid." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Data kohort tidak valid." },
      { status: 400 },
    );
  }

  const current = await prisma.cohort.findFirst({
    where: {
      id,
      ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}),
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      capacity: true,
      joinCodeHash: true,
      _count: { select: { enrollments: { where: { accessRevokedAt: null } } } },
    },
  });
  if (!current) return NextResponse.json({ message: "Kohort tidak ditemukan." }, { status: 404 });

  const startsAt = parsed.data.startsAt ?? current.startsAt;
  const endsAt = parsed.data.endsAt ?? current.endsAt;
  const capacity = parsed.data.capacity ?? current.capacity;
  if (endsAt <= startsAt) {
    return NextResponse.json({ message: "Tanggal selesai harus setelah tanggal mulai." }, { status: 400 });
  }
  if (capacity < current._count.enrollments) {
    return NextResponse.json(
      { message: `Kapasitas minimal ${current._count.enrollments}, sesuai jumlah anggota aktif saat ini.` },
      { status: 409 },
    );
  }
  if (parsed.data.status === "ACTIVE" && !current.joinCodeHash) {
    return NextResponse.json({ message: "Buat kode akses sebelum mengaktifkan kohort." }, { status: 409 });
  }
  if (parsed.data.status === "ACTIVE" && endsAt <= new Date()) {
    return NextResponse.json({ message: "Kohort yang periodenya berakhir tidak dapat diaktifkan." }, { status: 409 });
  }

  const periodChanged = Boolean(parsed.data.startsAt || parsed.data.endsAt);
  const cohort = await prisma.$transaction(async (tx) => {
    const updated = await tx.cohort.update({
      where: { id },
      data: {
        ...parsed.data,
        organization: parsed.data.organization === "" ? null : parsed.data.organization,
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
    if (periodChanged) {
      await tx.enrollment.updateMany({
        where: { cohortId: id },
        data: { accessStartsAt: startsAt, accessExpiresAt: endsAt },
      });
    }
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "COHORT_UPDATE",
        metadata: JSON.stringify({ cohortId: id, fields: Object.keys(parsed.data) }),
      },
    });
    return updated;
  });

  return NextResponse.json({ cohort });
}
