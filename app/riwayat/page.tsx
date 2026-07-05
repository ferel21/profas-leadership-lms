import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import { CheckCircle2, Clock, Play, FileText, Trophy, ArrowRight, Award } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function RiwayatPembelajaran() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  if (user.role === "MENTOR") redirect("/dashboard");

  // Ambil semua aktivitas terkait
  const [lessons, attempts, xpLogs] = await Promise.all([
    prisma.nodeProgress.findMany({
      where: { userId: user.id },
      include: { node: { select: { title: true, type: true, course: { select: { title: true, slug: true } } } } }
    }),
    prisma.assessmentAttempt.findMany({
      where: { userId: user.id },
      include: { assessment: { select: { title: true, course: { select: { title: true, slug: true } } } } }
    }),
    prisma.xPLog.findMany({
      where: { userId: user.id }
    })
  ]);

  // Normalisasi aktivitas menjadi format timeline
  type TimelineItem = { id: string; date: Date; type: "LESSON" | "EVALUATION" | "XP"; title: string; subtitle: string; icon: React.ElementType; meta?: string; link?: string };
  const timeline: TimelineItem[] = [];

  lessons.forEach((l) => {
    timeline.push({
      id: `lesson-${l.id}`,
      date: l.completedAt,
      type: "LESSON",
      title: `Materi Selesai: ${l.node.title}`,
      subtitle: `${l.node.course.title}`,
      icon: l.node.type === "VIDEO" ? Play : FileText,
      link: `/belajar/${l.node.course.slug}`
    });
  });

  attempts.forEach((a) => {
    timeline.push({
      id: `attempt-${a.id}`,
      date: a.submittedAt,
      type: "EVALUATION",
      title: `Evaluasi ${a.passed ? "Lulus" : "Selesai"}: ${a.assessment.title}`,
      subtitle: a.assessment.course.title,
      icon: a.passed ? CheckCircle2 : Clock,
      meta: `Skor: ${a.score}`
    });
  });

  xpLogs.forEach((x) => {
    // Hindari duplikasi log login harian jika terlalu banyak, tampilkan log XP khusus
    if (x.source.includes("LOGIN")) return;
    timeline.push({
      id: `xp-${x.id}`,
      date: x.createdAt,
      type: "XP",
      title: `Mendapatkan ${x.points} XP`,
      subtitle: x.source.replace(/_/g, " "),
      icon: Trophy,
      meta: `+${x.points} XP`
    });
  });

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <DashboardChrome user={user}>
      <div className="dash-title">
        <div>
          <h1>Riwayat Pembelajaran</h1>
          <p>Lacak perjalanan belajarmu, evaluasi yang telah diselesaikan, dan XP yang diperoleh.</p>
        </div>
      </div>

      <div className="history-timeline">
        {timeline.length === 0 ? (
          <div className="empty-state">
            <Award size={48} color="#cbd5e1" style={{ marginBottom: "1rem" }} />
            <h3>Belum Ada Aktivitas</h3>
            <p>Mulailah belajar dan raih XP pertama Anda.</p>
            <Link href="/program" className="btn btn-primary">Jelajahi Program</Link>
          </div>
        ) : (
          <div className="timeline-container">
            {timeline.map((item) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-date">
                  <small>{formatDate(item.date)}</small>
                </div>
                <div className="timeline-dot">
                  <span className={`icon-circle type-${item.type.toLowerCase()}`}>
                    <item.icon size={16} />
                  </span>
                </div>
                <div className="timeline-content">
                  <div className="content-inner">
                    <div className="content-header">
                      <h3>{item.title}</h3>
                      {item.meta && <strong className={`meta-badge type-${item.type.toLowerCase()}`}>{item.meta}</strong>}
                    </div>
                    <p>{item.subtitle}</p>
                    {item.link && (
                      <Link href={item.link} className="timeline-link">
                        Lihat <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}
