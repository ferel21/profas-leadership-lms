import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { EnrollButton } from "@/components/shared/EnrollButton";
import { Footer } from "@/components/ui/Footer";
import { Header } from "@/components/ui/Header";
import { extractMentorName, findMentorProfile } from "@/constants/mentor-profiles";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { accessibleEnrollmentWhere } from "@/services/enrollment-access";
import { initials } from "@/utils";

function parseOutcomes(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const items = parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      if (items.length > 0) return items;
    }
  } catch {
    // Legacy records stored one outcome per line.
  }

  return value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
}

export default async function CourseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [course, user] = await Promise.all([
    prisma.course.findFirst({
      where: { OR: [{ slug }, { id: slug }], published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        category: true,
        level: true,
        price: true,
        enrollmentMode: true,
        durationHours: true,
        rating: true,
        studentsCount: true,
        image: true,
        outcomes: true,
        mentor: { select: { name: true, headline: true } },
        nodes: {
          orderBy: [{ parentId: "asc" }, { order: "asc" }],
          select: {
            id: true,
            parentId: true,
            title: true,
            description: true,
            type: true,
            durationMin: true,
          },
        },
        assessments: {
          where: { type: "PRETEST" },
          select: { id: true },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!course) notFound();

  const outcomes = parseOutcomes(course.outcomes);
  const lessonCount = course.nodes.filter((node) => node.type !== "FOLDER").length;
  const folders = course.nodes.filter((node) => node.type === "FOLDER");
  const enrolled = user
    ? !!(await prisma.enrollment.findFirst({
        where: accessibleEnrollmentWhere(user.id, course.id),
        select: { id: true },
      }))
    : false;
  const levelLabel =
    course.level === "BASIC"
      ? "Dasar"
      : course.level === "INTERMEDIATE"
        ? "Menengah"
        : "Lanjutan";

  /* Determine primary mentor display name — for this single-package model,
     the primary mentor is the course-level mentor (Prof. Asdar) */
  const primaryMentor = course.mentor;
  const primaryMentorProfile = findMentorProfile(primaryMentor.name);

  return (
    <>
      <Header />
      <main className="detail-page pf-detail-page">
        <section className="detail-hero pf-detail-hero" aria-labelledby="program-title">
          <div className="container detail-grid pf-detail-grid">
            <div className="pf-detail-copy">
              <nav className="breadcrumbs pf-detail-breadcrumbs" aria-label="Jejak halaman">
                <Link href="/program">Program</Link>
                <ChevronRight aria-hidden="true" />
                <span>{course.title}</span>
              </nav>

              <div className="pf-detail-meta">
                <span className="level-badge static-badge">{levelLabel}</span>
                <span>{folders.length} modul</span>
                <span>{course.durationHours} jam belajar</span>
              </div>

              <h1 id="program-title">{course.title}</h1>
              <p className="pf-detail-lead">{course.description}</p>

              <div className="detail-rating pf-detail-signal" aria-label="Ringkasan program">
                <span>
                  <Star fill="currentColor" aria-hidden="true" />
                  {course.rating}
                  <small>rating</small>
                </span>
                <i aria-hidden="true" />
                <span>
                  <Users aria-hidden="true" />
                  {course.studentsCount.toLocaleString("id-ID")}
                  <small>peserta</small>
                </span>
              </div>

              <div className="mentor-inline pf-detail-mentor-inline">
                <span className="pf-detail-mentor-avatar">
                  {primaryMentorProfile ? (
                    <Image
                      className="pf-mentor-portrait"
                      src={primaryMentorProfile.image}
                      alt={primaryMentorProfile.imageAlt}
                      width={64}
                      height={64}
                      sizes="64px"
                    />
                  ) : (
                    <span aria-hidden="true">{initials(primaryMentor.name)}</span>
                  )}
                </span>
                <div>
                  <small>Dipandu oleh praktisi</small>
                  <b>{primaryMentor.name}</b>
                  <p>{primaryMentor.headline}</p>
                </div>
              </div>
            </div>

            <aside className="enroll-card pf-enroll-card" aria-label="Pendaftaran program">
              <div className="enroll-cover pf-enroll-cover">
                <Image
                  src={course.image}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 820px) calc(100vw - 32px), 400px"
                />
                <span>
                  <PlayCircle aria-hidden="true" />
                  Lihat perjalanan program
                </span>
              </div>
              <div className="enroll-body pf-enroll-body">
                <small>Akses paket lengkap</small>
                <h2>{course.price === 0 ? "Gratis" : `Rp${course.price.toLocaleString("id-ID")}`}</h2>
                <EnrollButton
                  courseId={course.id}
                  slug={course.slug}
                  signedIn={!!user}
                  enrolled={enrolled}
                  enrollmentMode={course.enrollmentMode}
                />
                {course.enrollmentMode === "CODE" && !enrolled && (
                  <p className="pf-enroll-manual-note">Pendaftaran dan konfirmasi dilakukan oleh admin. Gunakan kode yang sudah diberikan setelah administrasi selesai.</p>
                )}
                <p className="secure-text">
                  <ShieldCheck aria-hidden="true" />
                  Akses aman dan sertifikat terverifikasi
                </p>
                <div className="pf-enroll-divider" />
                <strong>Yang tersedia untuk Anda</strong>
                <ul>
                  <li>
                    <Clock3 aria-hidden="true" />
                    <span>
                      <b>{course.durationHours} jam</b>
                      pembelajaran terarah
                    </span>
                  </li>
                  <li>
                    <BookOpen aria-hidden="true" />
                    <span>
                      <b>{lessonCount} materi</b>
                      dalam {folders.length} modul
                    </span>
                  </li>
                  <li>
                    <Globe2 aria-hidden="true" />
                    <span>
                      <b>{course.enrollmentMode === "CODE" ? "Periode kohort" : "Akses terbuka"}</b>
                      {course.enrollmentMode === "CODE" ? "sesuai jadwal organisasi" : "untuk akun terdaftar"}
                    </span>
                  </li>
                  <li>
                    <Award aria-hidden="true" />
                    <span>
                      <b>Sertifikat PROFAS</b>
                      dengan nomor verifikasi
                    </span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="section detail-content pf-detail-content">
          <div className="container detail-main pf-detail-main">
            <article>
              <header className="pf-detail-section-heading">
                <span>01 / Hasil belajar</span>
                <h2>Apa yang akan Anda kuasai</h2>
                <p>Kompetensi yang langsung dapat dibawa ke percakapan, keputusan, dan ritme kerja sehari-hari.</p>
              </header>

              <ul className="outcome-list pf-outcome-list">
                {outcomes.map((item, index) => (
                  <li key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <Check aria-hidden="true" />
                    <p>{item}</p>
                  </li>
                ))}
              </ul>

              <header className="pf-detail-section-heading pf-curriculum-heading">
                <span>02 / Rute belajar</span>
                <h2>Kurikulum program</h2>
                <p className="curriculum-intro">
                  Disusun dalam 3 modul oleh 3 profesor, agar konsep berubah menjadi praktik kepemimpinan nyata.
                </p>
              </header>

              <div className="curriculum pf-curriculum">
                {folders.map((folder, index) => {
                  const lessons = course.nodes.filter((node) => node.parentId === folder.id);
                  const mentorName = extractMentorName(folder.description);
                  return (
                    <details key={folder.id} open={index === 0}>
                      <summary>
                        <span className="pf-curriculum-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>{folder.title}</h3>
                          {mentorName && (
                            <p className="pf-curriculum-mentor">
                              <ShieldCheck aria-hidden="true" />
                              {mentorName}
                            </p>
                          )}
                          <p>{folder.description?.replace(/^.+? — /, "") ?? ""}</p>
                          <small>
                            {lessons.length} materi ·{" "}
                            {lessons.reduce((total, lesson) => total + lesson.durationMin, 0)} menit
                          </small>
                        </div>
                        <ChevronRight aria-hidden="true" />
                      </summary>
                      <div className="pf-curriculum-lessons">
                        {lessons.map((lesson) => (
                          <p key={lesson.id}>
                            {lesson.type === "VIDEO" ? (
                              <PlayCircle aria-hidden="true" />
                            ) : (
                              <BookOpen aria-hidden="true" />
                            )}
                            <span>{lesson.title}</span>
                            <small>{lesson.durationMin} menit</small>
                          </p>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            </article>

            {/* ── Mentor Panel: Show all 3 mentors ── */}
            <aside className="pf-mentor-panel" aria-label="Tim mentor">
              <span className="pf-mentor-note-index">Tim Mentor</span>
              {folders.map((folder, index) => {
                const mentorName = extractMentorName(folder.description);
                if (!mentorName) return null;
                const mentorProfile = findMentorProfile(mentorName);
                return (
                  <div key={folder.id} className="pf-mentor-panel-item">
                    <div className="pf-mentor-note-avatar">
                      {mentorProfile ? (
                        <Image
                          className="pf-mentor-portrait"
                          src={mentorProfile.image}
                          alt={mentorProfile.imageAlt}
                          width={64}
                          height={64}
                          sizes="64px"
                        />
                      ) : (
                        <span aria-hidden="true">{initials(mentorName)}</span>
                      )}
                    </div>
                    <p>Mentor Modul {index + 1}</p>
                    <h3>{mentorName}</h3>
                    <small>{folder.title}</small>
                  </div>
                );
              })}
              <blockquote>
                &ldquo;Strategi baru menjadi kepemimpinan ketika ia terlihat dalam keputusan dan perilaku tim.&rdquo;
              </blockquote>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
