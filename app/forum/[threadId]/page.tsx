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
      <div className="forum-thread-wrapper">
        <div className="mb-8">
          <Link href="/forum" className="btn btn-outline btn-small mb-4 inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Kembali ke Forum
          </Link>
          <div className="flex gap-2 items-center mb-2">
            <span className="meta-badge type-lesson">{thread.category.name}</span>
            {thread.pinned && (
              <span className="text-amber-500 flex items-center gap-1 text-sm font-bold">
                <Pin size={14} fill="currentColor"/> Pinned
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 m-0">{thread.title}</h1>
        </div>

        {/* Original Post */}
        <div className="forum-thread-card hover-lift">
          <div className="forum-author-bar">
            <div className="forum-avatar-circle">
              {initials(thread.author.name)}
            </div>
            <div>
              <h3 className="m-0 text-lg text-slate-900 font-bold flex items-center gap-2">
                {thread.author.name}
                {thread.author.role === "MENTOR" && (
                  <span className="forum-mentor-badge">
                    <Shield size={12}/> MENTOR
                  </span>
                )}
              </h3>
              <small className="text-slate-500">Mulai: {formatDate(thread.createdAt)}</small>
            </div>
          </div>
          <div className="forum-post-content">
            {thread.content}
          </div>
        </div>

        {/* Replies */}
        <h3 className="mb-6 text-slate-600 flex items-center gap-2 font-bold text-lg">
          <MessageSquare size={18} /> {thread.replies.length} Balasan
        </h3>

        <div className="flex flex-col gap-4 mb-8">
          {thread.replies.map(reply => (
            <div key={reply.id} className="forum-thread-card">
              <div className="flex gap-4 mb-4 items-center">
                <div className="forum-avatar-circle forum-avatar-sm">
                  {initials(reply.author.name)}
                </div>
                <div>
                  <h4 className="m-0 text-base text-slate-900 font-bold flex items-center gap-2">
                    {reply.author.name}
                    {reply.author.role === "MENTOR" && (
                      <span className="forum-mentor-badge">MENTOR</span>
                    )}
                  </h4>
                  <small className="text-slate-400">{formatDate(reply.createdAt)}</small>
                </div>
              </div>
              <div className="forum-reply-content">
                {reply.content}
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        {!thread.locked ? (
          <div className="forum-reply-box">
            <h3 className="m-0 mb-4 text-lg font-bold text-slate-800">Tulis Balasan</h3>
            <form className="flex flex-col gap-4">
              <textarea 
                placeholder="Tulis pendapat atau pertanyaan Anda di sini..."
                className="forum-textarea"
              />
              <button type="button" className="btn btn-primary self-end">Kirim Balasan</button>
            </form>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-100 rounded-xl text-slate-500 font-medium">
            Diskusi ini telah dikunci dan tidak menerima balasan baru.
          </div>
        )}
      </div>
    </DashboardChrome>
  );
}
