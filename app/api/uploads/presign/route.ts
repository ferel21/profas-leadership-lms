import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { createSignedObjectUpload, getObjectStorageMode } from "@/services/object-storage";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";
import { sanitizeMaterialDescription, validateUploadMetadata } from "@/services/upload-policy";
import { createUploadTicket } from "@/services/upload-tickets";

export const runtime = "nodejs";

const presignLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

const commonFileSchema = {
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().trim().min(1).max(191),
};

const inputSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("material"),
    ...commonFileSchema,
    courseId: z.string().trim().min(1).max(191).optional(),
    lessonId: z.string().trim().min(1).max(191),
    description: z.string().max(2000).optional().default(""),
    deferNodeCommit: z.boolean().optional().default(false),
  }),
  z.object({
    purpose: z.literal("assignment"),
    ...commonFileSchema,
    assessmentId: z.string().trim().min(1).max(191),
    attemptId: z.string().trim().min(1).max(191),
    questionId: z.string().trim().min(1).max(191),
  }),
]);

function isTemporaryLessonId(value: string) {
  return value === "new_node" || value.startsWith("tmp_");
}

export async function POST(request: Request) {
  const ipCheck = presignLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan unggahan. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Metadata unggahan tidak valid." }, { status: 400 });
  }

  const metadata = validateUploadMetadata(parsed.data);
  if (!metadata.ok) return NextResponse.json({ message: metadata.message }, { status: 400 });

  try {
    if (parsed.data.purpose === "material") {
      if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ message: "Hanya mentor atau admin yang dapat mengunggah materi." }, { status: 403 });
      }

      const requestedLessonId = parsed.data.lessonId;
      const existingLesson = isTemporaryLessonId(requestedLessonId)
        ? null
        : await prisma.courseNode.findFirst({
            where: {
              id: requestedLessonId,
              ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}),
            },
            select: { id: true, type: true, courseId: true },
          });
      if (!existingLesson && !isTemporaryLessonId(requestedLessonId)) {
        return NextResponse.json({ message: "Materi tujuan tidak ditemukan." }, { status: 404 });
      }

      const courseId = existingLesson?.courseId || parsed.data.courseId;
      if (!courseId || (parsed.data.courseId && existingLesson && parsed.data.courseId !== existingLesson.courseId)) {
        return NextResponse.json({ message: "Program dan materi tujuan tidak sesuai." }, { status: 400 });
      }
      if (!parsed.data.deferNodeCommit && !existingLesson) {
        return NextResponse.json({ message: "Materi tujuan yang tersimpan diperlukan." }, { status: 400 });
      }

      const course = await prisma.course.findFirst({
        where: { id: courseId, ...(user.role === "MENTOR" ? { mentorId: user.id } : {}) },
        select: { id: true },
      });
      if (!course) {
        return NextResponse.json({ message: "Program tidak ditemukan atau Anda bukan mentor program ini." }, { status: 404 });
      }

      const storage = getObjectStorageMode();
      if (storage.mode === "local") {
        return NextResponse.json({ mode: "local" }, { headers: { "Cache-Control": "no-store" } });
      }
      if (storage.mode === "unavailable") {
        return NextResponse.json({ message: storage.message }, { status: 503 });
      }

      const objectPath = `materials/${courseId}/${randomUUID()}${metadata.value.descriptor.extension}`;
      const ticket = await createUploadTicket({
        ticketType: "upload",
        purpose: "material",
        userId: user.id,
        objectPath,
        courseId,
        lessonId: existingLesson?.id ?? null,
        fileName: metadata.value.fileName,
        fileSize: metadata.value.fileSize,
        mimeType: metadata.value.mimeType,
        description: sanitizeMaterialDescription(parsed.data.description),
        deferNodeCommit: parsed.data.deferNodeCommit,
      });
      const uploadUrl = await createSignedObjectUpload(objectPath);

      return NextResponse.json(
        { mode: "supabase", uploadUrl, ticket },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const now = new Date();
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: parsed.data.attemptId,
        userId: user.id,
        assessmentId: parsed.data.assessmentId,
        status: "IN_PROGRESS",
      },
      select: {
        id: true,
        expiresAt: true,
        assessment: {
          select: {
            id: true,
            deadline: true,
            course: {
              select: {
                published: true,
                enrollments: {
                  where: { userId: user.id, status: { in: ["ACTIVE", "COMPLETED"] } },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
    if (!attempt || !attempt.assessment.course.published || attempt.assessment.course.enrollments.length === 0) {
      return NextResponse.json({ message: "Sesi evaluasi tidak aktif atau Anda belum terdaftar." }, { status: 403 });
    }
    if (
      !attempt.expiresAt ||
      attempt.expiresAt.getTime() + 10_000 < now.getTime() ||
      (attempt.assessment.deadline && attempt.assessment.deadline.getTime() <= now.getTime())
    ) {
      return NextResponse.json({ message: "Waktu pengumpulan evaluasi telah berakhir." }, { status: 410 });
    }

    const question = await prisma.assessmentQuestion.findFirst({
      where: {
        id: parsed.data.questionId,
        assessmentId: parsed.data.assessmentId,
        type: "FILE_UPLOAD",
      },
      select: { id: true },
    });
    if (!question) {
      return NextResponse.json({ message: "Pertanyaan unggah berkas tidak ditemukan." }, { status: 404 });
    }

    const storage = getObjectStorageMode();
    if (storage.mode === "local") {
      return NextResponse.json({ mode: "local" }, { headers: { "Cache-Control": "no-store" } });
    }
    if (storage.mode === "unavailable") {
      return NextResponse.json({ message: storage.message }, { status: 503 });
    }

    const objectPath = `assignments/${attempt.id}/${question.id}/${randomUUID()}${metadata.value.descriptor.extension}`;
    const ticket = await createUploadTicket({
      ticketType: "upload",
      purpose: "assignment",
      userId: user.id,
      objectPath,
      assessmentId: parsed.data.assessmentId,
      attemptId: attempt.id,
      questionId: question.id,
      fileName: metadata.value.fileName,
      fileSize: metadata.value.fileSize,
      mimeType: metadata.value.mimeType,
    });
    const uploadUrl = await createSignedObjectUpload(objectPath);

    return NextResponse.json(
      { mode: "supabase", uploadUrl, ticket },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[UPLOAD_PRESIGN_ERROR]", error);
    return NextResponse.json({ message: "Penyimpanan berkas sedang tidak tersedia." }, { status: 503 });
  }
}
