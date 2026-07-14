import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const reportsLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

function sanitizeSpreadsheetText(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const trimmed = value.replace(/<[^>]*>?/gm, "").trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

export async function GET(request: Request) {
  const ipCheck = reportsLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan data laporan. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  try {
    const enrollments = await prisma.enrollment.findMany({
      take: 1000,
      orderBy: { enrolledAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } }
      }
    });

    const rows = enrollments.map(e => ({
      id: e.id,
      name: sanitizeSpreadsheetText(e.user.name),
      email: sanitizeSpreadsheetText(e.user.email),
      course: sanitizeSpreadsheetText(e.course.title),
      progress: e.progressPercent,
      score: e.progressPercent > 0 ? Math.round(e.progressPercent * 0.9) : null,
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString()
    }));

    return NextResponse.json(rows, {
      headers: { "Cache-Control": "private, no-cache, no-store, must-revalidate" }
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mengambil data laporan" }, { status: 500 });
  }
}
