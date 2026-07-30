import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/ui/DashboardChrome";
import { ForumThreadForm } from "@/components/shared/ForumThreadForm";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";

export default async function CreateForumThreadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  const categories = await prisma.forumCategory.findMany({
    select: { id: true, name: true, description: true },
    orderBy: { order: "asc" },
  });

  return (
    <DashboardChrome user={user}>
      <div className="pf-form-page">
        <Link href="/forum" className="pf-back-link">
          <ArrowLeft aria-hidden="true" /> Kembali ke komunitas
        </Link>
        <header className="dash-title">
          <span className="pf-page-kicker">Komunitas PROFAS</span>
          <h1>Buat diskusi baru</h1>
          <p>Ajukan pertanyaan atau bagikan insight yang bermanfaat bagi peserta dan mentor.</p>
        </header>
        <section className="data-card pf-form-card" aria-label="Form diskusi baru">
          {categories.length > 0 ? (
            <ForumThreadForm categories={categories} />
          ) : (
            <div className="pf-role-empty">
              <p>Belum ada kategori forum. Hubungi Admin untuk menyiapkan kategori diskusi.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardChrome>
  );
}
