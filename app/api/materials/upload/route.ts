import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { getWritableUploadRoots, resolveUploadPath } from "@/services/upload-storage";
import { validateFileMagicBytes } from "@/services/file-security";
import { getObjectStorageMode } from "@/services/object-storage";
import { rateLimit } from "@/services/rate-limit";
import { sanitizeMaterialDescription, validateUploadMetadata } from "@/services/upload-policy";

const uploadLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

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
  const fileValue = formData.get("file");
  const lessonValue = formData.get("lessonId");
  const courseValue = formData.get("courseId");
  const descriptionValue = formData.get("description");
  const linkValue = formData.get("linkUrl");
  const file = fileValue instanceof File ? fileValue : null;
  const lessonId = typeof lessonValue === "string" ? lessonValue.trim() : null;
  const courseIdParam = typeof courseValue === "string" ? courseValue.trim() : null;
  const rawDesc = typeof descriptionValue === "string" ? descriptionValue.trim() : "";
  const rawLink = typeof linkValue === "string" ? linkValue.trim() : "";
  const deferNodeCommit = formData.get("deferNodeCommit") === "true";

  const description = sanitizeMaterialDescription(rawDesc);
  const linkUrl = rawLink.replace(/<[^>]*>?/gm, "").slice(0, 500);

  let courseId = courseIdParam;
  let existingLesson = null;

  if (lessonId && lessonId !== "new_node" && !lessonId.startsWith("tmp_")) {
    existingLesson = await prisma.courseNode.findFirst({
      where: { id: lessonId, ...(user.role === "MENTOR" ? { course: { mentorId: user.id } } : {}) },
      select: { id: true, type: true, course: { select: { id: true, title: true } } }
    });
    if (existingLesson) {
      if (courseIdParam && courseIdParam !== existingLesson.course.id) {
        return NextResponse.json({ message: "Program dan materi tujuan tidak sesuai." }, { status: 400 });
      }
      courseId = existingLesson.course.id;
    } else {
      return NextResponse.json({ message: "Materi tujuan tidak ditemukan." }, { status: 404 });
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
        const siblingOrder = await tx.courseNode.aggregate({
          where: { courseId, parentId: existingLesson.id },
          _max: { order: true }
        });
        const createdNode = await tx.courseNode.create({
          data: {
            parentId: existingLesson.id,
            courseId,
            title: description || linkUrl,
            type: "LINK",
            fileUrl: linkUrl,
            fileName: linkUrl,
            fileSize: 0,
            description: description || linkUrl,
            content: description || linkUrl,
            order: (siblingOrder._max.order ?? -1) + 1
          }
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
  if (!deferNodeCommit && !existingLesson) {
    return NextResponse.json({ message: "Materi tujuan yang tersimpan diperlukan." }, { status: 400 });
  }

  const storage = getObjectStorageMode();
  if (storage.mode === "supabase") {
    return NextResponse.json({
      message: "Unggahan file di Vercel harus menggunakan alur unggahan langsung.",
    }, { status: 409 });
  }
  if (storage.mode === "unavailable") {
    return NextResponse.json({ message: storage.message }, { status: 503 });
  }

  const validated = validateUploadMetadata({
    purpose: "material",
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
  if (!validated.ok) return NextResponse.json({ message: validated.message }, { status: 400 });
  const fileType = validated.value.descriptor.nodeType;

  // Save outside /public so the static file server cannot bypass the
  // authorization check in /api/uploads.
  const fileName = `${randomUUID()}${validated.value.descriptor.extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!validateFileMagicBytes(buffer, validated.value.mimeType)) {
    return NextResponse.json({ message: "Format isi berkas tidak sesuai dengan jenis MIME (Magic Byte Validation failed)." }, { status: 400 });
  }

  let stored = false;
  for (const root of getWritableUploadRoots()) {
    try {
      const uploadDir = resolveUploadPath(root, ["materials", courseId]);
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
      await writeFile(resolveUploadPath(root, ["materials", courseId, fileName]), buffer);
      stored = true;
      break;
    } catch {
      // Try the next configured root, normally /tmp on serverless runtimes.
    }
  }
  if (!stored) return NextResponse.json({ message: "Penyimpanan materi sedang tidak tersedia." }, { status: 503 });

  const fileUrl = `/api/uploads/materials/${courseId}/${fileName}`;

  if (!deferNodeCommit) {
    await prisma.$transaction(async (tx) => {
      let nodeId = existingLesson?.id;
      if (existingLesson && existingLesson.type !== "FOLDER") {
        await tx.courseNode.update({
          where: { id: existingLesson.id },
          data: {
            fileUrl,
            fileName: validated.value.fileName,
            fileSize: file.size,
            type: fileType,
            description: description || validated.value.fileName,
            content: description || validated.value.fileName
          }
        });
      } else if (existingLesson && existingLesson.type === "FOLDER") {
        const siblingOrder = await tx.courseNode.aggregate({
          where: { courseId, parentId: existingLesson.id },
          _max: { order: true }
        });
        const createdNode = await tx.courseNode.create({
          data: {
            parentId: existingLesson.id,
            courseId,
            title: validated.value.fileName,
            type: fileType,
            fileName: validated.value.fileName,
            fileUrl,
            fileSize: file.size,
            description: description || validated.value.fileName,
            content: description || validated.value.fileName,
            order: (siblingOrder._max.order ?? -1) + 1
          }
        });
        nodeId = createdNode.id;
      }
      if (nodeId) {
        await tx.activityLog.create({
          data: {
            userId: user.id,
            action: "UPLOAD_MATERIAL",
            metadata: JSON.stringify({
              courseId,
              nodeId,
              fileName: validated.value.fileName,
              fileSize: file.size,
              fileUrl
            })
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
            message: `Mentor menambahkan materi baru: ${validated.value.fileName}`,
            type: "MATERIAL_ADDED",
            link: `/belajar/${course.slug}`
          }))
        });
      }
    }

    revalidatePath(`/belajar/${course.slug}`);
    revalidatePath(`/belajar/${courseId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/mentor/courses/${courseId}/builder`);
  }

  return NextResponse.json({
    fileUrl,
    fileName: validated.value.fileName,
    fileSize: file.size,
    fileType,
    description: description || validated.value.fileName,
    content: description || validated.value.fileName
  });
}
