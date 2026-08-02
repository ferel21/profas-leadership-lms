import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { generateCohortCode } from "@/services/cohort-code";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";

const codeLimiter = rateLimit({ limit: 10, windowMs: 60 * 1000 });
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses pengelolaan kohort ditolak." }, { status: 403 });
  }

  const limit = codeLimiter.check(request, user.id);
  if (!limit.success) {
    return NextResponse.json({ message: "Terlalu banyak pembuatan kode. Silakan tunggu sebentar." }, { status: 429 });
  }

  const { id } = await context.params;
  if (!z.string().min(1).max(100).safeParse(id).success) {
    return NextResponse.json({ message: "ID kohort tidak valid." }, { status: 400 });
  }

  const cohort = await prisma.cohort.findFirst({
    where: {
      id,
      ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}),
    },
    select: { id: true, status: true },
  });
  if (!cohort) return NextResponse.json({ message: "Kohort tidak ditemukan." }, { status: 404 });
  if (cohort.status === "CLOSED") {
    return NextResponse.json({ message: "Buka kembali kohort sebelum mengganti kode akses." }, { status: 409 });
  }

  const generated = generateCohortCode();
  await prisma.$transaction(async (tx) => {
    await tx.cohort.update({
      where: { id },
      data: { joinCodeHash: generated.hash, joinCodeHint: generated.hint },
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "COHORT_CODE_REGENERATE",
        metadata: JSON.stringify({ cohortId: id }),
      },
    });
  });

  return NextResponse.json({ accessCode: generated.code, hint: generated.hint });
}
