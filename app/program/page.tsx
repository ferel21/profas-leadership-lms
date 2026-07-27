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
  return (
    <div className="pf-public-page">
      <Header />
      <main>
        <section className="pf-section pf-hero" aria-labelledby="catalog-title" style={{ paddingBottom: '48px', minHeight: 'auto', background: 'transparent' }}>
          <div className="container pf-hero-layout" style={{ minHeight: 'auto', gridTemplateColumns: '1fr', paddingBottom: '0', gap: '24px' }}>
            <div className="pf-hero-copy" style={{ paddingTop: '12px' }}>
              <span className="pf-kicker">
                <span aria-hidden="true" />
                PROGRAM PROFAS LEADERSHIP
              </span>
              <h1 id="catalog-title">
                Temukan jalur tumbuh<br />
                <em>yang tepat untuk Anda.</em>
              </h1>
              <p className="pf-hero-lead">
                Program terstruktur, kontekstual, dan terukur untuk setiap tahap kepemimpinan.
              </p>
            </div>
          </div>
        </section>
        <ProgramCatalog courses={courses} />
      </main>
      <Footer />
    </div>
  );
}
