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
      <div className="dash-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Komunitas & Diskusi</h1>
          <p>Tanya jawab, berbagi insight, dan kembangkan jejaring dengan sesama peserta dan mentor.</p>
        </div>
        <Link href="/forum/buat" className="btn btn-primary">
          <Plus size={18} /> Buat Diskusi Baru
        </Link>
      </div>

      <div className="forum-layout" style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "2rem", marginTop: "2rem", alignItems: "start" }}>
        <aside className="forum-sidebar">
          <div className="data-card">
            <h3 style={{ fontSize: "1rem", marginBottom: "1rem", color: "#0f172a" }}>Kategori</h3>
            <div className="category-list" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link 
                href="/forum" 
                className={`category-item ${!categoryId ? "active" : ""}`}
                style={{ padding: "0.75rem", borderRadius: "8px", textDecoration: "none", color: !categoryId ? "#0d9488" : "#475569", background: !categoryId ? "#f0fdfa" : "transparent", fontWeight: !categoryId ? "600" : "400" }}
              >
                Semua Diskusi
              </Link>
              {categories.map(cat => (
                <Link 
                  key={cat.id} 
                  href={`/forum?c=${cat.id}`}
                  className={`category-item ${categoryId === cat.id ? "active" : ""}`}
                  style={{ padding: "0.75rem", borderRadius: "8px", textDecoration: "none", color: categoryId === cat.id ? "#0d9488" : "#475569", background: categoryId === cat.id ? "#f0fdfa" : "transparent", fontWeight: categoryId === cat.id ? "600" : "400" }}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <main className="forum-content">
          <div className="data-card" style={{ padding: "0" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.25rem", margin: 0 }}>Utas Terbaru</h2>
              <div className="search-box" style={{ maxWidth: "300px" }}>
                <Search size={16} />
                <input type="text" placeholder="Cari diskusi..." />
              </div>
            </div>

            <div className="thread-list">
              {threads.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                  <MessageSquare size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
                  <p>Belum ada diskusi di kategori ini.</p>
                </div>
              ) : (
                threads.map(thread => (
                  <Link href={`/forum/${thread.id}`} key={thread.id} style={{ display: "flex", padding: "1.5rem", borderBottom: "1px solid #f1f5f9", textDecoration: "none", color: "inherit", transition: "background 0.2s" }} className="thread-row">
                    <div style={{ marginRight: "1rem" }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "#e2e8f0", color: "#475569", fontWeight: "bold", fontSize: "0.875rem" }}>
                        {initials(thread.author.name)}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem" }}>
                        {thread.pinned && <span style={{ color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "2px" }}><Pin size={14} fill="currentColor"/></span>}
                        <span className="meta-badge" style={{ fontSize: "0.65rem", padding: "2px 6px" }}>{thread.category.name}</span>
                      </div>
                      <h3 style={{ fontSize: "1.125rem", color: "#0f172a", margin: "0 0 0.25rem 0", fontWeight: "600" }}>{thread.title}</h3>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                        Mulai oleh <b>{thread.author.name}</b> • {formatDate(thread.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.875rem" }}>
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
