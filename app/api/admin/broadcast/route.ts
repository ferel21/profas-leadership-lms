import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const broadcastLimiter = rateLimit({ limit: 5, windowMs: 60 * 1000 });

function sanitizeBroadcastText(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<[^>]*>?/gm, "") // strip HTML tags to prevent stored XSS / HTML injection
    .trim();
}

const broadcastSchema = z.object({
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(2000),
  targetCourseId: z.string().trim().min(1).optional(),
  link: z.string().trim().refine(value => value === "" || (value.startsWith("/") && !value.startsWith("//")), "Tautan pengumuman harus berupa path internal.").optional(),
});

export async function GET(request: Request) {
  const ipCheck = broadcastLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan riwayat pengumuman. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "MENTOR")) {
    return NextResponse.json({ message: "Akses ditolak. Hanya Admin atau Mentor yang dapat melihat riwayat pengumuman." }, { status: 403 });
  }

  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        action: "CREATE_ANNOUNCEMENT_BROADCAST",
        ...(user.role === "MENTOR" ? { userId: user.id } : {})
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        user: { select: { name: true, role: true } }
      }
    });

    const broadcasts = logs.map(l => {
      let meta: { title?: string; count?: number; targetCourseId?: string } = {};
      try {
        meta = l.metadata ? JSON.parse(l.metadata) : {};
      } catch {}
      return {
        id: l.id,
        senderName: l.user.name,
        senderRole: l.user.role,
        title: meta.title || "Pengumuman",
        recipientCount: meta.count || 0,
        targetCourseId: meta.targetCourseId || "ALL",
        sentAt: l.createdAt.toISOString()
      };
    });

    return NextResponse.json(broadcasts);
  } catch (error: unknown) {
    console.error("Get Broadcast History Error:", error);
    return NextResponse.json({ message: "Gagal mengambil riwayat pengumuman." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ipCheck = broadcastLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak pengiriman pengumuman dalam hitungan menit. Silakan tunggu sebentar." }, { status: 429 });
  }
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "MENTOR")) {
      return NextResponse.json({ message: "Akses ditolak. Hanya Admin atau Mentor yang dapat mengirim pengumuman." }, { status: 403 });
    }

    const parsed = broadcastSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: "Format pengumuman tidak valid." }, { status: 400 });
    const { title, message, targetCourseId, link } = parsed.data;

    if (user.role === "MENTOR" && (!targetCourseId || targetCourseId === "ALL")) {
      return NextResponse.json({ message: "Mentor hanya dapat mengirim pengumuman ke program miliknya." }, { status: 403 });
    }

    let targetUserIds: string[] = [];

    if (targetCourseId && targetCourseId !== "ALL") {
      const course = await prisma.course.findFirst({
        where: { id: targetCourseId, ...(user.role === "MENTOR" ? { mentorId: user.id } : {}) },
        select: { id: true },
      });
      if (!course) return NextResponse.json({ message: "Program target tidak ditemukan atau tidak dapat diakses." }, { status: 404 });

      // Broadcast ke peserta program tertentu
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: targetCourseId, status: "ACTIVE" },
        select: { userId: true }
      });
      targetUserIds = Array.from(new Set(enrollments.map(e => e.userId)));
    } else {
      // Broadcast ke seluruh peserta (STUDENT) di platform
      const students = await prisma.user.findMany({
        where: { role: "STUDENT" },
        select: { id: true }
      });
      targetUserIds = students.map(s => s.id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ message: "Tidak ada peserta yang ditemukan pada target yang dipilih." }, { status: 404 });
    }

    // MASTER SKILL: Sanitasi HTML dan Chunking Batching agar terhindar dari XSS dan overflow parameter database
    const cleanTitle = sanitizeBroadcastText(title);
    const cleanMessage = sanitizeBroadcastText(message);
    if (cleanTitle.length === 0 || cleanMessage.length === 0) {
      return NextResponse.json({ message: "Konten pengumuman tidak valid setelah pembersihan karakter berbahaya." }, { status: 400 });
    }

    const chunkSize = 500;
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < targetUserIds.length; i += chunkSize) {
        const batch = targetUserIds.slice(i, i + chunkSize);
        await tx.notification.createMany({
          data: batch.map(userId => ({
            userId,
            title: `[Pengumuman] ${cleanTitle}`,
            message: cleanMessage,
            type: "ANNOUNCEMENT",
            link: link || "/dashboard",
            read: false
          }))
        });
      }

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "CREATE_ANNOUNCEMENT_BROADCAST",
          metadata: JSON.stringify({
            title: cleanTitle,
            count: targetUserIds.length,
            targetCourseId: targetCourseId || "ALL"
          })
        }
      });
    }, { timeout: 30000 });

    return NextResponse.json({
      message: `Pengumuman berhasil dikirim ke ${targetUserIds.length} peserta.`,
      count: targetUserIds.length
    });
  } catch (error: unknown) {
    console.error("Broadcast Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan sistem saat mengirim pengumuman." }, { status: 500 });
  }
}
