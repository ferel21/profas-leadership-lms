import Link from "next/link";
import { ArrowRight, Award, BookOpen, Clock3, ShieldCheck, Users } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { extractMentorName } from "@/constants/mentor-profiles";
import { cachedQuery, prisma } from "@/services/prisma";

export const revalidate = 3600;

type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  level: string;
  price: number;
  durationHours: number;
  rating: number;
  studentsCount: number;
  image: string;
  mentor: { name: string };
  nodes: { id: string; parentId: string | null; title: string; description: string | null; type: string }[];
};

const getCachedCourse = cachedQuery(
  () => prisma.course.findFirst({
    where: { published: true, slug: "profas-leadership" },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      description: true,
      category: true,
      level: true,
      price: true,
      durationHours: true,
      rating: true,
      studentsCount: true,
      image: true,
      mentor: { select: { name: true } },
      nodes: {
        where: { type: "FOLDER" },
        orderBy: { order: "asc" },
        select: { id: true, parentId: true, title: true, description: true, type: true },
      },
    },
  }),
  ["program-catalog-single"],
  3600,
);

async function getCourse(): Promise<CatalogCourse | null> {
  try {
    const course = await getCachedCourse();
    if (!course) return null;
    return {
      ...course,
      description: course.description ?? "",
      mentor: { name: course.mentor?.name ?? "Mentor PROFAS" },
      nodes: course.nodes.map(n => ({ ...n, parentId: n.parentId ?? null, description: n.description ?? null })),
    };
  } catch (error) {
    console.warn("[PROGRAM_CATALOG_FALLBACK]", error);
    return null;
  }
}

function extractModuleDesc(description: string | null): string | null {
  if (!description) return null;
  const match = description.match(/— (.+)/);
  return match ? match[1] : description;
}

export default async function ProgramsPage() {
  const course = await getCourse();
  const modules = course?.nodes ?? [];

  return (
    <div className="pf-public-page">
      <Header />
      <main>
        <section className="pf-section pf-hero pf-catalog-hero" aria-labelledby="catalog-title">
          <div className="container pf-hero-layout pf-catalog-hero-layout">
            <div className="pf-hero-copy pf-catalog-hero-copy">
              <span className="pf-kicker">
                <span aria-hidden="true" />
                PROGRAM PROFAS LEADERSHIP
              </span>
              <h1 id="catalog-title">
                Satu paket,<br />
                {" "}<em>tiga pilar kepemimpinan.</em>
              </h1>
              <p className="pf-hero-lead">
                Program terstruktur dari 3 profesor terbaik untuk membangun
                kepemimpinan, pertumbuhan diri, dan kewirausahaan Anda.
              </p>
            </div>
            <aside className="pf-catalog-hero-aside" aria-label="Peta jalur program">
              <div className="pf-catalog-route-card">
                <div className="pf-catalog-route-heading">
                  <span>PROFAS LEADERSHIP</span>
                  <b>3 modul</b>
                </div>
                <h2>Mulai dari pilar yang paling dekat.</h2>
                <div className="pf-catalog-route-list">
                  {modules.length > 0 ? modules.map((mod, index) => (
                    <div className="pf-catalog-route-step" key={mod.id}>
                      <span className="pf-catalog-route-number">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <small>Modul {index + 1}</small>
                        <strong>{mod.title}</strong>
                      </div>
                    </div>
                  )) : (
                    <div className="pf-catalog-route-step">
                      <span className="pf-catalog-route-number">01</span>
                      <div>
                        <small>Mulai</small>
                        <strong>Pilih ruang tumbuh Anda</strong>
                      </div>
                    </div>
                  )}
                </div>
                <p>Semua modul terbuka setelah mendaftar. Belajar sesuai ritme Anda.</p>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Package Detail Section ── */}
        <section className="pf-section pf-catalog-package" aria-label="Detail paket PROFAS Leadership">
          <div className="container">
            <div className="pf-package-detail">
              {/* Package Info */}
              <div className="pf-package-detail-info">
                <div className="pf-package-detail-badge">1 PAKET · 3 MODUL · Rp499.000</div>
                <h2>PROFAS LEADERSHIP</h2>
                <p>{course?.description ?? "Program intensif yang memadukan tiga pilar utama — kepemimpinan, pertumbuhan diri, dan kewirausahaan."}</p>

                <div className="pf-package-detail-stats">
                  <div>
                    <Clock3 aria-hidden="true" />
                    <span><b>{course?.durationHours ?? 24} jam</b> pembelajaran</span>
                  </div>
                  <div>
                    <Users aria-hidden="true" />
                    <span><b>{(course?.studentsCount ?? 2500).toLocaleString("id-ID")}</b> peserta</span>
                  </div>
                  <div>
                    <Award aria-hidden="true" />
                    <span><b>Sertifikat</b> terverifikasi</span>
                  </div>
                </div>
              </div>

              {/* Module Cards */}
              <div className="pf-package-modules-grid">
                {modules.map((mod, index) => {
                  const mentorName = extractMentorName(mod.description);
                  const moduleDesc = extractModuleDesc(mod.description);
                  return (
                    <article key={mod.id} className="pf-package-module-card">
                      <div className="pf-package-module-card-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3>{mod.title}</h3>
                      <p>{moduleDesc}</p>
                      {mentorName && (
                        <div className="pf-package-module-card-mentor">
                          <ShieldCheck aria-hidden="true" />
                          <span>{mentorName}</span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="pf-package-detail-cta">
                <div className="pf-package-detail-price">
                  <small>Investasi untuk 3 modul lengkap</small>
                  <strong>Rp499.000</strong>
                </div>
                <Link
                  href={`/program/${course?.slug ?? "profas-leadership"}`}
                  className="pf-home-button pf-home-button-primary"
                >
                  <BookOpen aria-hidden="true" />
                  Lihat detail & mulai belajar
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
