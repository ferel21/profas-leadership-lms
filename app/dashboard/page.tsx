import { DashboardChrome } from "@/components/DashboardChrome";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, UsersRound, Award, ChevronRight, Activity, TrendingUp, Layers3 } from "lucide-react";
import Image from "next/image";
import { AdminReportTable, ReportRow } from "@/components/AdminReportTable";

// Simple UI components
function MetricGrid({ items }: { items: [string, number | string, React.ElementType, string][] }) {
  return (
    <div className="metric-grid">
      {items.map(([label, value, Icon, desc], i) => (
        <div className="metric-card" key={i}>
          <div className="metric-icon"><Icon size={20} /></div>
          <div>
            <span>{label}</span>
            <b>{value}</b>
          </div>
          <small>{desc}</small>
        </div>
      ))}
    </div>
  );
}

function RoleHeading({ title, subtitle }: { title: string, subtitle: string }) {
  return (
    <div className="role-heading">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const dasharray = `${value}, 100`;
  return (
    <div className="progress-ring-box">
      <svg viewBox="0 0 36 36" className="progress-ring">
        <path className="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        <path className="ring-fill" strokeDasharray={dasharray} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
      </svg>
      <span>{Math.round(value)}%</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><p>{text}</p></div>;
}

const average = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  if (user.role === "STUDENT") {
    // ... logic for student
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
    const stats = { courses: enrollments.length, completed: enrollments.filter(e => e.status === "COMPLETED").length, hours: 0 };
    return (
      <DashboardChrome user={user}>
        <RoleHeading title="Ruang Belajar" subtitle="Lanjutkan pembelajaran dan capai target harian Anda." />
        <MetricGrid items={[
          ["Program Aktif", stats.courses - stats.completed, BookOpen, "Sedang dipelajari"],
          ["Selesai", stats.completed, Award, "Sertifikat diraih"],
          ["Jam Belajar", stats.hours, Activity, "Total durasi"],
          ["Skor Rata-rata", "0", TrendingUp, "Dari kuis & tugas"]
        ]} />
        <section className="role-grid">
          <article className="data-card" id="program">
            <div className="data-title">
              <div><h2>Melanjutkan Belajar</h2><p>Program yang sedang Anda ikuti</p></div>
            </div>
            <div className="course-list">
              {enrollments.map(e => (
                <Link href={`/belajar/${e.course.slug}`} className="course-row hover-lift" key={e.id}>
                  <div className="course-row-img"><Image src={e.course.image} fill alt={e.course.title} /></div>
                  <div className="course-row-info"><h3>{e.course.title}</h3><p>{e.course.nodes.length} materi</p></div>
                  <ProgressRing value={e.progressPercent} />
                  <ChevronRight className="course-row-arrow" />
                </Link>
              ))}
              {!enrollments.length && <EmptyState text="Anda belum mengikuti program apapun." />}
            </div>
          </article>

          <article className="data-card" id="sertifikat">
            <div className="data-title">
              <div><h2>Sertifikat Saya</h2><p>Pencapaian dari program yang telah selesai</p></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {certificates.map(cert => (
                <div key={cert.id} className="certificate-mini hover-lift" style={{ borderRadius: "12px", padding: "16px" }}>
                  <span><Award size={20} /></span>
                  <div>
                    <small>NO. {cert.uniqueNumber}</small>
                    <b style={{ fontSize: "14px" }}>{cert.course.title}</b>
                    <Link href={`/sertifikat/${cert.uniqueNumber}`}>Lihat Sertifikat <ChevronRight size={14} /></Link>
                  </div>
                </div>
              ))}
              {!certificates.length && <EmptyState text="Anda belum memiliki sertifikat." />}
            </div>
          </article>
        </section>
      </DashboardChrome>
    );
  }

  if (user.role === "MENTOR") {
    // ... logic for mentor
    const courses = await prisma.course.findMany({
      where: { mentorId: user.id },
      include: { enrollments: true, nodes: true }
    });
    return (
      <DashboardChrome user={user}>
        <RoleHeading title="Dashboard Mentor" subtitle="Kelola materi, evaluasi tugas, dan pantau progres peserta Anda." />
        <MetricGrid items={[
          ["Program Aktif", courses.length, BookOpen, "Program berjalan"],
          ["Total Peserta", courses.reduce((a, c) => a + c.enrollments.length, 0), UsersRound, "Dalam semua program"],
          ["Tugas Menunggu", 0, Activity, "Perlu dinilai"],
          ["Rating", "4.8", Award, "Rata-rata ulasan"]
        ]} />
        <section className="role-grid">
          <article className="data-card" id="program">
            <div className="data-title">
              <div><h2>Manajemen Kurikulum & Program</h2><p>Kelola struktur materi Anda</p></div>
            </div>
            <div className="mentor-courses">
              {courses.map(course => (
                <div key={course.id}>
                  <div className="program-thumb"><Image src={course.image} fill alt={course.title} /></div>
                  <section>
                    <span>{course.category}</span>
                    <h3>{course.title}</h3>
                    <p>{course.nodes.filter(n => n.type === "FOLDER").length} modul • {course.enrollments.length} enrollment</p>
                    <div style={{ marginTop: "0.5rem" }}>
                      <Link href={`/mentor/courses/${course.id}/builder`} className="btn btn-primary btn-small hover-lift">Buka Course Builder</Link>
                    </div>
                  </section>
                </div>
              ))}
            </div>
          </article>

          <aside className="data-card">
            <div className="data-title">
              <div><h2>Aksi Cepat Mentor</h2><p>Pintu akses fitur pengajaran</p></div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <Link href="/dashboard/evaluasi" className="btn btn-secondary hover-lift" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <span>Periksa Tugas & Evaluasi</span>
                <ChevronRight size={16} />
              </Link>
              <Link href="/dashboard/peserta" className="btn btn-secondary hover-lift" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <span>Pantau Progres Peserta</span>
                <ChevronRight size={16} />
              </Link>
              <Link href="/forum" className="btn btn-secondary hover-lift" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                <span>Forum & Komunitas Belajar</span>
                <ChevronRight size={16} />
              </Link>
            </div>
            <div style={{ marginTop: "24px", padding: "16px", borderRadius: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
              <b style={{ fontSize: "13px", display: "block", marginBottom: "4px" }}>Tips Pengajaran Berdampak</b>
              <p style={{ fontSize: "11px", margin: 0, lineHeight: 1.5 }}>
                Berikan umpan balik yang konstruktif dan tepat waktu pada tugas peserta untuk meningkatkan retensi dan pemahaman kepemimpinan mereka.
              </p>
            </div>
          </aside>
        </section>
      </DashboardChrome>
    );
  }

  // SUPER ADMIN
  const [users, courses, certificates, enrollments, roleCounts, allEnrollments] = await Promise.all([
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
    })
  ]);

  const maxRole = Math.max(...roleCounts.map(item => item._count._all), 1);
  const labels: Record<string, string> = { STUDENT: "Peserta", MENTOR: "Mentor", SUPER_ADMIN: "Super Admin" };

  const reportData: ReportRow[] = allEnrollments.map(e => ({
    id: e.id,
    name: e.user.name,
    email: e.user.email,
    course: e.course.title,
    progress: e.progressPercent,
    score: e.progressPercent > 0 ? Math.round(e.progressPercent * 0.9) : null,
    status: e.status,
    enrolledAt: e.enrolledAt.toISOString()
  }));

  const activeStudentsCount = reportData.filter(r => r.progress > 0 && r.status !== "COMPLETED").length;
  const avgProgress = average(reportData.map(r => r.progress));

  return (
    <DashboardChrome user={user}>
      <RoleHeading title="Super Admin Analytics" subtitle="Pemantauan menyeluruh seluruh operasi LMS." />
      
      <MetricGrid items={[
        ["Total Pengguna", users, UsersRound, "Akun terdaftar"],
        ["Peserta Aktif", activeStudentsCount, Activity, "Sedang belajar"],
        ["Program Terbit", courses, BookOpen, "Dapat diakses peserta"],
        ["Sertifikat Terbit", certificates, Award, "Terverifikasi publik"]
      ]} />
      
      <section className="role-grid">
        <article className="data-card analytics-card">
          <div className="data-title">
            <div>
              <h2>Distribusi Pengguna</h2>
              <p>Berdasarkan peran akun saat ini</p>
            </div>
            <span className="data-label">{users} akun</span>
          </div>
          <div className="fake-chart">
            <div className="y-labels">
              <span>{maxRole}</span>
              <span>{Math.round(maxRole * .66)}</span>
              <span>{Math.round(maxRole * .33)}</span>
              <span>0</span>
            </div>
            <div className="bars">
              {roleCounts.map(item => (
                <span key={item.role}>
                  <i style={{ height: `${Math.max(8, item._count._all / maxRole * 100)}%` }} />
                  <small>{labels[item.role] ?? item.role}</small>
                </span>
              ))}
            </div>
          </div>
        </article>
        
        <aside className="data-card">
          <div className="data-title">
            <div>
              <h2>Performa Pembelajaran</h2>
              <p>Rata-rata platform</p>
            </div>
            <TrendingUp />
          </div>
          <div className="activity-list">
            <p>
              <span className="blue"><Layers3 /></span>
              <b>{avgProgress}%<small>Rata-rata tingkat penyelesaian</small></b>
            </p>
            <p>
              <span className="green"><Award /></span>
              <b>{certificates}<small>Peserta berhasil lulus</small></b>
            </p>
            <p>
              <span className="orange"><UsersRound /></span>
              <b>{enrollments}<small>Total pendaftaran kelas</small></b>
            </p>
          </div>
        </aside>
      </section>

      {/* Advanced Admin Report Table */}
      <AdminReportTable data={reportData} />
      
    </DashboardChrome>
  );
}
