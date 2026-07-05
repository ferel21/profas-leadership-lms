import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const replySchema = z.object({
  threadId: z.string().min(1, "ID Utas diperlukan"),
  content: z.string().min(2, "Balasan terlalu pendek"),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json();
    const result = replySchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validasi gagal", details: result.error.format() }, { status: 400 });
    }

    const { threadId, content } = result.data;

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
