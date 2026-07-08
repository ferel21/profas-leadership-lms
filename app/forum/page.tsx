import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import Link from "next/link";
import { formatDate, initials } from "@/lib/utils";
import { MessageSquare, Pin, Search, Plus } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ForumPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  const { c: categoryId } = await searchParams;

  const [categories, threads] = await Promise.all([
    prisma.forumCategory.findMany({ orderBy: { order: "asc" } }),
    prisma.forumThread.findMany({
      where: categoryId ? { categoryId } : {},
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { id: true, name: true, role: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { replies: true } }
      },
      take: 50
    })
  ]);

  return (
    <DashboardChrome user={user}>
      <div className="dash-title dash-title-flex">
        <div>
          <h1>Komunitas & Diskusi</h1>
          <p>Tanya jawab, berbagi insight, dan kembangkan jejaring dengan sesama peserta dan mentor.</p>
        </div>
        <Link href="/forum/buat" className="btn btn-primary">
          <Plus size={18} /> Buat Diskusi Baru
        </Link>
      </div>

      <div className="forum-layout forum-grid-layout">
        <aside className="forum-sidebar">
          <div className="data-card">
            <h3 className="forum-cat-head">Kategori</h3>
            <div className="category-list forum-cat-list">
              <Link 
                href="/forum" 
                className={`category-item forum-cat-item ${!categoryId ? "active" : ""}`}
              >
                Semua Diskusi
              </Link>
              {categories.map(cat => (
                <Link 
                  key={cat.id} 
                  href={`/forum?c=${cat.id}`}
                  className={`category-item forum-cat-item ${categoryId === cat.id ? "active" : ""}`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="forum-content">
          <div className="data-card forum-card-p0">
            <div className="forum-card-head">
              <h2 className="forum-card-title">Utas Terbaru</h2>
              <div className="search-box forum-search-box">
                <Search size={16} />
                <input type="text" placeholder="Cari diskusi..." />
              </div>
            </div>

            <div className="thread-list">
              {threads.length === 0 ? (
                <div className="forum-empty-box">
                  <MessageSquare size={48} className="forum-empty-icon" />
                  <p>Belum ada diskusi di kategori ini.</p>
                </div>
              ) : (
                threads.map(thread => (
                  <Link href={`/forum/${thread.id}`} key={thread.id} className="thread-row forum-thread-row">
                    <div className="forum-thread-avatar-wrap">
                      <span className="forum-thread-avatar">
                        {initials(thread.author.name)}
                      </span>
                    </div>
                    <div className="forum-thread-main">
                      <div className="forum-thread-meta">
                        {thread.pinned && <span className="forum-pin-icon"><Pin size={14} fill="currentColor"/></span>}
                        <span className="meta-badge forum-cat-badge">{thread.category.name}</span>
                        {(thread.author.role === "MENTOR" || thread.author.role === "SUPER_ADMIN") && (
                          <span className="pro-expert-badge forum-pro-badge">
                            👑 {thread.author.role === "MENTOR" ? "Mentor Eksekutif" : "Fasilitator PROFAS"}
                          </span>
                        )}
                      </div>
                      <h3 className="forum-thread-title">{thread.title}</h3>
                      <p className="forum-thread-author-line">
                        Mulai oleh <b className={thread.author.role === "MENTOR" ? "forum-author-mentor" : "forum-author-normal"}>{thread.author.name}</b> • {formatDate(thread.createdAt)}
                      </p>
                    </div>
                    <div className="forum-thread-replies">
                      <MessageSquare size={16} />
                      <b>{thread._count.replies}</b> balasan
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </DashboardChrome>
  );
}
