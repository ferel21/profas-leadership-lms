import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";
import { accessibleEnrollmentWhere } from "@/services/enrollment-access";

const startLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });
const inputSchema = z.object({ assessmentId: z.string().trim().min(1).max(191) });

function isSerializationConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export async function POST(request: Request) {
  const ipCheck = startLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak percobaan memulai evaluasi." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Evaluasi tidak valid." }, { status: 400 });

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: parsed.data.assessmentId },
      select: {
        id: true,
        deadline: true,
        timeLimitMin: true,
        course: {
          select: {
            published: true,
            enrollments: {
              where: accessibleEnrollmentWhere(user.id),
              select: { id: true },
            },
          },
        },
        _count: { select: { questions: true } },
      },
    });

    if (!assessment || !assessment.course.published || assessment._count.questions === 0) {
      return NextResponse.json({ message: "Evaluasi tidak ditemukan atau belum siap." }, { status: 404 });
    }
    if (assessment.course.enrollments.length === 0) {
      return NextResponse.json({ message: "Anda belum terdaftar pada program ini." }, { status: 403 });
    }

    const now = new Date();
    if (assessment.deadline && assessment.deadline.getTime() <= now.getTime()) {
      return NextResponse.json({ message: "Batas waktu pengumpulan evaluasi telah berakhir." }, { status: 410 });
    }

    const durationMinutes = Math.max(1, Math.min(24 * 60, assessment.timeLimitMin));
    const durationExpiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
    const expiresAt = assessment.deadline && assessment.deadline < durationExpiresAt
      ? assessment.deadline
      : durationExpiresAt;

    let attempt:
      | { id: string; startedAt: Date; expiresAt: Date | null; resumed: boolean }
      | null = null;

    // Serializable isolation prevents two concurrent start requests from
    // creating separate active attempts for the same learner and assessment.
    for (let transactionTry = 0; transactionTry < 2; transactionTry += 1) {
      try {
        attempt = await prisma.$transaction(async (tx) => {
          await tx.assessmentAttempt.updateMany({
            where: {
              userId: user.id,
              assessmentId: assessment.id,
              status: "IN_PROGRESS",
              OR: [
                { expiresAt: null },
                { expiresAt: { lte: now } },
              ],
            },
            data: {
              status: "GRADED",
              score: 0,
              passed: false,
              feedback: "Waktu pengerjaan evaluasi telah berakhir.",
              submittedAt: now,
              gradedAt: now,
            },
          });

          const existing = await tx.assessmentAttempt.findFirst({
            where: {
              userId: user.id,
              assessmentId: assessment.id,
              status: "IN_PROGRESS",
              expiresAt: { gt: now },
            },
            orderBy: { startedAt: "desc" },
            select: { id: true, startedAt: true, expiresAt: true },
          });
          if (existing) return { ...existing, resumed: true };

          const created = await tx.assessmentAttempt.create({
            data: {
              userId: user.id,
              assessmentId: assessment.id,
              status: "IN_PROGRESS",
              score: 0,
              passed: false,
              startedAt: now,
              expiresAt,
              // This field predates the attempt lifecycle and is non-nullable.
              // For IN_PROGRESS rows it records the initial lifecycle write.
              submittedAt: now,
            },
            select: { id: true, startedAt: true, expiresAt: true },
          });
          return { ...created, resumed: false };
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
        break;
      } catch (error) {
        if (transactionTry === 0 && isSerializationConflict(error)) continue;
        throw error;
      }
    }

    if (!attempt) throw new Error("ASSESSMENT_ATTEMPT_START_FAILED");

    return NextResponse.json({
      attemptId: attempt.id,
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt?.toISOString() ?? expiresAt.toISOString(),
      resumed: attempt.resumed,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[ASSESSMENT_START_ERROR]", error);
    return NextResponse.json(
      { message: "Sesi evaluasi belum dapat dimulai. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
