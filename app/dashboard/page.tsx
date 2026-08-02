import { DashboardChrome } from "@/components/ui/DashboardChrome";
import nextDynamic from "next/dynamic";
import { getCurrentUser } from "@/services/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/services/prisma";
import Link from "next/link";
import {
  BookOpen, UsersRound, Award, ChevronRight, Activity, TrendingUp,
  Clock, ArrowRight, GraduationCap, BookMarked, Play, FileCheck2,
  CalendarDays, ClipboardCheck, BarChart3, MessageSquare, ShieldCheck
} from "lucide-react";
import Image from "next/image";
import type { ReportRow } from "@/components/shared/AdminReportTable";
import { JoinCohortCard } from "@/components/shared/JoinCohortCard";
import { activeEnrollmentWindowWhere, resolveEnrollmentAccessState } from "@/services/enrollment-access";

const AdminReportTable = nextDynamic(() => import("@/components/shared/AdminReportTable").then(module => module.AdminReportTable));
const PrePostTestComparison = nextDynamic(() => import("@/components/shared/PrePostTestComparison").then(module => module.PrePostTestComparison));
const MentorCourseActions = nextDynamic(() => import("@/components/shared/MentorCourseActions").then(module => module.MentorCourseActions));
const AdminUserManagement = nextDynamic(() => import("@/components/shared/AdminUserManagement").then(module => module.AdminUserManagement));
const BroadcastManager = nextDynamic(() => import("@/components/shared/BroadcastManager").then(module => module.BroadcastManager));
const SuperAdminAnalyticsPanel = nextDynamic(() => import("@/components/shared/SuperAdminAnalyticsPanel").then(module => module.SuperAdminAnalyticsPanel));

export const dynamic = "force-dynamic";

const average = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  // ═══════════════════════════════════════════════════════════
  // STUDENT DASHBOARD
  // ═══════════════════════════════════════════════════════════
  if (user.role === "STUDENT") {
    const allEnrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        cohort: { select: { id: true, name: true } },
        course: {
          select: {
            id: true, slug: true, title: true, shortDescription: true, category: true, level: true, price: true, durationHours: true, rating: true, studentsCount: true, image: true,
            nodes: { where: { type: { not: "FOLDER" } }, select: { id: true } }
          }
        }
      },
      orderBy: { enrolledAt: "desc" }
    });
    const certificates = await prisma.certificate.findMany({
      where: { userId: user.id },
      include: { course: { select: { id: true, title: true, slug: true, image: true } } },
      orderBy: { issuedAt: "desc" }
    });
    
    // Ambil nilai pre-test dan post-test untuk dashboard statistik
    const attempts = await prisma.assessmentAttempt.findMany({
      where: { 
        userId: user.id,
        status: { in: ["GRADED", "SUBMITTED"] },
        assessment: { type: { in: ["PRETEST", "POSTTEST", "FINAL"] } }
      },
      include: {
        assessment: { select: { courseId: true, title: true, type: true } }
      },
      orderBy: { submittedAt: "desc" }
    });

    // Enrollment adalah entitlement peserta. Jangan auto-enroll semua course
    // yang dipublish: dashboard harus mencerminkan paket/program yang dibeli.
    const now = new Date();
    const enrollments = allEnrollments.filter(enrollment => resolveEnrollmentAccessState(enrollment, now) === "ACTIVE");
    const scheduledEnrollments = allEnrollments.filter(enrollment => resolveEnrollmentAccessState(enrollment, now) === "NOT_STARTED");
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

          <JoinCohortCard />

          {scheduledEnrollments.length > 0 && (
            <section className="pf-cohort-upcoming" aria-labelledby="upcoming-cohort-title">
              <header>
                <CalendarDays aria-hidden="true" />
                <div><span>Akses terjadwal</span><h2 id="upcoming-cohort-title">Kohort yang akan dimulai</h2></div>
              </header>
              <div>
                {scheduledEnrollments.map(enrollment => (
                  <article key={enrollment.id}>
                    <div><strong>{enrollment.course.title}</strong><small>{enrollment.cohort?.name || "Kohort program"}</small></div>
                    <time dateTime={enrollment.accessStartsAt?.toISOString()}>
                      Mulai {enrollment.accessStartsAt?.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </time>
                  </article>
                ))}
              </div>
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
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Tersedia setelah semua materi selesai dan memenuhi batas lulus (Passing Grade).</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <PrePostTestComparison attempts={attempts} />

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
      include: {
        enrollments: { where: activeEnrollmentWindowWhere(), select: { userId: true, progressPercent: true } },
        nodes: { select: { id: true, type: true, title: true } },
      },
      orderBy: [{ published: "desc" }, { createdAt: "desc" }],
    });
    const pendingGradeCount = await prisma.assessmentAttempt.count({
      where: { assessment: { course: { mentorId: user.id } }, status: "PENDING_GRADE" }
    });

    const courseOptions = courses.map(c => ({
      id: c.id, title: c.title,
      nodes: c.nodes.map(n => ({ id: n.id, title: n.title, type: n.type }))
    }));

    const totalStudents = new Set(courses.flatMap(course => course.enrollments.map(enrollment => enrollment.userId))).size;
    const activeCourses = courses.filter(course => course.published);
    const averageStudentProgress = average(courses.flatMap(course => course.enrollments.map(enrollment => enrollment.progressPercent)));
    const mentorQuickLinks = [
      { href: "/dashboard/kohort", label: "Kohort", description: "Atur kode dan periode akses", icon: ShieldCheck },
      { href: "/mentor/evaluasi", label: "Evaluasi", description: "Nilai tugas peserta", icon: FileCheck2 },
      { href: "/dashboard/peserta", label: "Peserta", description: "Pantau progres belajar", icon: UsersRound },
      { href: "/kalender", label: "Kalender", description: "Atur agenda program", icon: CalendarDays },
      { href: "/absensi", label: "Absensi", description: "Kelola kehadiran", icon: ClipboardCheck },
      { href: "/dashboard/analitik", label: "Analitik", description: "Baca aktivitas program", icon: BarChart3 },
      { href: "/peringkat", label: "Peringkat", description: "Lihat capaian peserta", icon: Award },
      { href: "/forum", label: "Komunitas", description: "Dampingi diskusi", icon: MessageSquare },
    ];

    const mentorAttempts = await prisma.assessmentAttempt.findMany({
      where: {
        assessment: { course: { mentorId: user.id } },
        status: { in: ["GRADED", "SUBMITTED"] }
      },
      select: { score: true, assessment: { select: { type: true } } }
    });
    
    const preScores = mentorAttempts.filter(a => a.assessment.type === "PRETEST").map(a => a.score);
    const postScores = mentorAttempts.filter(a => a.assessment.type === "POSTTEST").map(a => a.score);
    const avgPre = preScores.length > 0 ? average(preScores) : 0;
    const avgPost = postScores.length > 0 ? average(postScores) : 0;
    const improvement = (avgPre > 0 || avgPost > 0) ? (avgPost - avgPre) : 0;

    return (
      <DashboardChrome user={user}>
        <div className="pf-role-dashboard pf-mentor-dashboard">
          <header className="pf-role-intro">
            <span>Workspace mentor</span>
            <h1>Halo, {user.name.split(" ")[0]}.</h1>
            <p>Kelola program, dampingi peserta, dan selesaikan pekerjaan yang membutuhkan perhatian Anda.</p>
          </header>

          <section className="pf-role-focus" aria-labelledby="mentor-focus-title">
            <div className="pf-role-focus-copy">
              <span className="pf-role-kicker">Prioritas hari ini</span>
              <Clock aria-hidden="true" />
              <h2 id="mentor-focus-title">
                {pendingGradeCount > 0
                  ? `${pendingGradeCount} evaluasi menunggu penilaian.`
                  : "Semua evaluasi sudah tertangani."}
              </h2>
              <p>
                {pendingGradeCount > 0
                  ? "Berikan umpan balik tepat waktu agar peserta dapat melanjutkan progres belajarnya."
                  : "Anda dapat meninjau aktivitas peserta atau menyiapkan materi berikutnya."}
              </p>
              <Link href="/mentor/evaluasi" className="pf-role-focus-action">
                Buka evaluasi <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <dl className="pf-role-focus-metrics">
              <div><dt>Program aktif</dt><dd>{activeCourses.length}</dd></div>
              <div><dt>Peserta unik</dt><dd>{totalStudents}</dd></div>
              <div><dt>Rata-rata progres</dt><dd>{averageStudentProgress}%</dd></div>
              <div>
                <dt>Agregat Peningkatan</dt>
                <dd className={improvement > 0 ? "text-emerald-600 font-bold" : ""}>
                  {improvement > 0 ? `+${improvement} Poin` : `${improvement} Poin`}
                </dd>
              </div>
            </dl>
          </section>

          <section className="pf-role-section pf-role-actions-section" id="program" aria-labelledby="mentor-program-actions">
            <header className="pf-role-section-heading">
              <div>
                <span>Program & materi</span>
                <h2 id="mentor-program-actions">Kelola ruang belajar</h2>
                <p>Buat program baru, unggah materi, atau ekspor rekap penilaian.</p>
              </div>
            </header>
            <MentorCourseActions courses={courseOptions} />
          </section>

          <div className="pf-role-content-grid">
            <section className="pf-role-section" aria-labelledby="mentor-course-list">
              <header className="pf-role-section-heading">
                <div>
                  <span>Kurikulum</span>
                  <h2 id="mentor-course-list">Program Anda</h2>
                </div>
                <small>{courses.length} program</small>
              </header>
              {courses.length > 0 ? (
                <div className="pf-role-course-list">
                  {courses.map(course => (
                    <Link href={`/mentor/courses/${course.id}/builder`} key={course.id} className="pf-role-course-row">
                      <span className="pf-role-course-thumb">
                        <Image src={course.image} fill alt="" sizes="64px" />
                      </span>
                      <span className="pf-role-course-copy">
                        <small>{course.category} · {course.published ? "Terbit" : "Draf"}</small>
                        <strong>{course.title}</strong>
                        <span>{course.nodes.filter(node => node.type === "FOLDER").length} modul · {course.enrollments.length} peserta</span>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="pf-role-empty">
                  <BookOpen aria-hidden="true" />
                  <p>Belum ada program. Gunakan tombol di atas untuk membuat program pertama.</p>
                </div>
              )}
            </section>

            <aside className="pf-role-section" aria-labelledby="mentor-shortcuts">
              <header className="pf-role-section-heading">
                <div>
                  <span>Navigasi</span>
                  <h2 id="mentor-shortcuts">Akses cepat</h2>
                </div>
              </header>
              <div className="pf-role-shortcut-list">
                {mentorQuickLinks.map(({ href, label, description, icon: Icon }) => (
                  <Link href={href} key={href} className="pf-role-shortcut">
                    <Icon aria-hidden="true" />
                    <span><strong>{label}</strong><small>{description}</small></span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </DashboardChrome>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SUPER ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════
  // These independent reads deliberately run sequentially. Holding the
  // pooler's only connection inside one long transaction starves sidebar and
  // navigation requests; releasing it after each query keeps the workspace
  // responsive under serverless concurrency.
  const userCount = await prisma.user.count();
  const courseCount = await prisma.course.count({ where: { published: true } });
  const certificateCount = await prisma.certificate.count();
  const enrollmentCount = await prisma.enrollment.count();
  const roleCounts = await prisma.user.groupBy({
    by: ["role"],
    orderBy: { role: "asc" },
    _count: { _all: true },
  });
  const allEnrollments = await prisma.enrollment.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } }
    }
  });
  const allUsersList = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, authProvider: true, createdAt: true,
      _count: { select: { enrollments: true, certificates: true, mentoredCourses: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  const allCoursesList = await prisma.course.findMany({
    include: { nodes: { select: { id: true, type: true, title: true } } }
  });

  const reportData: ReportRow[] = allEnrollments.map(e => ({
    id: e.id, 
    userId: e.user.id,
    name: e.user.name, 
    email: e.user.email,
    course: e.course.title, 
    progress: e.progressPercent,
    score: null,
    pretestScore: null,
    posttestScore: null,
    status: e.status, 
    enrolledAt: e.enrolledAt.toISOString()
  }));

  const activeStudentsCount = new Set(
    allEnrollments
      .filter(enrollment => enrollment.progressPercent > 0 && enrollment.status !== "COMPLETED")
      .map(enrollment => enrollment.user.id)
  ).size;
  const avgProgress = average(reportData.map(r => r.progress));
  const graduationRate = enrollmentCount > 0 ? Math.min(100, Math.round((certificateCount / enrollmentCount) * 100)) : 0;
  const adminQuickLinks = [
    { href: "#admin-user-mgmt", label: "Pengguna", description: "Kelola akun dan peran", icon: UsersRound },
    { href: "#program", label: "Program", description: "Buat dan atur kurikulum", icon: BookOpen },
    { href: "#broadcast-mgmt", label: "Siaran", description: "Kirim pengumuman", icon: MessageSquare },
    { href: "/kalender", label: "Kalender", description: "Atur agenda platform", icon: CalendarDays },
    { href: "/absensi", label: "Absensi", description: "Pantau kehadiran", icon: ClipboardCheck },
    { href: "/dashboard/analitik", label: "Analitik", description: "Tinjau data aktivitas", icon: BarChart3 },
    { href: "/peringkat", label: "Peringkat", description: "Lihat capaian peserta", icon: Award },
    { href: "/forum", label: "Komunitas", description: "Moderasi diskusi", icon: MessageSquare },
  ];

  return (
    <DashboardChrome user={user}>
      <div className="pf-role-dashboard pf-admin-dashboard">
        <header className="pf-role-intro">
          <span>Kontrol platform</span>
          <h1>Operasional LMS dalam satu ruang.</h1>
          <p>Pantau kesehatan pembelajaran dan buka alat pengelolaan tanpa berpindah-pindah dashboard.</p>
        </header>

        <section className="pf-role-focus pf-admin-focus" aria-labelledby="admin-focus-title">
          <div className="pf-role-focus-copy">
            <span className="pf-role-kicker">Status platform</span>
            <ShieldCheck aria-hidden="true" />
            <h2 id="admin-focus-title">{activeStudentsCount} peserta sedang aktif belajar.</h2>
            <p>{courseCount} program telah terbit dengan rata-rata progres {avgProgress}% di seluruh pendaftaran.</p>
            <Link href="#admin-user-mgmt" className="pf-role-focus-action">
              Kelola pengguna <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <dl className="pf-role-focus-metrics">
            <div><dt>Akun terdaftar</dt><dd>{userCount}</dd></div>
            <div><dt>Pendaftaran</dt><dd>{enrollmentCount}</dd></div>
            <div><dt>Sertifikat</dt><dd>{certificateCount}</dd></div>
          </dl>
        </section>

        <section className="pf-role-section" aria-labelledby="admin-shortcuts">
          <header className="pf-role-section-heading">
            <div>
              <span>Operasional</span>
              <h2 id="admin-shortcuts">Akses cepat</h2>
              <p>Semua fungsi lama tetap tersedia dan dikelompokkan berdasarkan pekerjaan.</p>
            </div>
          </header>
          <div className="pf-admin-shortcut-grid">
            {adminQuickLinks.map(({ href, label, description, icon: Icon }) => (
              <Link href={href} key={href} className="pf-role-shortcut">
                <Icon aria-hidden="true" />
                <span><strong>{label}</strong><small>{description}</small></span>
                <ChevronRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className="pf-role-section pf-admin-insight-section" aria-labelledby="platform-insight-title">
          <header className="pf-role-section-heading">
            <div>
              <span>Data platform</span>
              <h2 id="platform-insight-title">Distribusi & laporan</h2>
              <p>Ringkasan berdasarkan akun, pendaftaran, progres, dan sertifikat yang tersimpan.</p>
            </div>
          </header>
          <dl className="pf-admin-signal-row">
            <div><TrendingUp aria-hidden="true" /><dt>Rata-rata progres</dt><dd>{avgProgress}%</dd></div>
            <div><GraduationCap aria-hidden="true" /><dt>Tingkat sertifikasi</dt><dd>{graduationRate}%</dd></div>
            <div><BookMarked aria-hidden="true" /><dt>Total pendaftaran</dt><dd>{enrollmentCount}</dd></div>
            <div><Activity aria-hidden="true" /><dt>Peserta aktif</dt><dd>{activeStudentsCount}</dd></div>
          </dl>
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
        </section>

        <section className="pf-role-section pf-role-actions-section" id="program" aria-labelledby="admin-program-title">
          <header className="pf-role-section-heading">
            <div>
              <span>Program & materi</span>
              <h2 id="admin-program-title">Kelola katalog pembelajaran</h2>
              <p>Buat program, unggah materi, dan buka course builder.</p>
            </div>
          </header>
          <MentorCourseActions courses={allCoursesList.map(c => ({ id: c.id, title: c.title, nodes: c.nodes }))} />
        </section>

        <section className="pf-admin-tool-slot" id="broadcast-mgmt" aria-label="Pengelolaan siaran">
          <BroadcastManager courses={allCoursesList.map(c => ({ id: c.id, title: c.title }))} />
        </section>

        <section className="pf-admin-tool-slot" id="admin-user-mgmt" aria-label="Pengelolaan pengguna">
          <AdminUserManagement initialUsers={allUsersList.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
        </section>

        <section className="pf-admin-tool-slot" id="reports" aria-label="Laporan pembelajaran">
          <AdminReportTable data={reportData} />
        </section>
      </div>
    </DashboardChrome>
  );
}
