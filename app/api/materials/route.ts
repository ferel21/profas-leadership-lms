import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getReadableUploadRoots, resolveUploadPath, uploadSegmentsFromUrl } from "@/services/upload-storage";
import { deleteStoredObject, getObjectStorageMode } from "@/services/object-storage";
import { rateLimit } from "@/services/rate-limit";

const deleteLimiter = rateLimit({ limit: 40, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");

  const where: Prisma.CourseNodeWhereInput = { fileUrl: { not: null } };
  if (user.role === "MENTOR") where.course = { mentorId: user.id };
  if (courseId) where.courseId = courseId;
  if (lessonId) where.parentId = lessonId;

  if (user.role === "STUDENT") {
    where.course = {
      is: {
        enrollments: { some: { userId: user.id } }
      }
    };
  }

  const materials = await prisma.courseNode.findMany({
    where,
    include: {
      course: { select: { title: true, slug: true, mentor: { select: { name: true } } } },
      parent: { select: { title: true } }
    },
    orderBy: { order: "desc" }
  });

  const mapped = materials.map(m => ({
    id: m.id,
    fileName: m.fileName,
    fileUrl: m.fileUrl,
    fileSize: m.fileSize,
    fileType: m.type,
    createdAt: new Date(),
    description: m.description,
    uploader: { name: m.course?.mentor?.name || "Mentor" },
    lesson: {
      title: m.parent?.title || "Materi",
      module: { title: m.course?.title || "", course: { title: m.course?.title || "", slug: m.course?.slug || "" } }
    }
  }));

  return NextResponse.json(mapped);
}

export async function DELETE(request: Request) {
  const ipCheck = deleteLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan penghapusan. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID materi diperlukan." }, { status: 400 });

  const material = await prisma.courseNode.findFirst({
    where: { id, ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}) }
  });
  if (!material) return NextResponse.json({ message: "Materi tidak ditemukan." }, { status: 404 });

  const segments = material.type !== "LINK" && material.fileUrl
    ? uploadSegmentsFromUrl(material.fileUrl)
    : null;
  const durableObjectPath = segments?.[0] === "materials" ? segments.join("/") : null;
  if (durableObjectPath) {
    const storage = getObjectStorageMode();
    if (storage.mode === "unavailable") {
      return NextResponse.json({ message: storage.message }, { status: 503 });
    }
    if (storage.mode === "supabase") {
      try {
        await deleteStoredObject(durableObjectPath);
      } catch (error) {
        console.error("[MATERIAL_OBJECT_DELETE_ERROR]", error);
        return NextResponse.json({ message: "Berkas materi belum dapat dihapus dari penyimpanan." }, { status: 503 });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.courseNode.delete({ where: { id } });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "DELETE_MATERIAL",
        metadata: JSON.stringify({ materialId: id, fileName: material.fileName, type: material.type, courseId: material.courseId })
      }
    });
  });

  if (material.type !== "LINK" && material.fileUrl) {
    if (segments) {
      for (const root of getReadableUploadRoots()) {
        try {
          const filePath = resolveUploadPath(root, segments);
          if (existsSync(filePath)) await unlink(filePath).catch(() => {});
        } catch {
          // Ignore stale files in an unavailable storage root.
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
