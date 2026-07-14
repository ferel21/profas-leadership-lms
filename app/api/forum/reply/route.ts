import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const replyLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

function sanitizeReplyText(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<[^>]*>?/gm, "") // strip HTML tags to prevent stored XSS / HTML injection
    .trim();
}

const replySchema = z.object({
  threadId: z.string().min(1, "ID Utas diperlukan"),
  content: z.string().min(2, "Balasan terlalu pendek").max(5000, "Balasan terlalu panjang"),
});

export async function POST(request: Request) {
  const ipCheck = replyLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak komentar dalam waktu singkat. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json().catch(() => null);
    const result = replySchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validasi gagal", details: result.error.format() }, { status: 400 });
    }

    const { threadId } = result.data;
    const content = sanitizeReplyText(result.data.content);

    if (content.length < 2) {
      return NextResponse.json({ error: "Konten komentar tidak valid setelah pembersihan karakter berbahaya." }, { status: 400 });
    }

    // Check if thread exists and is not locked
    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    if (thread.locked) return NextResponse.json({ error: "Thread is locked" }, { status: 403 });

    const reply = await prisma.forumReply.create({
      data: {
        threadId,
        content,
        authorId: user.id
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatar: true } }
      }
    });
    
    // Update thread updatedAt timestamp
    await prisma.forumThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "CREATE_FORUM_REPLY", metadata: JSON.stringify({ replyId: reply.id, threadId }) }
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error("[FORUM_REPLY_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ipCheck = replyLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan penghapusan." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID komentar diperlukan." }, { status: 400 });

  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id },
      select: { authorId: true, threadId: true }
    });

    if (!reply) return NextResponse.json({ error: "Komentar tidak ditemukan." }, { status: 404 });

    const canDelete = user.role === "MENTOR" || user.role === "SUPER_ADMIN" || reply.authorId === user.id;
    if (!canDelete) {
      return NextResponse.json({ error: "Anda tidak memiliki hak akses untuk menghapus komentar ini." }, { status: 403 });
    }

    await prisma.forumReply.delete({ where: { id } });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "DELETE_FORUM_REPLY", metadata: JSON.stringify({ replyId: id, threadId: reply.threadId }) }
    });

    return NextResponse.json({ success: true, message: "Komentar berhasil dihapus." });
  } catch (error) {
    console.error("[FORUM_REPLY_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Gagal menghapus komentar" }, { status: 500 });
  }
}
