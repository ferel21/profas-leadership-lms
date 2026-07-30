import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Crown,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { formatRupiah } from "@/utils";

type CourseCardProps = {
  course: { slug: string; title: string; shortDescription: string; category: string; level: string; price: number; durationHours: number; rating: number; studentsCount: number; image: string; mentor?: { name: string } };
};

export const CourseCard = memo(function CourseCard({ course }: CourseCardProps) {
  const levels: Record<string, string> = { BASIC: "Dasar", INTERMEDIATE: "Menengah", ADVANCED: "Lanjutan" };
  const isMasterclass = course.level === "ADVANCED" || course.price > 1000000;
  const isTopRated = course.rating >= 4.8;
  const imageSource = course.image || "/images/profas-leadership-hero.webp";
  const isLocalImage = imageSource.startsWith("/");

  return (
    <article
      className="course-card course-card-enterprise hover-lift pf-course-card"
      data-level={course.level.toLowerCase()}
    >
      {isMasterclass && (
        <div className="pro-course-ribbon pf-course-card__ribbon">
          <Crown size={12} aria-hidden="true" />
          <span>MASTERCLASS</span>
        </div>
      )}

      <Link
        href={`/program/${course.slug}`}
        prefetch={false}
        className="course-image course-image-enterprise pf-course-card__media"
        aria-label={`Lihat ${course.title}`}
      >
        {isLocalImage ? (
          <Image
            src={imageSource}
            alt={course.title}
            fill
            sizes="(max-width: 800px) 100vw, 33vw"
          />
        ) : (
          // Remote mentor-supplied HTTPS artwork is intentionally rendered
          // without widening Next.js' global image host allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSource} alt={course.title} loading="lazy" decoding="async" />
        )}
        <span className="pf-course-card__media-shade" aria-hidden="true" />
        <span className="level-badge pf-course-card__level">
          {levels[course.level] ?? course.level}
        </span>
      </Link>

      <div className="course-body pf-course-card__body">
        <header className="pf-course-card__header">
          <div className="course-kicker-row pf-course-card__kicker-row">
            <p className="eyebrow-small pf-course-card__category">{course.category}</p>
            {isMasterclass ? (
              <span className="course-quality-badge master pf-course-card__quality">
                <Crown size={12} aria-hidden="true" />
                C-Level Exec
              </span>
            ) : isTopRated ? (
              <span className="course-quality-badge pf-course-card__quality">
                <Sparkles size={12} aria-hidden="true" />
                Pilihan Eksekutif
              </span>
            ) : null}
          </div>
          <h2 className="pf-course-card__title">
            <Link href={`/program/${course.slug}`} prefetch={false}>
              {course.title}
            </Link>
          </h2>
        </header>

        <p className="pf-course-card__description">{course.shortDescription}</p>

        {course.mentor && (
          <div className="course-mentor-chip pf-course-card__mentor">
            <span className="pro-mentor-status" aria-hidden="true" />
            <BadgeCheck size={15} aria-hidden="true" />
            <span>
              Mentor Senior: <b>{course.mentor.name}</b>
            </span>
          </div>
        )}

        <dl className="pf-course-card__facts">
          <div>
            <dt className="sr-only">Durasi</dt>
            <dd>
              <Clock3 size={15} aria-hidden="true" />
              <span>{course.durationHours} jam</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Peserta</dt>
            <dd>
              <Users size={15} aria-hidden="true" />
              <span>{course.studentsCount.toLocaleString("id-ID")}</span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Rating</dt>
            <dd>
              <Star size={15} fill="currentColor" aria-hidden="true" />
              <span>{course.rating}</span>
            </dd>
          </div>
        </dl>

        <footer className="pf-course-card__footer">
          <div className="pf-course-card__price">
            <small>Mulai dari</small>
            <strong>{formatRupiah(course.price)}</strong>
          </div>
          <Link
            href={`/program/${course.slug}`}
            prefetch={false}
            className="pf-course-card__link"
            aria-label={`Lihat ${course.title}`}
          >
            <span>Lihat program</span>
            <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </footer>
      </div>
    </article>
  );
});
