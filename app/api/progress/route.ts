import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { finalizeCourseCompletion } from "@/lib/completion";

const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("enroll"), courseId: z.string().min(1) }),
  z.object({ action: z.literal("complete"), courseId: z.string().min(1), lessonId: z.string().min(1) }),
]);

export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Data progres tidak valid." }, { status: 400 });
  const { action, courseId } = parsed.data;
  const course = await prisma.course.findFirst({ where: { id: courseId, published: true }, select: { id: true, slug: true } });
  if (!course) return NextResponse.json({ message: "Program tidak ditemukan." }, { status: 404 });

  if (action === "enroll") {
    const enrollment = await prisma.enrollment.upsert({ where: { userId_courseId: { userId: user.id, courseId } }, update: {}, create: { userId: user.id, courseId } });
    return NextResponse.json(enrollment);
  }

  const { lessonId } = parsed.data;
  const [node, enrollment] = await Promise.all([
    prisma.courseNode.findFirst({ where: { id: lessonId, courseId }, select: { id: true } }),
    prisma.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId } }, select: { id: true } }),
  ]);
  if (!node) return NextResponse.json({ message: "Materi tidak termasuk dalam program ini." }, { status: 400 });
  if (!enrollment) return NextResponse.json({ message: "Daftar ke program sebelum menyimpan progres." }, { status: 403 });

  await prisma.$transaction(async (tx) => {
    await tx.nodeProgress.upsert({ where: { userId_nodeId: { userId: user.id, nodeId: lessonId } }, update: {}, create: { userId: user.id, nodeId: lessonId } });
    await tx.xPLog.upsert({ where: { userId_source_sourceId: { userId: user.id, source: "LESSON_COMPLETED", sourceId: lessonId } }, update: {}, create: { userId: user.id, points: 5, source: "LESSON_COMPLETED", sourceId: lessonId } });
  });
  const result=await finalizeCourseCompletion(user.id,courseId);
  return NextResponse.json(result);
}
