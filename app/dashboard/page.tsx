import { DashboardChrome } from "@/components/ui/DashboardChrome";
import nextDynamic from "next/dynamic";
import { getCurrentUser } from "@/services/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/services/prisma";
import Link from "next/link";
import {
  BookOpen, UsersRound, Award, ChevronRight, Activity, TrendingUp,
  Target, Clock, Star, ArrowUpRight, ArrowRight, GraduationCap,
  BookMarked, PieChart, Play
} from "lucide-react";
import Image from "next/image";
import type { ReportRow } from "@/components/shared/AdminReportTable";

const AdminReportTable = nextDynamic(() => import("@/components/shared/AdminReportTable").then(module => module.AdminReportTable));
const MentorCourseActions = nextDynamic(() => import("@/components/shared/MentorCourseActions").then(module => module.MentorCourseActions));
const AdminUserManagement = nextDynamic(() => import("@/components/shared/AdminUserManagement").then(module => module.AdminUserManagement));
const BroadcastManager = nextDynamic(() => import("@/components/shared/BroadcastManager").then(module => module.BroadcastManager));
const SuperAdminAnalyticsPanel = nextDynamic(() => import("@/components/shared/SuperAdminAnalyticsPanel").then(module => module.SuperAdminAnalyticsPanel));

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
    // Enrollment adalah entitlement peserta. Jangan auto-enroll semua course
    // yang dipublish: dashboard harus mencerminkan paket/program yang dibeli.
    const enrollments = initialEnrollments;
    const completedEnrollments = enrollments.filter(e => e.status === "COMPLETED" || e.progressPercent === 100);

    const avgProgress = average(enrollments.map(e => e.progressPercent));
    // Tampilkan semua enrollment (aktif maupun selesai) agar course tidak hilang
    const sortedEnrollments = [...enrollments].sort((a, b) => {
      // Prioritaskan yang masih aktif dan progresnya lebih tinggi
      if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
      if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
      return b.progressPercent - a.progressPercent;
    });
    const primaryEnrollment = sortedEnrollments[0];
    const otherEnrollments = sortedEnrollments.slice(1);

    return (
      <DashboardChrome user={user}>
        <div className="pf-student-dashboard">
          <h1 className="sr-only">Program saya</h1>

          {primaryEnrollment ? (
            <section className="pf-student-resume" aria-labelledby="resume-course-title">
              <div className="pf-student-resume-copy">
                <span className="pf-student-kicker">Lanjutkan belajar</span>
                <h2 id="resume-course-title">{primaryEnrollment.course.title}</h2>
                <p>
                  {primaryEnrollment.course.category} · {primaryEnrollment.course.nodes.length} materi
                </p>
                <div
                  className="pf-student-progress"
                  role="progressbar"
                  aria-label={`Progres ${primaryEnrollment.course.title}`}
                  aria-valuenow={primaryEnrollment.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <i style={{ width: `${primaryEnrollment.progressPercent}%` }} />
                </div>
                <div className="pf-student-progress-meta">
                  <span>{primaryEnrollment.progressPercent}% selesai</span>
                  <span>{primaryEnrollment.course.durationHours} jam belajar</span>
                </div>
                <Link href={`/belajar/${primaryEnrollment.course.slug}`} className="pf-student-resume-action">
                  {primaryEnrollment.progressPercent === 100 ? "Tinjau kembali" : "Lanjutkan program"}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <Link
                href={`/belajar/${primaryEnrollment.course.slug}`}
                className="pf-student-resume-visual"
                aria-label={`Buka program ${primaryEnrollment.course.title}`}
              >
                <span className="pf-student-play"><Play fill="currentColor" aria-hidden="true" /></span>
                <span className="pf-student-visual-label">
                  {primaryEnrollment.progressPercent === 100 ? "Pelajari kembali" : "Masuk ruang belajar"}
                </span>
              </Link>
            </section>
          ) : (
            <section className="pf-student-resume pf-student-resume-empty" aria-labelledby="empty-program-title">
              <div className="pf-student-resume-copy">
                <span className="pf-student-kicker">Mulai perjalanan Anda</span>
                <h2 id="empty-program-title">Pilih program kepemimpinan pertama Anda.</h2>
                <p>Temukan materi yang paling dekat dengan tantangan Anda hari ini.</p>
                <Link href="/program" className="pf-student-resume-action">
                  Jelajahi program <ArrowRight aria-hidden="true" />
                </Link>
              </div>
              <Link href="/program" className="pf-student-resume-visual" aria-label="Jelajahi katalog program">
                <span className="pf-student-play"><BookOpen aria-hidden="true" /></span>
                <span className="pf-student-visual-label">Lihat katalog</span>
              </Link>
            </section>
          )}

          <div className="pf-student-lower-grid">
            <section className="pf-student-programs" aria-labelledby="other-programs-title">
              <header className="pf-student-section-heading">
                <div>
                  <span>Ruang belajar</span>
                  <h2 id="other-programs-title">Program lainnya</h2>
                </div>
                <Link href="/program">Lihat katalog <ArrowRight aria-hidden="true" /></Link>
              </header>

              {otherEnrollments.length > 0 ? (
                <div className="pf-student-program-list">
                  {otherEnrollments.map(item => {
                    const isCompleted = item.status === "COMPLETED" || item.progressPercent === 100;
                    return (
                      <Link href={`/belajar/${item.course.slug}`} key={item.id} className="pf-student-program-row">
                        <span className="pf-student-program-thumb">
                          <Image src={item.course.image} fill alt="" sizes="64px" />
                        </span>
                        <span className="pf-student-program-copy">
                          <small>{item.course.category}</small>
                          <strong>{item.course.title}</strong>
                          <span>{item.course.nodes.length} materi · {item.course.durationHours} jam</span>
                        </span>
                        <span className="pf-student-program-state">
                          <b>{isCompleted ? "Selesai" : `${item.progressPercent}%`}</b>
                          <ChevronRight aria-hidden="true" />
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="pf-student-program-empty">
                  <BookOpen aria-hidden="true" />
                  <p>
                    {primaryEnrollment
                      ? "Program lain yang Anda ikuti akan muncul di sini."
                      : "Belum ada program yang diikuti."}
                  </p>
                </div>
              )}
            </section>

            <section className="pf-student-summary" id="sertifikat" aria-labelledby="learning-summary-title">
              <header className="pf-student-section-heading">
                <div>
                  <span>Progres Anda</span>
                  <h2 id="learning-summary-title">Ringkasan belajar</h2>
                </div>
              </header>
              <dl className="pf-student-summary-stats">
                <div><dt>Program</dt><dd>{enrollments.length}</dd></div>
                <div><dt>Rata-rata</dt><dd>{avgProgress}%</dd></div>
                <div><dt>Selesai</dt><dd>{completedEnrollments.length}</dd></div>
              </dl>

              <div className="pf-student-certificate">
                <span><Award aria-hidden="true" /></span>
                <div>
                  <small>Sertifikat</small>
                  {certificates[0] ? (
                    <>
                      <strong>{certificates[0].course.title}</strong>
                      <Link href={`/sertifikat/${certificates[0].uniqueNumber}`}>
                        Lihat sertifikat <ArrowRight aria-hidden="true" />
                      </Link>
                    </>
                  ) : (
                    <p>Tersedia setelah program selesai.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </DashboardChrome>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MENTOR DASHBOARD
  // ═══════════════════════════════════════════════════════════
  if (user.role === "MENTOR") {
    const [courses, pendingGradeCount] = await Promise.all([
      prisma.course.findMany({
        where: { mentorId: user.id },
        include: { enrollments: true, nodes: { select: { id: true, type: true, title: true } } }
      }),
      prisma.assessmentAttempt.count({
        where: { assessment: { course: { mentorId: user.id } }, status: "PENDING_GRADE" }
      })
    ]);

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
          <StatCard label="Tugas Menunggu" value={pendingGradeCount} desc="Perlu dinilai" icon={Clock} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" />
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
                    <Image src={course.image} fill alt={course.title} sizes="80px" style={{ objectFit: "cover" }} />
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
                  { href: "/forum", label: "Forum & Komunitas Belajar", icon: MessageIcon, color: "#2a6ba7" },
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
        <StatCard label="Peserta Aktif" value={activeStudentsCount} desc="Sedang aktif belajar" icon={Activity} gradient="linear-gradient(135deg, #2a6ba7, #1e5a8f)" trend="Live" />
        <StatCard label="Program Terbit" value={courseCount} desc="Dapat diakses peserta" icon={BookOpen} gradient="linear-gradient(135deg, #3b82f6, #60a5fa)" />
        <StatCard label="Sertifikat Terbit" value={certificateCount} desc="Terverifikasi publik" icon={Award} gradient="linear-gradient(135deg, #f59e0b, #fbbf24)" trend={`${graduationRate}%`} />
      </div>

      {/* ── Analytics & Admin Control System ── */}
      <SuperAdminAnalyticsPanel
        roleCounts={roleCounts.map(item => ({
          role: item.role,
          total: typeof item._count === "object" ? item._count._all ?? 0 : 0
        }))}
        userCount={userCount}
        courseCount={courseCount}
        certificateCount={certificateCount}
        activeStudentsCount={activeStudentsCount}
        avgProgress={avgProgress}
        graduationRate={graduationRate}
        enrollmentCount={enrollmentCount}
      />

      {/* Performa Platform */}
      <div className="dash-chart-card mb-6">
        <SectionTitle title="Performa Platform & Pembelajaran" subtitle="Ringkasan data kemajuan belajar seluruh peserta" />
        <div className="dash-perf-list mt-4">
          {[
            { label: "Rata-rata Progres Belajar", value: `${avgProgress}%`, pct: avgProgress, color: "#2a6ba7", icon: TrendingUp },
            { label: "Tingkat Kelulusan Alumni", value: `${graduationRate}%`, pct: graduationRate, color: "#8b5cf6", icon: GraduationCap },
            { label: "Total Pendaftaran Kelas", value: enrollmentCount, pct: Math.min(100, enrollmentCount * 2), color: "#3b82f6", icon: BookMarked },
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
