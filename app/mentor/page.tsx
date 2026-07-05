import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, UsersRound, TrendingUp, ChevronRight, Settings } from "lucide-react";
import { ProgressRing } from "@/components/ProgressRing";

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export default async function MentorDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const courses = await prisma.course.findMany({
    where: { mentorId: user.id },
    include: {
      nodes: { select: { id: true, type: true } },
      enrollments: { select: { userId: true, progressPercent: true } }
    }
  });

  const enrollments = courses.flatMap(course => course.enrollments);
  const students = new Set(enrollments.map(enrollment => enrollment.userId)).size;
  const averageProgress = average(enrollments.map(enrollment => enrollment.progressPercent));

  return (
    <DashboardChrome user={user}>
      <div className="dash-title">
        <div>
          <p>Halo, {user.name.split(" ")[0]} <span>👋</span></p>
          <h1>Mentor Dashboard</h1>
          <small>Pantau program dan dampingi pertumbuhan peserta Anda.</small>
        </div>
      </div>
      
      <div className="metric-grid">
        <article className="glass hover-lift" style={{ padding: '20px', borderRadius: '15px' }}>
          <span><BookOpen/></span>
          <div><small>Program Aktif</small><b>{courses.length}</b><p>Program yang dikelola</p></div>
        </article>
        <article className="glass hover-lift" style={{ padding: '20px', borderRadius: '15px' }}>
          <span><UsersRound/></span>
          <div><small>Peserta Unik</small><b>{students}</b><p>Di seluruh program</p></div>
        </article>
        <article className="glass hover-lift" style={{ padding: '20px', borderRadius: '15px' }}>
          <span><TrendingUp/></span>
          <div><small>Rata-rata Progres</small><b>{averageProgress}%</b><p>Berdasarkan enrollment</p></div>
        </article>
      </div>

      <section className="role-grid" style={{ marginTop: "2rem" }}>
        <article className="data-card glass hover-lift" id="program" style={{ width: '100%', gridColumn: '1 / -1' }}>
          <div className="data-title">
            <div>
              <h2>Program yang Anda Kelola</h2>
              <p>Klik Course Builder untuk mengedit materi</p>
            </div>
          </div>
          <div className="mentor-courses">
            {courses.map(course => (
              <div key={course.id} style={{ padding: '1rem', borderBottom: '1px solid var(--line)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="program-thumb" style={{ width: 85, height: 60, position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                  <Image src={course.image || "/images/profas-leadership-hero.png"} fill alt={course.title} style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', color: 'var(--teal-dark)', fontWeight: 'bold' }}>{course.category}</span>
                  <h3 style={{ margin: '4px 0', fontSize: '14px' }}>{course.title}</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
                    {course.nodes.filter(n => n.type === "FOLDER").length} modul • {course.enrollments.length} enrollment
                  </p>
                </div>
                <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}>
                  <ProgressRing value={average(course.enrollments.map(item=>item.progressPercent))} size={50} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/mentor/courses/${course.id}/builder`} className="btn btn-outline btn-small hover-lift">
                    <Settings size={14} /> Builder
                  </Link>
                  <Link href={`/program/${course.slug}`} aria-label={`Lihat ${course.title}`} className="btn btn-primary btn-small hover-lift">
                    Lihat <ChevronRight size={14}/>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardChrome>
  );
}
