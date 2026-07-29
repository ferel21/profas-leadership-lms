import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { ProgramCatalog } from "@/components/shared/ProgramCatalog";
import { cachedQuery, prisma } from "@/services/prisma";

export const revalidate = 3600;

type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  level: string;
  price: number;
  durationHours: number;
  rating: number;
  studentsCount: number;
  image: string;
  mentor: { name: string };
};

const getCachedCourses = cachedQuery(
  () => prisma.course.findMany({
    where: { published: true },
    select: {
      id: true,
      slug: true,
      title: true,
      shortDescription: true,
      category: true,
      level: true,
      price: true,
      durationHours: true,
      rating: true,
      studentsCount: true,
      image: true,
      mentor: { select: { name: true } },
    },
  }),
  ["program-catalog"],
  3600,
);

async function getCourses(): Promise<CatalogCourse[]> {
  try {
    const courses = await getCachedCourses();
    return courses.map(course => ({
      ...course,
      mentor: { name: course.mentor?.name ?? "Mentor PROFAS" },
    }));
  } catch (error) {
    console.warn("[PROGRAM_CATALOG_FALLBACK]", error);
    return [];
  }
}

export default async function ProgramsPage() {
  const courses = await getCourses();
  const routeSteps = courses.slice(0, 3).map((course, index) => ({
    number: String(index + 1).padStart(2, "0"),
    label: index === 0 ? "Fondasi" : index === 1 ? "Penguatan" : "Strategi",
    category: course.category,
    title: course.title,
  }));
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
                Temukan jalur tumbuh<br />
                {" "}<em>yang tepat untuk Anda.</em>
              </h1>
              <p className="pf-hero-lead">
                Program terstruktur, kontekstual, dan terukur untuk setiap tahap kepemimpinan.
              </p>
            </div>
            <aside className="pf-catalog-hero-aside" aria-label="Peta jalur program">
              <div className="pf-catalog-route-card">
                <div className="pf-catalog-route-heading">
                  <span>JALUR BELAJAR</span>
                  <b>{courses.length} program</b>
                </div>
                <h2>Mulai dari tantangan yang paling dekat.</h2>
                <div className="pf-catalog-route-list">
                  {(routeSteps.length ? routeSteps : [{ number: "01", label: "Mulai", category: "Program PROFAS", title: "Pilih ruang tumbuh Anda" }]).map(step => (
                    <div className="pf-catalog-route-step" key={`${step.number}-${step.title}`}>
                      <span className="pf-catalog-route-number">{step.number}</span>
                      <div>
                        <small>{step.label} · {step.category}</small>
                        <strong>{step.title}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <p>Pilih satu program. Ritme belajar dibangun dari langkah yang bisa dijalankan hari ini.</p>
              </div>
            </aside>
          </div>
        </section>
        <ProgramCatalog courses={courses} />
      </main>
      <Footer />
    </div>
  );
}
