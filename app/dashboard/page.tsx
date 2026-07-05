/* eslint-disable @typescript-eslint/no-explicit-any */
import { DashboardChrome } from "@/components/DashboardChrome";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  BookOpen, UsersRound, Award, ChevronRight, Activity, TrendingUp,
  BarChart3, Target, Zap, Clock, Star, ArrowUpRight, GraduationCap, Users,
  Megaphone, ShieldCheck, BookMarked, PieChart
} from "lucide-react";
import Image from "next/image";
import { AdminReportTable, ReportRow } from "@/components/AdminReportTable";
import { MentorCourseActions } from "@/components/MentorCourseActions";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { BroadcastManager } from "@/components/BroadcastManager";

const average = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

// ─── Komponen Metric Card Premium ────────────────────────────────────────────
function StatCard({
  label, value, desc, icon: Icon, gradient, trend
}: {
  label: string; value: string | number; desc: string;
  icon: React.ElementType; gradient: string; trend?: string;
}) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: "20px",
      padding: "1.5rem",
      border: "1px solid #f1f5f9",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      transition: "all 0.25s ease",
      position: "relative",
      overflow: "hidden"
    }}
      className="hover-lift"
    >
      {/* Background decoration */}
      <div style={{
        position: "absolute", top: "-20px", right: "-20px",
        width: "100px", height: "100px", borderRadius: "50%",
        background: gradient, opacity: 0.06
      }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: "46px", height: "46px", borderRadius: "14px",
          background: gradient, display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: `0 4px 12px ${gradient}40`
        }}>
          <Icon size={22} color="#fff" />
        </div>
        {trend && (
          <span style={{
            fontSize: "11px", fontWeight: 700, color: "#10b981",
            background: "#ecfdf5", padding: "3px 8px", borderRadius: "20px",
            display: "flex", alignItems: "center", gap: "2px"
          }}>
            <ArrowUpRight size={11} /> {trend}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginTop: "4px" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "2px" }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyCard({ text, icon: Icon }: { text: string; icon?: React.ElementType }) {
  return (
    <div style={{
      textAlign: "center", padding: "2.5rem 1rem", color: "#94a3b8",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem"
    }}>
      {Icon && <Icon size={40} strokeWidth={1} />}
      <p style={{ margin: 0, fontSize: "0.9rem" }}>{text}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  // ═══════════════════════════════════════════════════════════
  // STUDENT DASHBOARD
  // ═══════════════════════════════════════════════════════════
  if (user.role === "STUDENT") {
    const [enrollments, certificates] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: { include: { nodes: { where: { type: { not: "FOLDER" } } } } }
        },
        orderBy: { enrolledAt: "desc" }
      }),
      prisma.certificate.findMany({
        where: { userId: user.id },
        include: { course: true },
        orderBy: { issuedAt: "desc" }
      })
    ]);

    const completedEnrollments = enrollments.filter(e => e.status === "COMPLETED" || e.progressPercent === 100);
    const existingCourseIds = new Set(certificates.map(c => c.courseId));
    for (const enr of completedEnrollments) {
      if (!existingCourseIds.has(enr.courseId)) {
        const virtualCertNumber = `PROFAS-LDR-${new Date().getFullYear()}-${enr.courseId.slice(-4).toUpperCase()}-${user.id.slice(-4).toUpperCase()}`;
        certificates.push({
          id: `virt-${enr.courseId}`, uniqueNumber: virtualCertNumber,
          issuedAt: enr.completedAt || new Date(),
          userId: user.id, courseId: enr.courseId, course: enr.course
        } as any);
      }
    }

    const avgProgress = average(enrollments.map(e => e.progressPercent));
    // Tampilkan semua enrollment (aktif maupun selesai) agar course tidak hilang
    const sortedEnrollments = [...enrollments].sort((a, b) => {
      // Prioritaskan yang masih aktif dan progresnya lebih tinggi
      if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
      if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
      return b.progressPercent - a.progressPercent;
    });

    return (
      <DashboardChrome user={user}>
        {/* ── Hero greeting ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
          borderRadius: "24px", padding: "2rem 2.5rem", marginBottom: "1.5rem",
          position: "relative", overflow: "hidden", color: "#fff"
        }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "absolute", bottom: "-60px", right: "80px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.85rem", opacity: 0.8, fontWeight: 600, letterSpacing: "0.5px" }}>
              SELAMAT DATANG KEMBALI 👋
            </p>
            <h1 style={{ margin: "0 0 6px", fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
              {user.name.split(" ")[0]}!
            </h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: "0.95rem" }}>
              Lanjutkan perjalanan kepemimpinan Anda hari ini.
            </p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }} className="responsive-stat-grid">
          <StatCard label="Program Diikuti" value={enrollments.length} desc="Kelas kepemimpinan aktif" icon={BookOpen} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" trend={enrollments.length > 0 ? "Aktif" : undefined} />
          <StatCard label="Sertifikat" value={certificates.length} desc="Bukti kelulusan terverifikasi" icon={Award} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" trend={certificates.length > 0 ? "Diperoleh" : undefined} />
          <StatCard label="Progres Rata-rata" value={`${avgProgress}%`} desc="Penyelesaian materi" icon={TrendingUp} gradient="linear-gradient(135deg, #6366f1, #818cf8)" />
          <StatCard label="Program Selesai" value={completedEnrollments.length} desc="Dari total program" icon={GraduationCap} gradient="linear-gradient(135deg, #10b981, #34d399)" />
        </div>

        {/* ── Main Content Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem" }} className="responsive-main-grid">
          {/* Program Aktif */}
          <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} id="program">
            <SectionTitle
              title="Program Aktif Anda"
              subtitle="Lanjutkan dari modul terakhir"
              action={
                <Link href="/program" style={{ fontSize: "0.82rem", color: "#0d9488", fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                  Jelajahi lebih <ChevronRight size={14} />
                </Link>
              }
            />
            {enrollments.length === 0 ? (
              <EmptyCard text="Belum ada program yang diikuti. Eksplorasi katalog program sekarang." icon={BookOpen} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {sortedEnrollments.map(item => {
                  const isCompleted = item.status === "COMPLETED" || item.progressPercent === 100;
                  return (
                    <Link href={`/belajar/${item.course.slug}`} key={item.id} style={{ textDecoration: "none" }}>
                      <div className="hover-lift" style={{
                        display: "flex", gap: "1rem", alignItems: "center",
                        padding: "1rem", borderRadius: "16px",
                        border: `1px solid ${isCompleted ? "#bbf7d0" : "#f1f5f9"}`,
                        background: isCompleted ? "#f0fdf4" : "#fafafa",
                        transition: "all 0.2s", cursor: "pointer"
                      }}>
                        <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                          <Image src={item.course.image} fill alt={item.course.title} style={{ objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#0d9488", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {item.course.category}
                            </span>
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 700, padding: "1px 7px", borderRadius: "20px",
                              background: isCompleted ? "#dcfce7" : "#dbeafe",
                              color: isCompleted ? "#15803d" : "#1d4ed8"
                            }}>
                              {isCompleted ? "✓ Selesai" : "Aktif"}
                            </span>
                          </div>
                          <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.course.title}
                          </h3>
                          <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "#64748b" }}>
                            {item.course.nodes.length} materi • {item.course.durationHours} jam
                          </p>
                          {/* Progress bar */}
                          <div style={{ height: "6px", borderRadius: "999px", background: "#e2e8f0", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${item.progressPercent}%`, background: isCompleted ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #0d9488, #14b8a6)", borderRadius: "999px" }} />
                          </div>
                          <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                            {item.progressPercent}% selesai
                          </p>
                        </div>
                        <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar kanan */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Sertifikat */}
            <div style={{ background: "#fff", borderRadius: "20px", padding: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} id="sertifikat">
              <SectionTitle title="Sertifikat & Pencapaian" subtitle="Lulusan terverifikasi" />
              {certificates.length === 0 ? (
                <EmptyCard text="Sertifikat muncul setelah program selesai." icon={Award} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {certificates.slice(0, 3).map(cert => (
                    <div key={cert.id} style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.875rem", borderRadius: "14px", background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)",
                      border: "1px solid #bbf7d0"
                    }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                        background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <Award size={18} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cert.course.title}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#64748b" }}>
                          No: {cert.uniqueNumber}
                        </p>
                      </div>
                      <Link href={`/sertifikat/${cert.uniqueNumber}`} style={{
                        fontSize: "0.72rem", fontWeight: 700, color: "#0f766e",
                        background: "#fff", padding: "4px 10px", borderRadius: "8px",
                        border: "1px solid #a7f3d0", textDecoration: "none", flexShrink: 0,
                        transition: "all 0.2s"
                      }}>
                        Lihat
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick tip card */}
            <div style={{
              background: "linear-gradient(135deg, #0f766e, #0d9488)",
              borderRadius: "20px", padding: "1.25rem", color: "#fff", position: "relative", overflow: "hidden"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", position: "relative", zIndex: 1 }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Zap size={18} color="#fef08a" />
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700, opacity: 0.9 }}>Tips Belajar Hari Ini</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8, lineHeight: 1.5 }}>
                    Dedikasikan minimal 30 menit per hari untuk meningkatkan keterampilan kepemimpinan Anda secara konsisten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardChrome>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MENTOR DASHBOARD
  // ═══════════════════════════════════════════════════════════
  if (user.role === "MENTOR") {
    const courses = await prisma.course.findMany({
      where: { mentorId: user.id },
      include: { enrollments: true, nodes: { select: { id: true, type: true, title: true } } }
    });

    const courseOptions = courses.map(c => ({
      id: c.id, title: c.title,
      nodes: c.nodes.map(n => ({ id: n.id, title: n.title, type: n.type }))
    }));

    const totalStudents = courses.reduce((a, c) => a + c.enrollments.length, 0);

    return (
      <DashboardChrome user={user}>
        {/* Hero Mentor */}
        <div style={{
          background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #60a5fa 100%)",
          borderRadius: "24px", padding: "2rem 2.5rem", marginBottom: "1.5rem",
          position: "relative", overflow: "hidden", color: "#fff"
        }}>
          <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", opacity: 0.8, fontWeight: 600, letterSpacing: "0.5px" }}>DASHBOARD MENTOR</p>
          <h1 style={{ margin: "0 0 6px", fontSize: "1.6rem", fontWeight: 800 }}>{user.name.split(" ")[0]}</h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: "0.9rem" }}>Kelola materi, evaluasi tugas, dan pantau progres peserta Anda.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }} className="responsive-stat-grid">
          <StatCard label="Program Aktif" value={courses.length} desc="Program berjalan" icon={BookOpen} gradient="linear-gradient(135deg, #3b82f6, #60a5fa)" />
          <StatCard label="Total Peserta" value={totalStudents} desc="Dalam semua program" icon={UsersRound} gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" />
          <StatCard label="Tugas Menunggu" value={0} desc="Perlu dinilai" icon={Clock} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" />
          <StatCard label="Rating" value="4.8" desc="Rata-rata ulasan peserta" icon={Star} gradient="linear-gradient(135deg, #10b981, #34d399)" trend="Baik" />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <MentorCourseActions courses={courseOptions} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }} className="responsive-main-grid">
          <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }} id="program">
            <SectionTitle title="Kurikulum & Program" subtitle="Kelola struktur materi Anda" />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {courses.map(course => (
                <div key={course.id} className="hover-lift" style={{
                  display: "flex", gap: "1rem", alignItems: "center",
                  padding: "1rem", borderRadius: "16px", border: "1px solid #f1f5f9", background: "#fafafa"
                }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, position: "relative" }}>
                    <Image src={course.image} fill alt={course.title} style={{ objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#3b82f6", textTransform: "uppercase" }}>{course.category}</span>
                    <h3 style={{ margin: "2px 0 2px", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{course.title}</h3>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                      {course.nodes.filter(n => n.type === "FOLDER").length} modul • {course.enrollments.length} peserta
                    </p>
                  </div>
                  <Link href={`/mentor/courses/${course.id}/builder`} style={{
                    padding: "8px 14px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                    color: "#fff", fontSize: "0.78rem", fontWeight: 700,
                    textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap",
                    transition: "all 0.2s"
                  }}>
                    Buka Builder
                  </Link>
                </div>
              ))}
              {courses.length === 0 && <EmptyCard text="Belum ada program yang dibuat." icon={BookOpen} />}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "#fff", borderRadius: "20px", padding: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <SectionTitle title="Aksi Cepat" subtitle="Pintu akses fitur pengajaran" />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { href: "/dashboard/evaluasi", label: "Periksa Tugas & Evaluasi", icon: ClipboardIcon, color: "#3b82f6" },
                  { href: "/dashboard/peserta", label: "Pantau Progres Peserta", icon: UsersRound, color: "#8b5cf6" },
                  { href: "/forum", label: "Forum & Komunitas Belajar", icon: MessageIcon, color: "#0d9488" },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link key={href} href={href} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: "12px", background: "#f8fafc",
                    border: "1px solid #f1f5f9", textDecoration: "none", color: "#334155",
                    fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s"
                  }} className="hover-lift">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={15} color={color} />
                      </div>
                      {label}
                    </div>
                    <ChevronRight size={15} color="#94a3b8" />
                  </Link>
                ))}
              </div>
            </div>
            <div style={{
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              borderRadius: "20px", padding: "1.25rem", color: "#fff"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Target size={18} color="#fef08a" />
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: "0.8rem", fontWeight: 700 }}>Tips Pengajaran Berdampak</p>
                  <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.85, lineHeight: 1.5 }}>
                    Berikan umpan balik yang konstruktif dan tepat waktu pada tugas peserta untuk meningkatkan retensi belajar mereka.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardChrome>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SUPER ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════
  const [userCount, courseCount, certificateCount, enrollmentCount, roleCounts, allEnrollments, allUsersList, allCoursesList] = await Promise.all([
    prisma.user.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.certificate.count(),
    prisma.enrollment.count(),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.enrollment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } }
      }
    }),
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, authProvider: true, createdAt: true,
        _count: { select: { enrollments: true, certificates: true, mentoredCourses: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.course.findMany({
      include: { nodes: { select: { id: true, type: true, title: true } } }
    })
  ]);

  const maxRole = Math.max(...roleCounts.map(item => item._count._all), 1);
  const labels: Record<string, string> = { STUDENT: "Peserta", MENTOR: "Mentor", SUPER_ADMIN: "Super Admin" };
  const barColors: Record<string, string> = { STUDENT: "#0d9488", MENTOR: "#3b82f6", SUPER_ADMIN: "#8b5cf6" };

  const reportData: ReportRow[] = allEnrollments.map(e => ({
    id: e.id, name: e.user.name, email: e.user.email,
    course: e.course.title, progress: e.progressPercent,
    score: e.progressPercent > 0 ? Math.round(e.progressPercent * 0.9) : null,
    status: e.status, enrolledAt: e.enrolledAt.toISOString()
  }));

  const activeStudentsCount = reportData.filter(r => r.progress > 0 && r.status !== "COMPLETED").length;
  const avgProgress = average(reportData.map(r => r.progress));
  const graduationRate = enrollmentCount > 0 ? Math.round((certificateCount / enrollmentCount) * 100) : 0;

  return (
    <DashboardChrome user={user}>
      {/* Hero Admin */}
      <div style={{
        background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)",
        borderRadius: "24px", padding: "2rem 2.5rem", marginBottom: "1.5rem",
        position: "relative", overflow: "hidden", color: "#fff"
      }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: "-50px", left: "40%", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "8px", padding: "4px 10px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                SUPER ADMIN
              </div>
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: "1.6rem", fontWeight: 800 }}>Analytics & Control Center</h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: "0.9rem" }}>Pemantauan menyeluruh seluruh operasi LMS PROFAS Leadership.</p>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
            borderRadius: "16px", padding: "1rem 1.5rem", border: "1px solid rgba(255,255,255,0.2)"
          }}>
            <p style={{ margin: "0 0 2px", fontSize: "0.75rem", opacity: 0.8 }}>Tingkat Kelulusan</p>
            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 800 }}>{graduationRate}%</p>
          </div>
        </div>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }} className="responsive-stat-grid">
        <StatCard label="Total Pengguna" value={userCount} desc="Akun terdaftar" icon={UsersRound} gradient="linear-gradient(135deg, #6d28d9, #7c3aed)" trend="+12%" />
        <StatCard label="Peserta Aktif" value={activeStudentsCount} desc="Sedang aktif belajar" icon={Activity} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" trend="Live" />
        <StatCard label="Program Terbit" value={courseCount} desc="Dapat diakses peserta" icon={BookOpen} gradient="linear-gradient(135deg, #3b82f6, #60a5fa)" />
        <StatCard label="Sertifikat Terbit" value={certificateCount} desc="Terverifikasi publik" icon={Award} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" trend={`${graduationRate}%`} />
      </div>

      {/* ── Analytics Charts Row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }} className="responsive-main-grid">
        {/* Distribusi Pengguna - Bar chart */}
        <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <SectionTitle
            title="Distribusi Pengguna"
            subtitle="Berdasarkan peran akun saat ini"
            action={<span style={{ fontSize: "0.8rem", fontWeight: 700, background: "#f1f5f9", color: "#6d28d9", padding: "4px 10px", borderRadius: "8px" }}>{userCount} akun</span>}
          />
          <div style={{ display: "flex", alignItems: "flex-end", gap: "1.5rem", height: "140px", marginTop: "1rem" }}>
            {roleCounts.map(item => {
              const pct = Math.max(10, (item._count._all / maxRole) * 100);
              const color = barColors[item.role] || "#94a3b8";
              return (
                <div key={item.role} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flex: 1 }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>{item._count._all}</span>
                  <div style={{
                    width: "100%", height: `${pct}%`, borderRadius: "8px 8px 0 0",
                    background: color, opacity: 0.85, transition: "height 0.8s ease",
                    position: "relative", overflow: "hidden"
                  }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.2), transparent)" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textAlign: "center" }}>
                    {labels[item.role] ?? item.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performa Pembelajaran */}
        <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <SectionTitle title="Performa Platform" subtitle="Ringkasan data pembelajaran" />
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
            {[
              { label: "Rata-rata Progres", value: `${avgProgress}%`, pct: avgProgress, color: "#0d9488", icon: TrendingUp },
              { label: "Tingkat Kelulusan", value: `${graduationRate}%`, pct: graduationRate, color: "#8b5cf6", icon: GraduationCap },
              { label: "Total Pendaftaran", value: enrollmentCount, pct: Math.min(100, enrollmentCount * 2), color: "#3b82f6", icon: BookMarked },
            ].map(({ label, value, pct, color, icon: Icon }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={14} color={color} />
                    </div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#0f172a" }}>{value}</span>
                </div>
                <div style={{ height: "8px", borderRadius: "999px", background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "999px", transition: "width 1s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions Admin ── */}
      <div style={{ background: "#fff", borderRadius: "20px", padding: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: "1.5rem" }}>
        <SectionTitle title="Aksi Cepat Admin" subtitle="Manajemen platform" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }} className="responsive-stat-grid">
          {[
            { label: "Manajemen Pengguna", icon: Users, color: "#6d28d9", desc: "Kelola akun & role" },
            { label: "Siaran Pengumuman", icon: Megaphone, color: "#0d9488", desc: "Broadcast ke peserta" },
            { label: "Laporan & Analitik", icon: BarChart3, color: "#3b82f6", desc: "Ekspor data Excel" },
            { label: "Verifikasi Sertifikat", icon: ShieldCheck, color: "#f59e0b", desc: "Cek keabsahan" },
          ].map(({ label, icon: Icon, color, desc }) => (
            <div key={label} className="hover-lift" style={{
              padding: "1rem", borderRadius: "16px", background: `${color}08`,
              border: `1px solid ${color}20`, cursor: "pointer", transition: "all 0.2s"
            }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                <Icon size={20} color={color} />
              </div>
              <p style={{ margin: "0 0 2px", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{label}</p>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <MentorCourseActions courses={allCoursesList.map(c => ({ id: c.id, title: c.title, nodes: c.nodes }))} />
      </div>

      {/* Broadcast Manager */}
      <BroadcastManager courses={allCoursesList.map(c => ({ id: c.id, title: c.title }))} />

      {/* Admin User & Role Management */}
      <AdminUserManagement initialUsers={allUsersList.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))} />

      {/* Report Table */}
      <AdminReportTable data={reportData} />
    </DashboardChrome>
  );
}

// ── Placeholder icons untuk komponen lokal ─────────────────────────────────
function ClipboardIcon({ size, color }: { size?: number; color?: string }) {
  return <Activity size={size} color={color} />;
}
function MessageIcon({ size, color }: { size?: number; color?: string }) {
  return <PieChart size={size} color={color} />;
}
