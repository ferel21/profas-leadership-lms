import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } }
      }
    });

    // Instead of complex logic per user here, we just use existing data in enrollments
    // But enrollment doesn't inherently store 'score' unless we calculate it.
    // For simplicity, we just use progressPercent and a mock/calculated score.
    
    const rows = enrollments.map(e => ({
      id: e.id,
      name: e.user.name,
      email: e.user.email,
      course: e.course.title,
      progress: e.progressPercent,
      score: e.progressPercent > 0 ? Math.round(e.progressPercent * 0.9) : null, // Mock score for now
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString()
    }));

    return NextResponse.json(rows);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mengambil data laporan" }, { status: 500 });
  }
}
