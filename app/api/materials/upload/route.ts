import { NextResponse } from "next/server";
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
  const description = (formData.get("description") as string || "").trim();
  const linkUrl = (formData.get("linkUrl") as string || "").trim();

  if (!lessonId) return NextResponse.json({ message: "Lesson ID diperlukan." }, { status: 400 });

  // Verify lesson belongs to mentor's course
  const lesson = await prisma.courseNode.findFirst({
    where: { id: lessonId, course: { mentorId: user.id } },
    select: { id: true, course: { select: { id: true, title: true } } }
  });
  if (!lesson) {
    return NextResponse.json({ message: "Materi tidak ditemukan atau Anda bukan mentor program ini." }, { status: 404 });
  }

  // Handle link type upload (no file needed)
  if (linkUrl && !file) {
    try { new URL(linkUrl); } catch { return NextResponse.json({ message: "URL tidak valid." }, { status: 400 }); }
    const material = await prisma.courseNode.create({
      data: { parentId: lessonId, courseId: lesson.course.id, title: description || linkUrl, type: "LINK", fileUrl: linkUrl, fileName: linkUrl, fileSize: 0, description: description || linkUrl, order: 999 }
    });
    // Notify enrolled students
    const enrollments = await prisma.enrollment.findMany({ where: { courseId: lesson.course.id, status: "ACTIVE" }, select: { userId: true } });
    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map(e => ({
          userId: e.userId,
          title: "Materi Baru Tersedia",
          message: `Mentor menambahkan materi baru di ${lesson.course.title}`,
          type: "MATERIAL_ADDED",
          link: `/belajar/${lesson.course.id}`
        }))
      });
    }
    return NextResponse.json(material);
  }

  if (!file) return NextResponse.json({ message: "File atau URL diperlukan." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: "Ukuran file maksimal 50MB." }, { status: 400 });

  const fileType = ALLOWED_TYPES.get(file.type);
  if (!fileType) return NextResponse.json({ message: `Tipe file ${file.type} tidak didukung.` }, { status: 400 });

  // Save file dengan Fallback ke /tmp untuk Vercel Serverless
  const courseId = lesson.course.id;
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
  const material = await prisma.courseNode.create({
    data: { parentId: lessonId, courseId, title: file.name, type: fileType as import("@prisma/client").NodeType, fileName: file.name, fileUrl, fileSize: file.size, description, order: 999 }
  });

  // Notify enrolled students
  const enrollments = await prisma.enrollment.findMany({ where: { courseId, status: "ACTIVE" }, select: { userId: true } });
  if (enrollments.length > 0) {
    await prisma.notification.createMany({
      data: enrollments.map(e => ({
        userId: e.userId,
        title: "Materi Baru Tersedia",
        message: `Mentor menambahkan materi baru: ${file.name}`,
        type: "MATERIAL_ADDED",
        link: `/belajar/${lesson.course.id}`
      }))
    });
  }

  return NextResponse.json(material);
}
