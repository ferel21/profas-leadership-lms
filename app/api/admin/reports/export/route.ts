import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getCurrentUser } from "@/services/auth";
import { EnrollmentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allEnrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, organization: true } },
        course: { select: { id: true, title: true, category: true } }
      }
    });

    const userIds = Array.from(new Set(allEnrollments.map(e => e.user.id)));
    const allAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        userId: { in: userIds },
        status: { in: ["GRADED", "SUBMITTED"] },
      },
      select: {
        userId: true,
        score: true,
        assessment: { select: { courseId: true, type: true } },
      },
      orderBy: { submittedAt: "desc" }
    });

    // Buat map nilai: userId_courseId_type -> score
    const scoreMap = new Map<string, number>();
    for (const attempt of allAttempts) {
      const key = `${attempt.userId}_${attempt.assessment.courseId}_${attempt.assessment.type}`;
      if (!scoreMap.has(key)) {
        scoreMap.set(key, attempt.score);
      }
    }

    // Header CSV
    const rows: string[] = [
      ["Nama Peserta", "Email", "Organisasi", "Program", "Kategori", "Progres (%)", "Pre-Test", "Post-Test", "Final", "Status"].join(",")
    ];

    // Isi CSV
    for (const e of allEnrollments) {
      const pre = scoreMap.get(`${e.user.id}_${e.course.id}_PRETEST`) ?? "-";
      const post = scoreMap.get(`${e.user.id}_${e.course.id}_POSTTEST`) ?? "-";
      const final = scoreMap.get(`${e.user.id}_${e.course.id}_FINAL`) ?? "-";
      
      const row = [
        `"${(e.user.name ?? "").replace(/"/g, '""')}"`,
        `"${e.user.email}"`,
        `"${(e.user.organization ?? "").replace(/"/g, '""')}"`,
        `"${e.course.title.replace(/"/g, '""')}"`,
        `"${(e.course.category ?? "").replace(/"/g, '""')}"`,
        e.progressPercent,
        pre,
        post,
        final,
        `"${e.status}"`
      ];
      rows.push(row.join(","));
    }

    const csvContent = rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="laporan-lms-${new Date().toISOString().split('T')[0]}.csv"`,
      }
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
