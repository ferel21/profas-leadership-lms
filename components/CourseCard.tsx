import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Star, Users } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

type CourseCardProps = {
  course: { slug: string; title: string; shortDescription: string; category: string; level: string; price: number; durationHours: number; rating: number; studentsCount: number; image: string; mentor?: { name: string } };
};

export function CourseCard({ course }: CourseCardProps) {
  const levels: Record<string, string> = { BASIC: "Dasar", INTERMEDIATE: "Menengah", ADVANCED: "Lanjutan" };
  const isMasterclass = course.level === "ADVANCED" || course.price > 1000000;
  const isTopRated = course.rating >= 4.8;

  return (
    <article className="course-card hover-lift" style={{ borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.4)", position: "relative" }}>
      {isMasterclass && <div className="pro-course-ribbon">MASTERCLASS</div>}
      <Link href={`/program/${course.slug}`} className="course-image" style={{ position: "relative", display: "block" }}>
        <Image src={course.image} alt={course.title} fill sizes="(max-width: 800px) 100vw, 33vw" />
        <span className="level-badge">{levels[course.level] ?? course.level}</span>
      </Link>
      <div className="course-body">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <p className="eyebrow-small" style={{ margin: 0 }}>{course.category}</p>
          {isMasterclass ? (
            <span className="pro-masterclass-badge" style={{ fontSize: "0.62rem", padding: "2px 8px" }}>👑 C-Level Exec</span>
          ) : isTopRated ? (
            <span className="pro-ai-sparkle" style={{ fontSize: "0.62rem", padding: "2px 8px" }}>✨ Pilihan Eksekutif</span>
          ) : null}
        </div>
        <h3><Link href={`/program/${course.slug}`}>{course.title}</Link></h3>
        <p>{course.shortDescription}</p>
        {course.mentor && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#64748b", marginBottom: "12px", background: "rgba(241, 245, 249, 0.6)", padding: "4px 10px", borderRadius: "8px", width: "fit-content" }}>
            <span className="pro-mentor-status"></span>
            <span>Mentor Senior: <b style={{ color: "#0f172a" }}>{course.mentor.name}</b></span>
          </div>
        )}
        <div className="course-meta"><span><Clock3 size={15}/>{course.durationHours} jam</span><span><Users size={15}/>{course.studentsCount.toLocaleString("id-ID")}</span><span><Star size={15} fill="currentColor"/>{course.rating}</span></div>
        <div className="course-foot"><div><small>Mulai dari</small><strong>{formatRupiah(course.price)}</strong></div><Link href={`/program/${course.slug}`} aria-label={`Lihat ${course.title}`}><ArrowUpRight size={20}/></Link></div>
      </div>
    </article>
  );
}
