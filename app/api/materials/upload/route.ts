import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getWritableUploadRoots, resolveUploadPath } from "@/lib/upload-storage";
import { validateFileMagicBytes } from "@/lib/file-security";
import { rateLimit } from "@/lib/rate-limit";

const uploadLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

const ALLOWED_TYPES = new Map([
  ["application/pdf", "PDF"],
  ["image/jpeg", "IMAGE"], ["image/png", "IMAGE"], ["image/webp", "IMAGE"], ["image/gif", "IMAGE"],
  ["video/mp4", "VIDEO"], ["video/webm", "VIDEO"],
  ["application/msword", "DOCUMENT"], ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "DOCUMENT"],
  ["application/vnd.ms-powerpoint", "DOCUMENT"], ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "DOCUMENT"],
  ["text/plain", "TEXT"],
]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  const ipCheck = uploadLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan unggahan. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Hanya mentor atau admin yang dapat mengunggah materi." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const lessonId = formData.get("lessonId") as string | null;
  const courseIdParam = formData.get("courseId") as string | null;
  const rawDesc = (formData.get("description") as string || "").trim();
  const rawLink = (formData.get("linkUrl") as string || "").trim();

  const description = rawDesc.replace(/<[^>]*>?/gm, "").slice(0, 1000);
  const linkUrl = rawLink.replace(/<[^>]*>?/gm, "").slice(0, 500);

  let courseId = courseIdParam;
  let existingLesson = null;

  if (lessonId && lessonId !== "new_node" && !lessonId.startsWith("tmp_")) {
    existingLesson = await prisma.courseNode.findFirst({
      where: { id: lessonId, ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}) },
      select: { id: true, type: true, course: { select: { id: true, title: true } } }
    });
    if (existingLesson) {
      courseId = existingLesson.course.id;
    }
  }

  if (!courseId) {
    return NextResponse.json({ message: "Course ID atau Lesson ID yang valid diperlukan." }, { status: 400 });
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, ...(user.role === "MENTOR" ? { mentorId: user.id } : {}) },
    select: { id: true, title: true, slug: true }
  });
  if (!course) {
    return NextResponse.json({ message: "Program tidak ditemukan atau Anda bukan mentor program ini." }, { status: 404 });
  }

  // Handle link type upload (no file needed)
  if (linkUrl && !file) {
    try {
      const parsedUrl = new URL(linkUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error("Unsupported protocol");
    } catch { return NextResponse.json({ message: "URL hanya boleh menggunakan http atau https." }, { status: 400 }); }
    
    await prisma.$transaction(async (tx) => {
      let nodeId = existingLesson?.id;
      if (existingLesson && existingLesson.type !== "FOLDER") {
        await tx.courseNode.update({
          where: { id: existingLesson.id },
          data: { fileUrl: linkUrl, fileName: linkUrl, content: description || linkUrl, description: description || linkUrl, type: "LINK" }
        });
      } else if (existingLesson && existingLesson.type === "FOLDER") {
        const createdNode = await tx.courseNode.create({
          data: { parentId: existingLesson.id, courseId, title: description || linkUrl, type: "LINK", fileUrl: linkUrl, fileName: linkUrl, fileSize: 0, description: description || linkUrl, content: description || linkUrl, order: 999 }
        });
        nodeId = createdNode.id;
      }
      if (nodeId) {
        await tx.activityLog.create({
          data: {
            userId: user.id,
            action: "ADD_MATERIAL_LINK",
            metadata: JSON.stringify({ courseId, nodeId, linkUrl })
          }
        });
      }
    });

    revalidatePath(`/belajar/${course.slug}`);
    revalidatePath(`/belajar/${courseId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/mentor/courses/${courseId}/builder`);

    return NextResponse.json({
      fileUrl: linkUrl,
      fileName: linkUrl,
      fileSize: 0,
      fileType: "LINK",
      description: description || linkUrl,
      content: description || linkUrl
    });
  }

  if (!file) return NextResponse.json({ message: "File atau URL diperlukan." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: "Ukuran file maksimal 50MB." }, { status: 400 });

  const fileType = ALLOWED_TYPES.get(file.type);
  if (!fileType) return NextResponse.json({ message: "Jenis file tidak didukung." }, { status: 400 });

  // Save outside /public so the static file server cannot bypass the
  // authorization check in /api/uploads. /tmp remains the serverless fallback.
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "material";
  const fileName = `${timestamp}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!validateFileMagicBytes(buffer, file.type)) {
    return NextResponse.json({ message: "Format isi berkas tidak sesuai dengan jenis MIME (Magic Byte Validation failed)." }, { status: 400 });
  }

  let stored = false;
  for (const root of getWritableUploadRoots()) {
    try {
      const uploadDir = resolveUploadPath(root, [courseId]);
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
      await writeFile(resolveUploadPath(root, [courseId, fileName]), buffer);
      stored = true;
      break;
    } catch {
      // Try the next configured root, normally /tmp on serverless runtimes.
    }
  }
  if (!stored) return NextResponse.json({ message: "Penyimpanan materi sedang tidak tersedia." }, { status: 503 });

  const fileUrl = `/api/uploads/${courseId}/${fileName}`;

  await prisma.$transaction(async (tx) => {
    let nodeId = existingLesson?.id;
    if (existingLesson && existingLesson.type !== "FOLDER") {
      await tx.courseNode.update({
        where: { id: existingLesson.id },
        data: {
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          type: fileType as import("@prisma/client").NodeType,
          description: description || file.name,
          content: description || file.name
        }
      });
    } else if (existingLesson && existingLesson.type === "FOLDER") {
      const createdNode = await tx.courseNode.create({
        data: { parentId: existingLesson.id, courseId, title: file.name, type: fileType as import("@prisma/client").NodeType, fileName: file.name, fileUrl, fileSize: file.size, description: description || file.name, content: description || file.name, order: 999 }
      });
      nodeId = createdNode.id;
    }
    if (nodeId) {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPLOAD_MATERIAL",
          metadata: JSON.stringify({ courseId, nodeId, fileName: file.name, fileSize: file.size, fileUrl })
        }
      });
    }
  });

  // Notify enrolled students jika materi baru diunggah in chunked batches
  const enrollments = await prisma.enrollment.findMany({ where: { courseId, status: "ACTIVE" }, select: { userId: true } });
  if (enrollments.length > 0) {
    for (let i = 0; i < enrollments.length; i += 500) {
      const batch = enrollments.slice(i, i + 500);
      await prisma.notification.createMany({
        data: batch.map(e => ({
          userId: e.userId,
          title: "Materi Baru Tersedia",
          message: `Mentor menambahkan materi baru: ${file.name}`,
          type: "MATERIAL_ADDED",
          link: `/belajar/${courseId}`
        }))
      });
    }
  }

  revalidatePath(`/belajar/${course.slug}`);
  revalidatePath(`/belajar/${courseId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/mentor/courses/${courseId}/builder`);

  return NextResponse.json({
    fileUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType,
    description: description || file.name,
    content: description || file.name
  });
}
