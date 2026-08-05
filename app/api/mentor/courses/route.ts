import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { CourseLevel } from "@prisma/client";
import { rateLimit } from "@/services/rate-limit";

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

const DEFAULT_OUTCOMES = [
  "Memahami kepemimpinan strategis",
  "Mampu mengambil keputusan berbasis data",
  "Meningkatkan efektivitas tim",
];

function normalizeCourseImage(value: unknown) {
  if (typeof value !== "string") return "/images/profas-leadership-hero.webp";
  const candidate = value.trim().slice(0, 300);
  if (/^\/images\/[a-zA-Z0-9._/-]+$/.test(candidate) && !candidate.includes("..")) {
    return candidate;
  }
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" && !url.username && !url.password) return url.toString();
  } catch {
    // Use the stable local artwork for malformed or unsupported values.
  }
  return "/images/profas-leadership-hero.webp";
}

function serializeOutcomes(value: unknown): string | undefined {
  let items: unknown[] = [];

  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    try {
      const parsed = JSON.parse(trimmed);
      items = Array.isArray(parsed) ? parsed : [];
    } catch {
      items = trimmed.split(/\r?\n/);
    }
  } else {
    return undefined;
  }

  const cleanItems = items
    .filter((item): item is string => typeof item === "string")
    .map(item => item.replace(/<[^>]*>?/gm, "").trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 20);

  return cleanItems.length > 0 ? JSON.stringify(cleanItems) : undefined;
}

export async function GET(request: Request) {
  const ipCheck = courseLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan program." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak." }, { status: 403 });
  }

  try {
    const where: Prisma.CourseWhereInput = user.role === "SUPER_ADMIN" ? {} : { mentorId: user.id };
    const courses = await prisma.course.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json(courses);
  } catch (err: unknown) {
    console.error("Get Courses Error:", err);
    return NextResponse.json({ message: "Gagal memuat daftar program." }, { status: 500 });
  }
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
    if (typeof level !== "string" || !Object.values(CourseLevel).includes(level as CourseLevel)) {
      return NextResponse.json({ message: "Tingkat program tidak valid." }, { status: 400 });
    }
    const validLevel = level as CourseLevel;
    const safePrice = Math.round(Math.min(1000000000, Math.max(0, Number(price) || 0)));
    const safeDuration = Math.round(Math.min(1000, Math.max(1, Number(durationHours) || 10)));

    let baseSlug = slugify(cleanTitle);
    if (!baseSlug) baseSlug = "program-" + Date.now();
    
    // Check if slug exists
    const existing = await prisma.course.findUnique({ where: { slug: baseSlug } });
    const slug = existing ? `${baseSlug}-${Math.random().toString(36).substring(2, 7)}` : baseSlug;

    const course = await prisma.$transaction(async (tx) => {
      const createdCourse = await tx.course.create({
        data: {
          title: cleanTitle,
          slug,
          category: cleanCategory,
          level: validLevel,
          shortDescription: cleanShortDesc,
          description: cleanDesc || cleanShortDesc,
          price: safePrice,
          enrollmentMode: safePrice > 0 ? "CODE" : "OPEN",
          durationHours: safeDuration,
          image: normalizeCourseImage(image),
          outcomes: JSON.stringify(DEFAULT_OUTCOMES),
          published: false,
          mentorId: user.id
        }
      });

      // Otomatis buatkan modul pertama (FOLDER) agar langsung siap di Course Builder
      await tx.courseNode.create({
        data: {
          courseId: createdCourse.id,
          title: "Modul 1: Pengantar & Landasan Program",
          type: "FOLDER",
          order: 0,
          description: "Modul pendahuluan untuk materi pembelajaran"
        }
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "CREATE_COURSE",
          metadata: JSON.stringify({ courseId: createdCourse.id, title: cleanTitle })
        }
      });

      return createdCourse;
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create Course Error:", err);
    return NextResponse.json({ message: "Gagal membuat program." }, { status: 500 });
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

    const { id, published, title, shortDescription, description, category, level, price, durationHours, image, outcomes } = body;
    if (!id || typeof id !== "string") return NextResponse.json({ message: "ID program diperlukan." }, { status: 400 });

    const where: Prisma.CourseWhereInput = { id };
    if (user.role === "MENTOR") where.mentorId = user.id;

    const course = await prisma.course.findFirst({ where });
    if (!course) {
      return NextResponse.json({ message: "Program tidak ditemukan atau Anda tidak memiliki akses." }, { status: 404 });
    }

    const cleanTitle = typeof title === "string" ? title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150) : undefined;
    const cleanShortDesc = typeof shortDescription === "string" ? shortDescription.replace(/<[^>]*>?/gm, "").trim().slice(0, 300) : undefined;
    const cleanDesc = typeof description === "string" ? description.replace(/<[^>]*>?/gm, "").trim().slice(0, 5000) : undefined;
    const cleanCategory = typeof category === "string" ? category.replace(/<[^>]*>?/gm, "").trim().slice(0, 50) : undefined;
    const cleanOutcomes = serializeOutcomes(outcomes);
    const cleanImage = image === undefined ? undefined : normalizeCourseImage(image);
    if (level !== undefined && (typeof level !== "string" || !Object.values(CourseLevel).includes(level as CourseLevel))) {
      return NextResponse.json({ message: "Tingkat program tidak valid." }, { status: 400 });
    }
    const validLevel = typeof level === "string" ? (level as CourseLevel) : undefined;

    if (published === true && !course.published) {
      // Validasi ketat dinonaktifkan sementara agar mentor bisa menerbitkan
      // program kosong untuk keperluan pengujian alur pendaftaran peserta.
      // Peserta akan melihat halaman "Materi belum tersedia" jika kosong.
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: { id },
        data: {
          ...(typeof published === "boolean" ? { published } : {}),
          ...(cleanTitle ? { title: cleanTitle } : {}),
          ...(cleanShortDesc ? { shortDescription: cleanShortDesc } : {}),
          ...(cleanDesc ? { description: cleanDesc } : {}),
          ...(cleanCategory ? { category: cleanCategory } : {}),
          ...(validLevel ? { level: validLevel } : {}),
          ...(typeof price === "number" && Number.isFinite(price)
            ? {
                price: Math.round(Math.min(1000000000, Math.max(0, price))),
                ...(price > 0 ? { enrollmentMode: "CODE" as const } : {}),
              }
            : {}),
          ...(typeof durationHours === "number" && Number.isFinite(durationHours) ? { durationHours: Math.round(Math.min(1000, Math.max(1, durationHours))) } : {}),
          ...(cleanImage ? { image: cleanImage } : {}),
          ...(cleanOutcomes ? { outcomes: cleanOutcomes } : {})
        }
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_COURSE",
          metadata: JSON.stringify({ courseId: id, title: updatedCourse.title, published: updatedCourse.published })
        }
      });

      return updatedCourse;
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

    const course = await prisma.course.findFirst({
      where,
      include: {
        _count: {
          select: {
            enrollments: true,
            payments: true,
            certificates: true,
            calendarEvents: true,
          },
        },
      },
    });
    if (!course) {
      return NextResponse.json({ message: "Program tidak ditemukan atau Anda tidak memiliki hak hapus." }, { status: 404 });
    }
    const hasOperationalHistory = course.published
      || course._count.enrollments > 0
      || course._count.payments > 0
      || course._count.certificates > 0
      || course._count.calendarEvents > 0;
    if (hasOperationalHistory) {
      return NextResponse.json({
        message: "Program yang sudah diterbitkan atau memiliki riwayat peserta tidak dapat dihapus. Nonaktifkan publikasi dan pertahankan arsipnya.",
      }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.course.delete({ where: { id } });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "DELETE_COURSE",
          metadata: JSON.stringify({ courseId: id, title: course.title })
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Delete Course Error:", err);
    return NextResponse.json({ message: "Gagal menghapus program." }, { status: 500 });
  }
}
