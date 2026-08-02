import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/services/auth";
import { deleteStoredObject, verifyStoredObject } from "@/services/object-storage";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";
import { getUploadDescriptor } from "@/services/upload-policy";
import {
  createCommittedAssignmentTicket,
  verifyUploadTicket,
  type MaterialUploadTicketPayload,
} from "@/services/upload-tickets";
import { accessibleEnrollmentWhere, activeEnrollmentWindowWhere } from "@/services/enrollment-access";

export const runtime = "nodejs";

const commitLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });
const inputSchema = z.object({ ticket: z.string().min(20).max(10_000) });

function storedUrl(objectPath: string) {
  return `/api/uploads/${objectPath}`;
}

async function resolveMaterialTarget(user: { id: string; role: string }, ticket: MaterialUploadTicketPayload) {
  const course = await prisma.course.findFirst({
    where: {
      id: ticket.courseId,
      ...(user.role === "MENTOR" ? { mentorId: user.id } : {}),
    },
    select: { id: true, title: true, slug: true },
  });
  if (!course) return null;

  const lesson = ticket.lessonId
    ? await prisma.courseNode.findFirst({
        where: {
          id: ticket.lessonId,
          courseId: ticket.courseId,
          ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}),
        },
        select: { id: true, type: true },
      })
    : null;
  if (!ticket.deferNodeCommit && !lesson) return null;
  return { course, lesson };
}

async function commitMaterial(
  user: { id: string; role: string },
  ticket: MaterialUploadTicketPayload,
) {
  const target = await resolveMaterialTarget(user, ticket);
  if (!target) {
    return { error: "Program atau materi tujuan tidak lagi tersedia.", status: 404 } as const;
  }

  const descriptor = getUploadDescriptor("material", ticket.mimeType);
  if (!descriptor) return { error: "Jenis berkas tidak didukung.", status: 400 } as const;
  const fileUrl = storedUrl(ticket.objectPath);

  if (ticket.deferNodeCommit) {
    return {
      data: {
        fileUrl,
        fileName: ticket.fileName,
        fileSize: ticket.fileSize,
        fileType: descriptor.nodeType,
        description: ticket.description || ticket.fileName,
        content: ticket.description || ticket.fileName,
      },
    } as const;
  }

  const replay = await prisma.courseNode.findFirst({
    where: { courseId: ticket.courseId, fileUrl },
    select: { id: true },
  });
  if (!replay) {
    await prisma.$transaction(async tx => {
      let nodeId = target.lesson?.id;
      if (target.lesson && target.lesson.type !== "FOLDER") {
        await tx.courseNode.update({
          where: { id: target.lesson.id },
          data: {
            fileUrl,
            fileName: ticket.fileName,
            fileSize: ticket.fileSize,
            type: descriptor.nodeType,
            description: ticket.description || ticket.fileName,
            content: ticket.description || ticket.fileName,
          },
        });
      } else if (target.lesson?.type === "FOLDER") {
        const siblingOrder = await tx.courseNode.aggregate({
          where: { courseId: ticket.courseId, parentId: target.lesson.id },
          _max: { order: true },
        });
        const createdNode = await tx.courseNode.create({
          data: {
            parentId: target.lesson.id,
            courseId: ticket.courseId,
            title: ticket.fileName,
            type: descriptor.nodeType,
            fileName: ticket.fileName,
            fileUrl,
            fileSize: ticket.fileSize,
            description: ticket.description || ticket.fileName,
            content: ticket.description || ticket.fileName,
            order: (siblingOrder._max.order ?? -1) + 1,
          },
        });
        nodeId = createdNode.id;
      }
      if (!nodeId) throw new Error("MATERIAL_TARGET_MISSING");
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPLOAD_MATERIAL",
          metadata: JSON.stringify({
            courseId: ticket.courseId,
            nodeId,
            fileName: ticket.fileName,
            fileSize: ticket.fileSize,
            fileUrl,
          }),
        },
      });
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: ticket.courseId, ...activeEnrollmentWindowWhere() },
      select: { userId: true },
    });
    for (let index = 0; index < enrollments.length; index += 500) {
      await prisma.notification.createMany({
        data: enrollments.slice(index, index + 500).map(enrollment => ({
          userId: enrollment.userId,
          title: "Materi Baru Tersedia",
          message: `Mentor menambahkan materi baru: ${ticket.fileName}`,
          type: "MATERIAL_ADDED",
          link: `/belajar/${target.course.slug}`,
        })),
      });
    }
  }

  revalidatePath(`/belajar/${target.course.slug}`);
  revalidatePath(`/belajar/${ticket.courseId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/mentor/courses/${ticket.courseId}/builder`);

  return {
    data: {
      fileUrl,
      fileName: ticket.fileName,
      fileSize: ticket.fileSize,
      fileType: descriptor.nodeType,
      description: ticket.description || ticket.fileName,
      content: ticket.description || ticket.fileName,
    },
  } as const;
}

export async function POST(request: Request) {
  const ipCheck = commitLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak verifikasi unggahan. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Tiket unggahan tidak valid." }, { status: 400 });

  let ticket;
  try {
    ticket = await verifyUploadTicket(parsed.data.ticket);
  } catch {
    return NextResponse.json({ message: "Tiket unggahan tidak valid atau telah kedaluwarsa." }, { status: 401 });
  }
  if (ticket.userId !== user.id) {
    return NextResponse.json({ message: "Tiket unggahan bukan milik pengguna ini." }, { status: 403 });
  }

  try {
    await verifyStoredObject({
      objectPath: ticket.objectPath,
      expectedSize: ticket.fileSize,
      expectedMimeType: ticket.mimeType,
    });
  } catch (error) {
    await deleteStoredObject(ticket.objectPath).catch(() => undefined);
    console.error("[UPLOAD_OBJECT_VALIDATION_ERROR]", error);
    return NextResponse.json({
      message: error instanceof Error ? error.message : "Berkas hasil unggahan tidak valid.",
    }, { status: 400 });
  }

  try {
    if (ticket.purpose === "material") {
      if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") {
        await deleteStoredObject(ticket.objectPath).catch(() => undefined);
        return NextResponse.json({ message: "Akses unggah materi ditolak." }, { status: 403 });
      }
      const committed = await commitMaterial(user, ticket);
      if ("error" in committed) {
        await deleteStoredObject(ticket.objectPath).catch(() => undefined);
        return NextResponse.json({ message: committed.error }, { status: committed.status });
      }
      return NextResponse.json(committed.data, { headers: { "Cache-Control": "no-store" } });
    }

    const now = new Date();
    const attempt = await prisma.assessmentAttempt.findFirst({
      where: {
        id: ticket.attemptId,
        userId: user.id,
        assessmentId: ticket.assessmentId,
        status: "IN_PROGRESS",
      },
      select: {
        expiresAt: true,
        assessment: {
          select: {
            deadline: true,
            course: {
              select: {
                published: true,
                enrollments: {
                  where: accessibleEnrollmentWhere(user.id, undefined, now),
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
    const question = await prisma.assessmentQuestion.findFirst({
      where: {
        id: ticket.questionId,
        assessmentId: ticket.assessmentId,
        type: "FILE_UPLOAD",
      },
      select: { id: true },
    });
    const expired = !attempt?.expiresAt ||
      attempt.expiresAt.getTime() + 10_000 < now.getTime() ||
      Boolean(attempt.assessment.deadline && attempt.assessment.deadline.getTime() <= now.getTime());
    if (
      !attempt ||
      !question ||
      !attempt.assessment.course.published ||
      attempt.assessment.course.enrollments.length === 0 ||
      expired
    ) {
      await deleteStoredObject(ticket.objectPath).catch(() => undefined);
      return NextResponse.json({ message: "Sesi evaluasi tidak aktif atau telah berakhir." }, { status: 410 });
    }

    const uploadToken = await createCommittedAssignmentTicket({
      userId: user.id,
      objectPath: ticket.objectPath,
      assessmentId: ticket.assessmentId,
      attemptId: ticket.attemptId,
      questionId: ticket.questionId,
      fileName: ticket.fileName,
      fileSize: ticket.fileSize,
      mimeType: ticket.mimeType,
    });
    return NextResponse.json({
      fileUrl: storedUrl(ticket.objectPath),
      fileName: ticket.fileName,
      fileSize: ticket.fileSize,
      uploadToken,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[UPLOAD_COMMIT_ERROR]", error);
    return NextResponse.json({ message: "Gagal mencatat hasil unggahan." }, { status: 500 });
  }
}
