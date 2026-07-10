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

export const dynamic = "force-dynamic";

const average = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

// ─── Komponen Metric Card Premium ────────────────────────────────────────────
function StatCard({
  label, value, desc, icon: Icon, gradient, trend
}: {
  label: string; value: string | number; desc: string;
  icon: React.ElementType; gradient: string; trend?: string;
}) {
  return (
    <div className="stat-card-clean">
      <div className="stat-card-header">
        <div className="stat-card-icon" style={{ background: gradient }}>
          <Icon size={22} color="#fff" />
        </div>
        {trend && (
          <span className="stat-card-trend">
            <ArrowUpRight size={12} /> {trend}
          </span>
        )}
      </div>
      <div>
        <div className="stat-card-value">
          {value}
        </div>
        <div className="stat-card-label">
          {label}
        </div>
        <div className="stat-card-desc">
          {desc}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="section-title-clean flex items-center justify-between">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyCard({ text, icon: Icon }: { text: string; icon?: React.ElementType }) {
  return (
    <div className="empty-card-clean">
      {Icon && (
        <div className="empty-card-icon">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      )}
      <p className="m-0">{text}</p>
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
    const [initialEnrollments, certificates] = await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
          course: {
            select: {
              id: true, slug: true, title: true, shortDescription: true, category: true, level: true, price: true, durationHours: true, rating: true, studentsCount: true, image: true,
              nodes: { where: { type: { not: "FOLDER" } }, select: { id: true } }
            }
          }
        },
        orderBy: { enrolledAt: "desc" }
      }),
      prisma.certificate.findMany({
        where: { userId: user.id },
        include: { course: { select: { id: true, title: true, slug: true, image: true } } },
        orderBy: { issuedAt: "desc" }
      })
    ]);
    let enrollments = initialEnrollments;

    // Auto-enrollment & Continuous Sync: Pastikan peserta (termasuk yang login via Google) selalu tersinkronisasi dengan semua program kepemimpinan aktif yang diterbitkan oleh mentor!
    const publishedCoursesCount = await prisma.course.count({ where: { published: true } });
    if (enrollments.length < publishedCoursesCount) {
      const publishedCourses = await prisma.course.findMany({ where: { published: true } });
      if (publishedCourses.length > 0) {
        for (const course of publishedCourses) {
          await prisma.enrollment.upsert({
            where: { userId_courseId: { userId: user.id, courseId: course.id } },
            update: {},
            create: { userId: user.id, courseId: course.id, status: "ACTIVE", progressPercent: 0 }
          });
        }
        enrollments = await prisma.enrollment.findMany({
          where: { userId: user.id },
          include: {
            course: {
              select: {
                id: true, slug: true, title: true, shortDescription: true, category: true, level: true, price: true, durationHours: true, rating: true, studentsCount: true, image: true,
                nodes: { where: { type: { not: "FOLDER" } }, select: { id: true } }
              }
            }
          },
          orderBy: { enrolledAt: "desc" }
        });
      }
    }

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
        <div className="hero-banner-student">
          <p className="eyebrow-teal" style={{ margin: "0 0 4px", opacity: 0.85 }}>
            SELAMAT DATANG KEMBALI
          </p>
          <h1 className="hero-banner-title">
            {user.name}!
          </h1>
          <p className="hero-banner-subtitle">
            Lanjutkan perjalanan kepemimpinan Anda hari ini.
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="responsive-stat-grid">
          <StatCard label="Program Diikuti" value={enrollments.length} desc="Kelas kepemimpinan aktif" icon={BookOpen} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" trend={enrollments.length > 0 ? "Aktif" : undefined} />
          <StatCard label="Sertifikat" value={certificates.length} desc="Bukti kelulusan terverifikasi" icon={Award} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" trend={certificates.length > 0 ? "Diperoleh" : undefined} />
          <StatCard label="Progres Rata-rata" value={`${avgProgress}%`} desc="Penyelesaian materi" icon={TrendingUp} gradient="linear-gradient(135deg, #6366f1, #818cf8)" />
          <StatCard label="Program Selesai" value={completedEnrollments.length} desc="Dari total program" icon={GraduationCap} gradient="linear-gradient(135deg, #10b981, #34d399)" />
        </div>

        {/* ── Executive Learning Roadmap & Career Pathway ── */}
        <div className="dash-roadmap-box">
          <SectionTitle title="Alur Kepemimpinan Eksekutif" subtitle="Jalur tahapan evolusi kepemimpinan Anda di PROFAS Institute" />
          <div className="dash-roadmap-grid">
            <div className="dash-roadmap-node active hover-lift">
              <div>
                <span className="dash-node-badge active">TAHAP 1 • AKTIF</span>
                <h4 style={{ margin: "6px 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Fondasi & Self-Leadership</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8 }}>Memimpin diri, integritas, dan kecerdasan emosional.</p>
              </div>
            </div>
            <div className="dash-roadmap-node next hover-lift">
              <div>
                <span className="dash-node-badge next">TAHAP 2 • BERIKUTNYA</span>
                <h4 style={{ margin: "6px 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Manajemen Tim & Kolaborasi</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.7 }}>Resolusi konflik, delegasi efektif, dan budaya agile.</p>
              </div>
            </div>
            <div className="dash-roadmap-node locked hover-lift">
              <div>
                <span className="dash-node-badge locked">TAHAP 3 • EKSKLUSIF</span>
                <h4 style={{ margin: "6px 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Kepemimpinan Strategis</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6 }}>Visi organisasi, manajemen perubahan, dan eksekusi.</p>
              </div>
            </div>
          </div>
          <div className="dash-roadmap-banner">
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div className="pro-shimmer-trophy" style={{ padding: "12px", borderRadius: "14px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)" }}>
                <Award size={24} color="#fff" />
              </div>
              <div>
                <h5 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>Target Kelulusan Eksekutif Anda: Certified Leadership Executive (CLE)</h5>
                <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#64748b" }}>Selesaikan seluruh modul di atas untuk mendapatkan lencana holografik dan gelar profesional kepemimpinan.</p>
              </div>
            </div>
            <Link href="/program" className="btn btn-primary btn-small hover-lift" style={{ whiteSpace: "nowrap" }}>Lihat Semua Modul</Link>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="responsive-main-grid">
          {/* Program Aktif */}
          <div className="dash-card-clean" id="program">
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
              <div className="dash-enroll-list">
                {sortedEnrollments.map(item => {
                  const isCompleted = item.status === "COMPLETED" || item.progressPercent === 100;
                  return (
                    <Link href={`/belajar/${item.course.slug}`} key={item.id} style={{ textDecoration: "none" }}>
                      <div className={`dash-enroll-item hover-lift ${isCompleted ? "completed" : ""}`}>
                        <div className="dash-enroll-thumb">
                          <Image src={item.course.image} fill alt={item.course.title} style={{ objectFit: "cover" }} />
                        </div>
                        <div className="dash-enroll-info">
                          <div className="dash-enroll-tags">
                            <span className="dash-enroll-category">
                              {item.course.category}
                            </span>
                            <span className={`dash-enroll-status ${isCompleted ? "done" : "active"}`}>
                              {isCompleted ? "✓ Selesai" : "Aktif"}
                            </span>
                          </div>
                          <h3 className="dash-enroll-title">
                            {item.course.title}
                          </h3>
                          <p className="dash-enroll-meta">
                            {item.course.nodes.length} materi • {item.course.durationHours} jam
                          </p>
                          {/* Progress bar */}
                          <div className="dash-progress-track">
                            <div className={`dash-progress-fill ${isCompleted ? "done" : "active"}`} style={{ width: `${item.progressPercent}%` }} />
                          </div>
                          <p className="dash-progress-text">
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
          <div className="dash-sidebar-col">
            {/* Sertifikat */}
            <div className="dash-card-clean" id="sertifikat">
              <SectionTitle title="Sertifikat & Pencapaian" subtitle="Lulusan terverifikasi" />
              {certificates.length === 0 ? (
                <EmptyCard text="Sertifikat muncul setelah program selesai." icon={Award} />
              ) : (
                <div className="dash-cert-list">
                  {certificates.slice(0, 3).map(cert => (
                    <div key={cert.id} className="dash-cert-mini">
                      <div className="dash-cert-mini-icon">
                        <Award size={18} color="#fff" />
                      </div>
                      <div className="dash-cert-mini-info">
                        <p className="dash-cert-mini-title">
                          {cert.course.title}
                        </p>
                        <p className="dash-cert-mini-no">
                          No: {cert.uniqueNumber}
                        </p>
                      </div>
                      <Link href={`/sertifikat/${cert.uniqueNumber}`} className="dash-cert-mini-btn">
                        Lihat
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick tip card */}
            <div className="dash-tip-card">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", position: "relative", zIndex: 1 }}>
                <div className="dash-tip-icon">
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
        <div className="hero-banner-mentor">
          <p style={{ margin: "0 0 4px", fontSize: "0.8rem", opacity: 0.8, fontWeight: 600, letterSpacing: "0.5px" }}>DASHBOARD MENTOR</p>
          <h1 className="hero-banner-title">{user.name}</h1>
          <p className="hero-banner-subtitle">Kelola materi, evaluasi tugas, dan pantau progres peserta Anda.</p>
        </div>

        <div className="responsive-stat-grid">
          <StatCard label="Program Aktif" value={courses.length} desc="Program berjalan" icon={BookOpen} gradient="linear-gradient(135deg, #3b82f6, #60a5fa)" />
          <StatCard label="Total Peserta" value={totalStudents} desc="Dalam semua program" icon={UsersRound} gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)" />
          <StatCard label="Tugas Menunggu" value={0} desc="Perlu dinilai" icon={Clock} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" />
          <StatCard label="Rating" value="4.8" desc="Rata-rata ulasan peserta" icon={Star} gradient="linear-gradient(135deg, #10b981, #34d399)" trend="Baik" />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <MentorCourseActions courses={courseOptions} />
        </div>

        <div className="responsive-main-grid">
          <div className="dash-card-clean" id="program">
            <SectionTitle title="Kurikulum & Program" subtitle="Kelola struktur materi Anda" />
            <div className="dash-enroll-list">
              {courses.map(course => (
                <div key={course.id} className="dash-mentor-course-item hover-lift">
                  <div className="dash-mentor-course-thumb">
                    <Image src={course.image} fill alt={course.title} style={{ objectFit: "cover" }} />
                  </div>
                  <div className="dash-mentor-course-info">
                    <span className="dash-mentor-course-cat">{course.category}</span>
                    <h3 className="dash-mentor-course-title">{course.title}</h3>
                    <p className="dash-mentor-course-meta">
                      {course.nodes.filter(n => n.type === "FOLDER").length} modul • {course.enrollments.length} peserta
                    </p>
                  </div>
                  <Link href={`/mentor/courses/${course.id}/builder`} className="dash-mentor-btn">
                    Buka Builder
                  </Link>
                </div>
              ))}
              {courses.length === 0 && <EmptyCard text="Belum ada program yang dibuat." icon={BookOpen} />}
            </div>
          </div>

          <div className="dash-sidebar-col">
            <div className="dash-card-clean">
              <SectionTitle title="Aksi Cepat" subtitle="Pintu akses fitur pengajaran" />
              <div className="dash-quick-list">
                {[
                  { href: "/dashboard/evaluasi", label: "Periksa Tugas & Evaluasi", icon: ClipboardIcon, color: "#3b82f6" },
                  { href: "/dashboard/peserta", label: "Pantau Progres Peserta", icon: UsersRound, color: "#8b5cf6" },
                  { href: "/forum", label: "Forum & Komunitas Belajar", icon: MessageIcon, color: "#0d9488" },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link key={href} href={href} className="dash-quick-item hover-lift">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="dash-quick-icon" style={{ background: `${color}18` }}>
                        <Icon size={15} color={color} />
                      </div>
                      {label}
                    </div>
                    <ChevronRight size={15} color="#94a3b8" />
                  </Link>
                ))}
              </div>
            </div>
            <div className="dash-tip-card-blue">
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div className="dash-tip-icon">
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
  // Pooler Supabase production memakai connection_limit=1. Jalankan seluruh
  // query read admin dalam satu transaksi agar tidak membuat tujuh checkout
  // koneksi paralel yang berisiko P2024 di serverless.
  const [userCount, courseCount, certificateCount, enrollmentCount, roleCounts, allEnrollments, allUsersList, allCoursesList] = await prisma.$transaction([
    prisma.user.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.certificate.count(),
    prisma.enrollment.count(),
    prisma.user.groupBy({ by: ["role"], orderBy: { role: "asc" }, _count: { _all: true } }),
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

  const maxRole = Math.max(...roleCounts.map(item => typeof item._count === "object" && item._count !== null ? item._count._all ?? 0 : 0), 1);
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
      <div className="hero-banner-admin">
        <div className="hero-banner-title" style={{ fontSize: "1.6rem" }}>
          Analytics & Control Center
        </div>
        <p className="hero-banner-subtitle">
          Pemantauan menyeluruh seluruh operasi LMS PROFAS Leadership.
        </p>
      </div>

      {/* ── 4 KPI Cards ── */}
      <div className="responsive-stat-grid">
        <StatCard label="Total Pengguna" value={userCount} desc="Akun terdaftar" icon={UsersRound} gradient="linear-gradient(135deg, #6d28d9, #7c3aed)" trend="+12%" />
        <StatCard label="Peserta Aktif" value={activeStudentsCount} desc="Sedang aktif belajar" icon={Activity} gradient="linear-gradient(135deg, #0d9488, #14b8a6)" trend="Live" />
        <StatCard label="Program Terbit" value={courseCount} desc="Dapat diakses peserta" icon={BookOpen} gradient="linear-gradient(135deg, #3b82f6, #60a5fa)" />
        <StatCard label="Sertifikat Terbit" value={certificateCount} desc="Terverifikasi publik" icon={Award} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" trend={`${graduationRate}%`} />
      </div>

      {/* ── Analytics Charts Row ── */}
      <div className="responsive-main-grid">
        {/* Distribusi Pengguna - Bar chart */}
        <div className="dash-chart-card">
          <SectionTitle
            title="Distribusi Pengguna"
            subtitle="Berdasarkan peran akun saat ini"
            action={<span className="badge badge-purple">{userCount} akun</span>}
          />
          <div className="dash-chart-row">
            {roleCounts.map(item => {
              const roleTotal = typeof item._count === "object" && item._count !== null ? item._count._all ?? 0 : 0;
              const pct = Math.max(10, (roleTotal / maxRole) * 100);
              const color = barColors[item.role] || "#94a3b8";
              return (
                <div key={item.role} className="dash-chart-bar-col">
                  <span className="dash-chart-bar-val">{roleTotal}</span>
                  <div className="dash-chart-bar-track" style={{ height: `${pct}%`, background: color }}>
                    <div className="dash-chart-bar-glow" />
                  </div>
                  <span className="dash-chart-bar-lbl">
                    {labels[item.role] ?? item.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performa Pembelajaran */}
        <div className="dash-chart-card">
          <SectionTitle title="Performa Platform" subtitle="Ringkasan data pembelajaran" />
          <div className="dash-perf-list">
            {[
              { label: "Rata-rata Progres", value: `${avgProgress}%`, pct: avgProgress, color: "#0d9488", icon: TrendingUp },
              { label: "Tingkat Kelulusan", value: `${graduationRate}%`, pct: graduationRate, color: "#8b5cf6", icon: GraduationCap },
              { label: "Total Pendaftaran", value: enrollmentCount, pct: Math.min(100, enrollmentCount * 2), color: "#3b82f6", icon: BookMarked },
            ].map(({ label, value, pct, color, icon: Icon }) => (
              <div key={label}>
                <div className="dash-perf-item-hdr">
                  <div className="dash-perf-item-title">
                    <div className="dash-perf-icon-box" style={{ background: `${color}18` }}>
                      <Icon size={14} color={color} />
                    </div>
                    <span className="dash-perf-lbl">{label}</span>
                  </div>
                  <span className="dash-perf-val">{value}</span>
                </div>
                <div className="dash-perf-track">
                  <div className="dash-perf-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions Admin ── */}
      <div className="dash-chart-card" style={{ marginBottom: "1.5rem" }}>
        <SectionTitle title="Aksi Cepat Admin" subtitle="Manajemen platform" />
        <div className="dash-quick-admin-grid">
          {[
            { label: "Manajemen Pengguna", icon: Users, color: "#6d28d9", desc: "Kelola akun & role" },
            { label: "Siaran Pengumuman", icon: Megaphone, color: "#0d9488", desc: "Broadcast ke peserta" },
            { label: "Laporan & Analitik", icon: BarChart3, color: "#3b82f6", desc: "Ekspor data Excel" },
            { label: "Verifikasi Sertifikat", icon: ShieldCheck, color: "#f59e0b", desc: "Cek keabsahan" },
          ].map(({ label, icon: Icon, color, desc }) => (
            <div key={label} className="dash-quick-admin-item hover-lift" style={{
              background: `${color}08`,
              border: `1px solid ${color}20`
            }}>
              <div className="dash-quick-admin-icon" style={{ background: `${color}18` }}>
                <Icon size={20} color={color} />
              </div>
              <p className="dash-quick-admin-lbl">{label}</p>
              <p className="dash-quick-admin-desc">{desc}</p>
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
