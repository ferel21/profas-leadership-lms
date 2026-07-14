import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CourseLevel } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

const courseLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export async function POST(request: Request) {
  const ipCheck = courseLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan pembuatan program. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak. Hanya Mentor atau Admin yang dapat membuat program." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Data program tidak valid." }, { status: 400 });
    }

    const {
      title,
      category = "Kepemimpinan",
      level = "BASIC",
      shortDescription,
      description,
      price = 0,
      durationHours = 10,
      image = "/images/profas-leadership-hero.webp"
    } = body;

    if (!title || typeof title !== "string" || !shortDescription || typeof shortDescription !== "string") {
      return NextResponse.json({ message: "Judul dan deskripsi singkat wajib diisi." }, { status: 400 });
    }

    const cleanTitle = title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150);
    const cleanShortDesc = shortDescription.replace(/<[^>]*>?/gm, "").trim().slice(0, 300);
    const cleanDesc = typeof description === "string" ? description.replace(/<[^>]*>?/gm, "").trim().slice(0, 5000) : cleanShortDesc;
    const cleanCategory = typeof category === "string" ? category.replace(/<[^>]*>?/gm, "").trim().slice(0, 50) : "Kepemimpinan";
    const validLevel = Object.values(CourseLevel).includes(level as CourseLevel) ? (level as CourseLevel) : CourseLevel.BASIC;

    let baseSlug = slugify(cleanTitle);
    if (!baseSlug) baseSlug = "program-" + Date.now();
    
    // Check if slug exists
    const existing = await prisma.course.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Math.random().toString(36).substring(2, 7)}` : baseSlug;

    const course = await prisma.course.create({
      data: {
        title: cleanTitle,
        slug,
        category: cleanCategory,
        level: validLevel,
        shortDescription: cleanShortDesc,
        description: cleanDesc || cleanShortDesc,
        price: Math.max(0, Number(price) || 0),
        durationHours: Math.max(1, Number(durationHours) || 10),
        image: typeof image === "string" ? image.slice(0, 300) : "/images/profas-leadership-hero.webp",
        outcomes: "Memahami kepemimpinan strategis\nMampu mengambil keputusan berbasis data\nMeningkatkan efektivitas tim",
        published: false,
        mentorId: user.id
      }
    });

    // Otomatis buatkan modul pertama (FOLDER) agar langsung siap di Course Builder
    await prisma.courseNode.create({
      data: {
        courseId: course.id,
        title: "Modul 1: Pengantar & Landasan Program",
        type: "FOLDER",
        order: 0,
        description: "Modul pendahuluan untuk materi pembelajaran"
      }
    });

    return NextResponse.json({ success: true, course });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal membuat program.";
    console.error("Create Course Error:", err);
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ipCheck = courseLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan pembaruan program. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Data program tidak valid." }, { status: 400 });
    }

    const { id, published, title, shortDescription, category, level, price } = body;
    if (!id || typeof id !== "string") return NextResponse.json({ message: "ID program diperlukan." }, { status: 400 });

    const where: Prisma.CourseWhereInput = { id };
    if (user.role === "MENTOR") where.mentorId = user.id;

    const course = await prisma.course.findFirst({ where });
    if (!course) {
      return NextResponse.json({ message: "Program tidak ditemukan atau Anda tidak memiliki akses." }, { status: 404 });
    }

    const cleanTitle = typeof title === "string" ? title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150) : undefined;
    const cleanShortDesc = typeof shortDescription === "string" ? shortDescription.replace(/<[^>]*>?/gm, "").trim().slice(0, 300) : undefined;
    const cleanCategory = typeof category === "string" ? category.replace(/<[^>]*>?/gm, "").trim().slice(0, 50) : undefined;
    const validLevel = typeof level === "string" && Object.values(CourseLevel).includes(level as CourseLevel) ? (level as CourseLevel) : undefined;

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(typeof published === "boolean" ? { published } : {}),
        ...(cleanTitle ? { title: cleanTitle } : {}),
        ...(cleanShortDesc ? { shortDescription: cleanShortDesc } : {}),
        ...(cleanCategory ? { category: cleanCategory } : {}),
        ...(validLevel ? { level: validLevel } : {}),
        ...(typeof price === "number" ? { price: Math.max(0, price) } : {})
      }
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (err: unknown) {
    console.error("Update Course Error:", err);
    return NextResponse.json({ message: "Gagal memperbarui program." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ipCheck = courseLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan penghapusan program. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID program diperlukan." }, { status: 400 });

  try {
    const where: Prisma.CourseWhereInput = { id };
    if (user.role === "MENTOR") where.mentorId = user.id;

    const course = await prisma.course.findFirst({ where });
    if (!course) {
      return NextResponse.json({ message: "Program tidak ditemukan atau Anda tidak memiliki hak hapus." }, { status: 404 });
    }

    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Delete Course Error:", err);
    return NextResponse.json({ message: "Gagal menghapus program." }, { status: 500 });
  }
}
