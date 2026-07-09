import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Crown, Sparkles, Star, Users } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

type CourseCardProps = {
  course: { slug: string; title: string; shortDescription: string; category: string; level: string; price: number; durationHours: number; rating: number; studentsCount: number; image: string; mentor?: { name: string } };
};

export function CourseCard({ course }: CourseCardProps) {
  const levels: Record<string, string> = { BASIC: "Dasar", INTERMEDIATE: "Menengah", ADVANCED: "Lanjutan" };
  const isMasterclass = course.level === "ADVANCED" || course.price > 1000000;
  const isTopRated = course.rating >= 4.8;

  return (
    <article className="course-card course-card-enterprise hover-lift">
      {isMasterclass && <div className="pro-course-ribbon">MASTERCLASS</div>}
      <Link href={`/program/${course.slug}`} className="course-image course-image-enterprise">
        <Image src={course.image} alt={course.title} fill sizes="(max-width: 800px) 100vw, 33vw" />
        <span className="level-badge">{levels[course.level] ?? course.level}</span>
      </Link>
      <div className="course-body">
        <div className="course-kicker-row">
          <p className="eyebrow-small">{course.category}</p>
          {isMasterclass ? (
            <span className="course-quality-badge master"><Crown size={12} /> C-Level Exec</span>
          ) : isTopRated ? (
            <span className="course-quality-badge"><Sparkles size={12} /> Pilihan Eksekutif</span>
          ) : null}
        </div>
        <h3><Link href={`/program/${course.slug}`}>{course.title}</Link></h3>
        <p>{course.shortDescription}</p>
        {course.mentor && (
          <div className="course-mentor-chip">
            <span className="pro-mentor-status"></span>
            <span>Mentor Senior: <b>{course.mentor.name}</b></span>
          </div>
        )}
        <div className="course-meta"><span><Clock3 size={15}/>{course.durationHours} jam</span><span><Users size={15}/>{course.studentsCount.toLocaleString("id-ID")}</span><span><Star size={15} fill="currentColor"/>{course.rating}</span></div>
        <div className="course-foot"><div><small>Mulai dari</small><strong>{formatRupiah(course.price)}</strong></div><Link href={`/program/${course.slug}`} aria-label={`Lihat ${course.title}`}><ArrowUpRight size={20}/></Link></div>
      </div>
    </article>
  );
}
