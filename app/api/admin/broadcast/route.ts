/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "MENTOR")) {
      return NextResponse.json({ message: "Akses ditolak. Hanya Admin atau Mentor yang dapat mengirim pengumuman." }, { status: 403 });
    }

    const body = await request.json();
    const { title, message, targetCourseId, link } = body;

    if (!title || !message) {
      return NextResponse.json({ message: "Judul dan pesan pengumuman wajib diisi." }, { status: 400 });
    }

    let targetUserIds: string[] = [];

    if (targetCourseId && targetCourseId !== "ALL") {
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

    // Buat notifikasi massal
    await prisma.notification.createMany({
      data: targetUserIds.map(userId => ({
        userId,
        title: `[Pengumuman] ${title}`,
        message,
        type: "ANNOUNCEMENT",
        link: link || "/dashboard",
        read: false
      }))
    });

    return NextResponse.json({
      message: `Pengumuman berhasil dikirim ke ${targetUserIds.length} peserta.`,
      count: targetUserIds.length
    });
  } catch (error: any) {
    console.error("Broadcast Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan sistem saat mengirim pengumuman." }, { status: 500 });
  }
}
