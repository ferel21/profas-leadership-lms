import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProgramCatalog } from "@/components/ProgramCatalog";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export default async function ProgramsPage() {
  const courses = await prisma.course.findMany({ where: { published: true }, select: { id:true,slug:true,title:true,shortDescription:true,category:true,level:true,price:true,durationHours:true,rating:true,studentsCount:true,image:true,mentor:{select:{name:true}} } });
  return <><Header/><main className="catalog-page"><section className="catalog-hero"><div className="container"><span className="eyebrow">PROGRAM PROFAS LEADERSHIP</span><h1>Temukan jalur tumbuh<br/><em>yang tepat untuk Anda.</em></h1><p>Program terstruktur, kontekstual, dan terukur untuk setiap tahap kepemimpinan.</p></div></section><ProgramCatalog courses={courses}/></main><Footer/></>;
}
