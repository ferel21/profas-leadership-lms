import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, UsersRound, TrendingUp, ChevronRight, Settings } from "lucide-react";
import { ProgressRing } from "@/components/ProgressRing";
import { MentorCourseActions } from "@/components/MentorCourseActions";
import { BroadcastManager } from "@/components/BroadcastManager";

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export default async function MentorDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const courses = await prisma.course.findMany({
    where: { mentorId: user.id },
    include: {
      nodes: { select: { id: true, type: true, title: true } },
      enrollments: { select: { userId: true, progressPercent: true } }
    }
  });

  const enrollments = courses.flatMap(course => course.enrollments);
  const students = new Set(enrollments.map(enrollment => enrollment.userId)).size;
  const averageProgress = average(enrollments.map(enrollment => enrollment.progressPercent));

  const courseOptions = courses.map(c => ({
    id: c.id,
    title: c.title,
    nodes: c.nodes.map(n => ({ id: n.id, title: n.title, type: n.type }))
  }));

  return (
    <DashboardChrome user={user}>
      <div className="dash-title">
        <div>
          <p>Halo, {user.name.split(" ")[0]}</p>
          <h1>Mentor Dashboard</h1>
          <small>Pantau program dan dampingi pertumbuhan peserta Anda.</small>
        </div>
      </div>
      
      <div className="metric-grid">
        <article className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm flex items-center gap-4 hover-lift">
          <span className="p-3 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center"><BookOpen size={24}/></span>
          <div><small className="text-slate-500 font-semibold block uppercase tracking-wider text-xs">Program Aktif</small><b className="text-2xl font-extrabold text-slate-900 block my-1">{courses.length}</b><p className="m-0 text-xs text-slate-400">Program yang dikelola</p></div>
        </article>
        <article className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm flex items-center gap-4 hover-lift">
          <span className="p-3 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><UsersRound size={24}/></span>
          <div><small className="text-slate-500 font-semibold block uppercase tracking-wider text-xs">Peserta Unik</small><b className="text-2xl font-extrabold text-slate-900 block my-1">{students}</b><p className="m-0 text-xs text-slate-400">Di seluruh program</p></div>
        </article>
        <article className="p-5 rounded-2xl bg-white/80 border border-slate-200 shadow-sm flex items-center gap-4 hover-lift">
          <span className="p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><TrendingUp size={24}/></span>
          <div><small className="text-slate-500 font-semibold block uppercase tracking-wider text-xs">Rata-rata Progres</small><b className="text-2xl font-extrabold text-slate-900 block my-1">{averageProgress}%</b><p className="m-0 text-xs text-slate-400">Berdasarkan enrollment</p></div>
        </article>
      </div>

      <div className="mt-8">
        <MentorCourseActions courses={courseOptions} />
        <BroadcastManager courses={courses.map(c => ({ id: c.id, title: c.title }))} />
      </div>

      <section className="role-grid mt-4">
        <article className="data-card glass hover-lift w-full col-span-full" id="program">
          <div className="data-title border-b border-slate-200 pb-4 mb-4">
            <div>
              <h2>Program yang Anda Kelola</h2>
              <p>Klik Course Builder untuk mengedit materi</p>
            </div>
          </div>
          <div className="mentor-courses flex flex-col divide-y divide-slate-100">
            {courses.map(course => (
              <div key={course.id} className="py-4 flex gap-4 items-center flex-wrap sm:flex-nowrap">
                <div className="program-thumb w-[85px] h-[60px] relative rounded-lg overflow-hidden shrink-0 bg-slate-100">
                  <Image src={course.image || "/images/profas-leadership-hero.png"} fill alt={course.title} className="object-cover" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">{course.category}</span>
                  <h3 className="my-1 text-sm font-bold text-slate-900">{course.title}</h3>
                  <p className="m-0 text-xs text-slate-500">
                    {course.nodes.filter(n => n.type === "FOLDER").length} modul • {course.enrollments.length} enrollment
                  </p>
                </div>
                <div className="w-[60px] flex justify-center shrink-0">
                  <ProgressRing value={average(course.enrollments.map(item=>item.progressPercent))} size={50} />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/mentor/courses/${course.id}/builder`} className="btn btn-outline btn-small hover-lift flex items-center gap-1">
                    <Settings size={14} /> Builder
                  </Link>
                  <Link href={`/program/${course.slug}`} aria-label={`Lihat ${course.title}`} className="btn btn-primary btn-small hover-lift flex items-center gap-1">
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
