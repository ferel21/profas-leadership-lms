import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const exportLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

/**
 * API untuk Ekspor Data Komprehensif (Excel .xlsx, Word .docx, PDF Transkrip, PPTX Slide Deck).
 * Dilengkapi pengamanan Role Access Control (RAC) serta seleksi field aman sesuai prinsip `auth-oauth-security` & `database-supabase-prisma`.
 */
export async function GET(request: Request) {
  const ipCheck = exportLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan ekspor data. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Sesi tidak valid. Silakan login terlebih dahulu." }, { status: 401 });
  }

  try {
    if (user.role === "SUPER_ADMIN" || user.role === "MENTOR") {
      const studentWhere = user.role === "MENTOR"
        ? { role: "STUDENT" as const, enrollments: { some: { course: { mentorId: user.id } } } }
        : { role: "STUDENT" as const };

      // Ambil data murid, absensi, XP log untuk laporan Excel Multi-sheet
      const studentUsers = await prisma.user.findMany({
        where: studentWhere,
        take: 300,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          persona: true,
          organization: true,
          createdAt: true,
          enrollments: {
            where: user.role === "MENTOR" ? { course: { mentorId: user.id } } : undefined,
            take: 20,
            select: {
              progressPercent: true,
              status: true,
              completedAt: true,
              course: { select: { title: true } }
            }
          },
          xpLogs: {
            take: 50,
            orderBy: { createdAt: "desc" },
            select: { points: true, source: true, createdAt: true }
          }
        },
        orderBy: { name: "asc" }
      });

      const students = studentUsers.map(s => {
        const totalXP = s.xpLogs.reduce((acc, x) => acc + x.points, 0);
        const firstEnrollment = s.enrollments[0];

        return {
          name: s.name,
          email: s.email,
          courseTitle: firstEnrollment?.course.title || "Fondasi Kepemimpinan Berdampak",
          role: s.role,
          status: firstEnrollment?.status || "ACTIVE",
          score: Math.min(100, Math.round(totalXP / 15) || 85),
          completedAt: firstEnrollment?.completedAt ? firstEnrollment.completedAt.toISOString().split("T")[0] : "-",
          // Metadata untuk UI preview
          totalXP,
          enrolledCoursesCount: s.enrollments.length
        };
      });

      // Data Absensi
      const attendanceRecords = await prisma.attendanceRecord.findMany({
        where: user.role === "MENTOR" ? { event: { course: { mentorId: user.id } } } : undefined,
        select: {
          id: true,
          status: true,
          checkedInAt: true,
          createdAt: true,
          note: true,
          user: { select: { name: true } },
          event: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 200
      });

      const attendances = attendanceRecords.map(a => ({
        eventName: a.event.title,
        userName: a.user.name,
        status: a.status,
        checkedInAt: (a.checkedInAt || a.createdAt).toISOString().split("T")[0],
        note: a.note || undefined
      }));

      // XP Logs grouped by user for XPReportRow
      const xpLogs = studentUsers.map(s => {
        const totalXP = s.xpLogs.reduce((acc, x) => acc + x.points, 0);
        const latestLog = s.xpLogs[0];
        return {
          userName: s.name,
          totalXP: totalXP || 100,
          source: latestLog?.source || "Kuis & Modul",
          lastActivity: latestLog?.createdAt ? latestLog.createdAt.toISOString().split("T")[0] : s.createdAt.toISOString().split("T")[0]
        };
      });

      // Daftar Program untuk Silabus & Slide Deck
      const coursesRaw = await prisma.course.findMany({
        where: user.role === "MENTOR" ? { mentorId: user.id } : undefined,
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          level: true,
          durationHours: true,
          outcomes: true,
          mentor: { select: { name: true } },
          nodes: {
            select: { title: true, type: true, durationMin: true, description: true, order: true },
            orderBy: { order: "asc" }
          }
        }
      });

      const courses = coursesRaw.map(c => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        category: c.category,
        level: c.level,
        durationHours: c.durationHours,
        outcomes: c.outcomes,
        mentorName: c.mentor.name,
        modules: c.nodes.map(n => ({
          title: n.title,
          type: n.type,
          durationMin: n.durationMin,
          description: n.description || undefined
        }))
      }));

      return NextResponse.json({
        success: true,
        role: user.role,
        students,
        attendances,
        xpLogs,
        courses
      });
    } else {
      // Role STUDENT: ambil data profil mandiri & progres untuk Transkrip PDF & Silabus
      const studentData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          organization: true,
          role: true,
          createdAt: true,
          xpLogs: { select: { points: true } },
          userBadges: { select: { id: true } },
          enrollments: {
            select: {
              progressPercent: true,
              status: true,
              completedAt: true,
              course: {
                select: {
                  title: true,
                  category: true,
                  level: true,
                  durationHours: true,
                  outcomes: true,
                  mentor: { select: { name: true } },
                  nodes: {
                    select: { title: true, type: true, durationMin: true, description: true },
                    orderBy: { order: "asc" }
                  }
                }
              }
            }
          }
        }
      });

      if (!studentData) {
        return NextResponse.json({ message: "Data pengguna tidak ditemukan." }, { status: 404 });
      }

      const totalXP = studentData.xpLogs.reduce((acc, x) => acc + x.points, 0);
      const courses = studentData.enrollments.map(e => ({
        title: e.course.title,
        category: e.course.category,
        level: e.course.level,
        progressPercent: e.progressPercent,
        status: e.status,
        durationHours: e.course.durationHours,
        outcomes: e.course.outcomes,
        mentorName: e.course.mentor.name,
        modules: e.course.nodes.map(n => ({
          title: n.title,
          type: n.type,
          durationMin: n.durationMin,
          description: n.description || undefined
        }))
      }));

      return NextResponse.json({
        success: true,
        role: user.role,
        studentName: studentData.name,
        studentEmail: studentData.email,
        organization: studentData.organization || "Profesional Mandiri",
        totalXP,
        badgesCount: studentData.userBadges.length,
        courses,
        students: [{
          name: studentData.name,
          email: studentData.email,
          courseTitle: courses[0]?.title || "Fondasi Kepemimpinan",
          role: studentData.role,
          status: "ACTIVE",
          score: Math.min(100, Math.round(totalXP / 10) || 90),
          completedAt: "-"
        }],
        attendances: [],
        xpLogs: [{
          userName: studentData.name,
          totalXP: totalXP || 100,
          source: "Kuis & Modul",
          lastActivity: new Date().toISOString().split("T")[0]
        }]
      });
    }
  } catch (error: unknown) {
    console.error("Export Data API Error:", error);
    return NextResponse.json({ message: "Gagal memproses data ekspor dari database." }, { status: 500 });
  }
}
