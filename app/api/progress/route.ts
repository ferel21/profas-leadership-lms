import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { finalizeCourseCompletion } from "@/lib/completion";
import { rateLimit } from "@/lib/rate-limit";

const progressLimiter = rateLimit({ limit: 40, windowMs: 60 * 1000 });

const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enroll"), courseId: z.string().min(1) }),
  z.object({ action: z.literal("complete"), courseId: z.string().min(1), lessonId: z.string().min(1) }),
]);

export async function POST(request: Request) {
  const ipCheck = progressLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan progres. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Data progres tidak valid." }, { status: 400 });
  const { action, courseId } = parsed.data;
  const course = await prisma.course.findFirst({ where: { id: courseId, published: true }, select: { id: true, slug: true, price: true } });
  if (!course) return NextResponse.json({ message: "Program tidak ditemukan." }, { status: 404 });

  if (action === "enroll") {
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } }
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    if (course.price > 0) {
      const paidPayment = await prisma.payment.findFirst({
        where: { userId: user.id, courseId: course.id, status: "PAID" },
        select: { id: true },
      });
      if (!paidPayment) {
        return NextResponse.json({ message: "Program ini membutuhkan pembayaran yang terverifikasi sebelum akses diberikan." }, { status: 402 });
      }
    }

    try {
      const enrollment = await prisma.enrollment.upsert({
        where: { userId_courseId: { userId: user.id, courseId } },
        update: {},
        create: { userId: user.id, courseId }
      });
      return NextResponse.json(enrollment);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const concurrentEnrollment = await prisma.enrollment.findUnique({
          where: { userId_courseId: { userId: user.id, courseId } }
        });
        if (concurrentEnrollment) {
          return NextResponse.json(concurrentEnrollment);
        }
      }
      throw error;
    }
  }

  const { lessonId } = parsed.data;
  const [node, enrollment] = await Promise.all([
    prisma.courseNode.findFirst({ where: { id: lessonId, courseId }, select: { id: true, type: true, assessmentId: true } }),
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } }, select: { id: true } }),
  ]);
  if (!node) return NextResponse.json({ message: "Materi tidak termasuk dalam program ini." }, { status: 400 });
  if (!enrollment) return NextResponse.json({ message: "Daftar ke program sebelum menyimpan progres." }, { status: 403 });

  // MASTER SKILL: Mencegah manipulasi instan progres (Instant Progress Bypass Tampering)
  // Kuis, Tugas, Folder, dan Materi berasesmen tidak boleh ditandai selesai secara langsung via tombol lanjut progres
  if (node.type === "QUIZ" || node.type === "ASSIGNMENT" || node.type === "FOLDER" || Boolean(node.assessmentId)) {
    return NextResponse.json({ message: "Materi tipe Evaluasi/Kuis/Tugas tidak dapat diselesaikan melalui tombol progres biasa. Silakan kerjakan evaluasi terlebih dahulu." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.nodeProgress.upsert({ where: { userId_nodeId: { userId: user.id, nodeId: lessonId } }, update: {}, create: { userId: user.id, nodeId: lessonId } });
    await tx.xPLog.upsert({ where: { userId_source_sourceId: { userId: user.id, source: "LESSON_COMPLETED", sourceId: lessonId } }, update: {}, create: { userId: user.id, points: 5, source: "LESSON_COMPLETED", sourceId: lessonId } });
  });
  const result = await finalizeCourseCompletion(user.id, courseId);
  return NextResponse.json(result);
}
