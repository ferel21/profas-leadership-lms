/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CourseLevel } from "@prisma/client";

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
  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak. Hanya Mentor atau Admin yang dapat membuat program." }, { status: 403 });
  }

  try {
    const body = await request.json();
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

    if (!title || !shortDescription) {
      return NextResponse.json({ message: "Judul dan deskripsi singkat wajib diisi." }, { status: 400 });
    }

    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = "program-" + Date.now();
    
    // Check if slug exists
    const existing = await prisma.course.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Math.random().toString(36).substring(2, 7)}` : baseSlug;

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        category,
        level: level as CourseLevel,
        shortDescription,
        description: description || shortDescription,
        price: Number(price) || 0,
        durationHours: Number(durationHours) || 10,
        image: image || "/images/profas-leadership-hero.webp",
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
  } catch (err: any) {
    console.error("Create Course Error:", err);
    return NextResponse.json({ message: err.message || "Gagal membuat program." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, published, title, shortDescription, category, level, price } = body;
    if (!id) return NextResponse.json({ message: "ID program diperlukan." }, { status: 400 });

    const where: any = { id };
    if (user.role === "MENTOR") where.mentorId = user.id;

    const course = await prisma.course.findFirst({ where });
    if (!course) {
      return NextResponse.json({ message: "Program tidak ditemukan atau Anda tidak memiliki akses." }, { status: 404 });
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(typeof published === "boolean" ? { published } : {}),
        ...(title ? { title } : {}),
        ...(shortDescription ? { shortDescription } : {}),
        ...(category ? { category } : {}),
        ...(level ? { level: level as CourseLevel } : {}),
        ...(typeof price === "number" ? { price } : {})
      }
    });

    return NextResponse.json({ success: true, course: updated });
  } catch (err: any) {
    console.error("Update Course Error:", err);
    return NextResponse.json({ message: "Gagal memperbarui program." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID program diperlukan." }, { status: 400 });

  try {
    const where: any = { id };
    if (user.role === "MENTOR") where.mentorId = user.id;

    const course = await prisma.course.findFirst({ where });
    if (!course) {
      return NextResponse.json({ message: "Program tidak ditemukan atau Anda tidak memiliki hak hapus." }, { status: 404 });
    }

    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete Course Error:", err);
    return NextResponse.json({ message: "Gagal menghapus program." }, { status: 500 });
  }
}
