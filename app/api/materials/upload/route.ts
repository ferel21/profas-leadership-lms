import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

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
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ message: "Hanya mentor yang dapat mengunggah materi." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const lessonId = formData.get("lessonId") as string | null;
  const courseIdParam = formData.get("courseId") as string | null;
  const description = (formData.get("description") as string || "").trim();
  const linkUrl = (formData.get("linkUrl") as string || "").trim();

  let courseId = courseIdParam;
  let existingLesson = null;

  if (lessonId && lessonId !== "new_node" && !lessonId.startsWith("tmp_")) {
    existingLesson = await prisma.courseNode.findFirst({
      where: { id: lessonId, course: { mentorId: user.id } },
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
    where: { id: courseId, mentorId: user.id },
    select: { id: true, title: true, slug: true }
  });
  if (!course) {
    return NextResponse.json({ message: "Program tidak ditemukan atau Anda bukan mentor program ini." }, { status: 404 });
  }

  // Handle link type upload (no file needed)
  if (linkUrl && !file) {
    try { new URL(linkUrl); } catch { return NextResponse.json({ message: "URL tidak valid." }, { status: 400 }); }
    
    if (existingLesson && existingLesson.type !== "FOLDER") {
      await prisma.courseNode.update({
        where: { id: existingLesson.id },
        data: { fileUrl: linkUrl, fileName: linkUrl, content: description || linkUrl, description: description || linkUrl, type: "LINK" }
      });
    } else if (existingLesson && existingLesson.type === "FOLDER") {
      await prisma.courseNode.create({
        data: { parentId: existingLesson.id, courseId, title: description || linkUrl, type: "LINK", fileUrl: linkUrl, fileName: linkUrl, fileSize: 0, description: description || linkUrl, content: description || linkUrl, order: 999 }
      });
    }

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

  const fileType = ALLOWED_TYPES.get(file.type) || "FILE";

  // Save file dengan Fallback ke /tmp untuk Vercel Serverless
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${timestamp}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const uploadDir = join(process.cwd(), "public", "uploads", courseId);
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, fileName), buffer);
  } catch {
    // MASTER SKILL: Fallback ke /tmp jika public/uploads bersifad read-only (Vercel Serverless)
    const tmpDir = join("/tmp", "uploads", courseId);
    if (!existsSync(tmpDir)) await mkdir(tmpDir, { recursive: true });
    await writeFile(join(tmpDir, fileName), buffer);
  }

  const fileUrl = `/api/uploads/${courseId}/${fileName}`;

  if (existingLesson && existingLesson.type !== "FOLDER") {
    await prisma.courseNode.update({
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
    await prisma.courseNode.create({
      data: { parentId: existingLesson.id, courseId, title: file.name, type: fileType as import("@prisma/client").NodeType, fileName: file.name, fileUrl, fileSize: file.size, description: description || file.name, content: description || file.name, order: 999 }
    });
  }

  // Notify enrolled students jika materi baru diunggah
  const enrollments = await prisma.enrollment.findMany({ where: { courseId, status: "ACTIVE" }, select: { userId: true } });
  if (enrollments.length > 0) {
    await prisma.notification.createMany({
      data: enrollments.map(e => ({
        userId: e.userId,
        title: "Materi Baru Tersedia",
        message: `Mentor menambahkan materi baru: ${file.name}`,
        type: "MATERIAL_ADDED",
        link: `/belajar/${courseId}`
      }))
    });
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
