import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, Star, Users } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

type CourseCardProps = {
  course: { slug: string; title: string; shortDescription: string; category: string; level: string; price: number; durationHours: number; rating: number; studentsCount: number; image: string; mentor?: { name: string } };
};

export function CourseCard({ course }: CourseCardProps) {
  const levels: Record<string, string> = { BASIC: "Dasar", INTERMEDIATE: "Menengah", ADVANCED: "Lanjutan" };
  return (
    <article className="course-card hover-lift" style={{ borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.4)" }}>
      <Link href={`/program/${course.slug}`} className="course-image">
        <Image src={course.image} alt={course.title} fill sizes="(max-width: 800px) 100vw, 33vw" />
        <span className="level-badge">{levels[course.level] ?? course.level}</span>
      </Link>
      <div className="course-body">
        <p className="eyebrow-small">{course.category}</p>
        <h3><Link href={`/program/${course.slug}`}>{course.title}</Link></h3>
        <p>{course.shortDescription}</p>
        <div className="course-meta"><span><Clock3 size={15}/>{course.durationHours} jam</span><span><Users size={15}/>{course.studentsCount.toLocaleString("id-ID")}</span><span><Star size={15} fill="currentColor"/>{course.rating}</span></div>
        <div className="course-foot"><div><small>Mulai dari</small><strong>{formatRupiah(course.price)}</strong></div><Link href={`/program/${course.slug}`} aria-label={`Lihat ${course.title}`}><ArrowUpRight size={20}/></Link></div>
      </div>
    </article>
  );
}
