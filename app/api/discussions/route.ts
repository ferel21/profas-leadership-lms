import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const discussionLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

function sanitizeDiscussionText(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<[^>]*>?/gm, "") // strip HTML tags to prevent stored XSS / HTML injection
    .trim();
}

const lessonSchema = z.string().min(1);
const postSchema = z.object({
  lessonId: z.string().min(1).optional(),
  nodeId: z.string().min(1).optional(),
  content: z.string().trim().min(3).max(1000)
}).refine(data => Boolean(data.lessonId || data.nodeId), {
  message: "ID materi atau node diperlukan."
});

async function canAccessLesson(user: { id: string; role: string }, lessonId: string) {
  if (user.role === "SUPER_ADMIN") return true;
  const node = await prisma.courseNode.findFirst({
    where: {
      id: lessonId,
      course: {
        published: true,
        OR: [
          { enrollments: { some: { userId: user.id } } },
          { mentorId: user.id }
        ]
      }
    },
    select: { id: true },
  });
  return Boolean(node);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  const searchParams = new URL(request.url).searchParams;
  const lessonId = searchParams.get("lessonId") || searchParams.get("nodeId");
  if (!lessonSchema.safeParse(lessonId).success || !lessonId) {
    return NextResponse.json({ message: "Materi tidak valid." }, { status: 400 });
  }
  if (!await canAccessLesson(user, lessonId)) {
    return NextResponse.json({ message: "Anda tidak memiliki akses ke materi ini." }, { status: 403 });
  }
  const posts = await prisma.discussionPost.findMany({
    where: { nodeId: lessonId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(posts.reverse());
}

export async function POST(request: Request) {
  const ipCheck = discussionLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak komentar dalam waktu singkat. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Tuliskan diskusi antara 3–1000 karakter." }, { status: 400 });
  
  const targetId = parsed.data.lessonId || parsed.data.nodeId;
  if (!targetId || !await canAccessLesson(user, targetId)) {
    return NextResponse.json({ message: "Anda tidak memiliki akses ke materi ini." }, { status: 403 });
  }

  const cleanContent = sanitizeDiscussionText(parsed.data.content);
  if (cleanContent.length < 3) {
    return NextResponse.json({ message: "Konten diskusi tidak valid setelah pembersihan karakter berbahaya." }, { status: 400 });
  }

  const post = await prisma.discussionPost.create({
    data: { userId: user.id, nodeId: targetId, content: cleanContent },
    select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(post, { status: 201 });
}

export async function DELETE(request: Request) {
  const ipCheck = discussionLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan penghapusan." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID diskusi diperlukan." }, { status: 400 });

  try {
    const post = await prisma.discussionPost.findUnique({
      where: { id },
      select: { userId: true, nodeId: true, node: { select: { course: { select: { mentorId: true } } } } }
    });

    if (!post) return NextResponse.json({ message: "Komentar diskusi tidak ditemukan." }, { status: 404 });

    const canDelete = user.role === "SUPER_ADMIN" || post.userId === user.id || (user.role === "MENTOR" && post.node.course.mentorId === user.id);
    if (!canDelete) {
      return NextResponse.json({ message: "Anda tidak memiliki hak akses untuk menghapus diskusi ini." }, { status: 403 });
    }

    await prisma.discussionPost.delete({ where: { id } });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "DELETE_DISCUSSION_POST", metadata: JSON.stringify({ postId: id, nodeId: post.nodeId }) }
    });

    return NextResponse.json({ success: true, message: "Komentar diskusi berhasil dihapus." });
  } catch (error) {
    console.error("[DISCUSSION_DELETE_ERROR]", error);
    return NextResponse.json({ message: "Gagal menghapus komentar diskusi." }, { status: 500 });
  }
}
