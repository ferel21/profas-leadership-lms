import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardChrome } from "@/components/DashboardChrome";
import Link from "next/link";
import { formatDate, initials } from "@/lib/utils";
import { ArrowLeft, MessageSquare, Pin, Shield } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function ForumThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  const { threadId } = await params;

  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    include: {
      author: { select: { id: true, name: true, role: true } },
      category: { select: { id: true, name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, role: true } }
        }
      }
    }
  });

  if (!thread) notFound();

  return (
    <DashboardChrome user={user}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/forum" className="btn btn-outline btn-small" style={{ marginBottom: "1rem", display: "inline-flex" }}>
            <ArrowLeft size={16} /> Kembali ke Forum
          </Link>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
            <span className="meta-badge type-lesson">{thread.category.name}</span>
            {thread.pinned && <span style={{ color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.875rem", fontWeight: "bold" }}><Pin size={14} fill="currentColor"/> Pinned</span>}
          </div>
          <h1 style={{ fontSize: "2rem", color: "#0f172a", margin: "0 0 1rem 0" }}>{thread.title}</h1>
        </div>

        {/* Original Post */}
        <div className="data-card" style={{ marginBottom: "1.5rem", padding: "2rem" }}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-primary)", color: "#fff", fontWeight: "bold", fontSize: "1.125rem" }}>
              {initials(thread.author.name)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {thread.author.name}
                {thread.author.role === "MENTOR" && <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "0.75rem", padding: "2px 8px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "4px" }}><Shield size={12}/> MENTOR</span>}
              </h3>
              <small style={{ color: "#64748b" }}>Mulai: {formatDate(thread.createdAt)}</small>
            </div>
          </div>
          <div style={{ color: "#334155", lineHeight: 1.7, fontSize: "1rem", whiteSpace: "pre-wrap" }}>
            {thread.content}
          </div>
        </div>

        {/* Replies */}
        <h3 style={{ marginBottom: "1.5rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <MessageSquare size={18} /> {thread.replies.length} Balasan
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {thread.replies.map(reply => (
            <div key={reply.id} className="data-card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "#e2e8f0", color: "#475569", fontWeight: "bold", fontSize: "0.875rem" }}>
                  {initials(reply.author.name)}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {reply.author.name}
                    {reply.author.role === "MENTOR" && <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px" }}>MENTOR</span>}
                  </h4>
                  <small style={{ color: "#94a3b8" }}>{formatDate(reply.createdAt)}</small>
                </div>
              </div>
              <div style={{ color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {reply.content}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {!thread.locked ? (
          <div className="data-card" style={{ padding: "2rem", background: "#f8fafc" }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem" }}>Tulis Balasan</h3>
            <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <textarea 
                placeholder="Tulis pendapat atau pertanyaan Anda di sini..."
                style={{ width: "100%", minHeight: "150px", padding: "1rem", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "vertical", fontFamily: "inherit" }}
              />
              <button type="button" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>Kirim Balasan</button>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "2rem", background: "#f1f5f9", borderRadius: "12px", color: "#64748b" }}>
            Diskusi ini telah dikunci dan tidak menerima balasan baru.
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}
