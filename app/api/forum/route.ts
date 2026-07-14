import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const forumLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

function sanitizeForumText(text: string): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/<[^>]*>?/gm, "") // strip HTML tags to prevent stored XSS / HTML injection
    .trim();
}

const forumSchema = z.object({
  title: z.string().min(5, "Judul terlalu pendek").max(120, "Judul terlalu panjang"),
  content: z.string().min(10, "Konten terlalu pendek").max(10000, "Konten terlalu panjang"),
  categoryId: z.string().min(1, "Kategori harus dipilih")
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  try {
    const where = categoryId ? { categoryId } : {};
    
    const [categories, threads] = await Promise.all([
      prisma.forumCategory.findMany({ orderBy: { order: "asc" } }),
      prisma.forumThread.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: {
          author: { select: { id: true, name: true, role: true, avatar: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { replies: true } }
        },
        take: 50
      })
    ]);

    return NextResponse.json({ categories, threads });
  } catch (error) {
    console.error("[FORUM_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch forum data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ipCheck = forumLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak membuat topik diskusi. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json().catch(() => null);
    const result = forumSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validasi gagal", details: result.error.format() }, { status: 400 });
    }

    const title = sanitizeForumText(result.data.title);
    const content = sanitizeForumText(result.data.content);
    const { categoryId } = result.data;

    if (title.length < 5 || content.length < 10) {
      return NextResponse.json({ error: "Judul atau konten tidak valid setelah pembersihan karakter berbahaya." }, { status: 400 });
    }

    const thread = await prisma.forumThread.create({
      data: {
        title,
        content,
        categoryId,
        authorId: user.id
      },
      include: {
        author: { select: { id: true, name: true, role: true, avatar: true } },
        category: { select: { id: true, name: true } },
        _count: { select: { replies: true } }
      }
    });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "CREATE_FORUM_THREAD", metadata: JSON.stringify({ threadId: thread.id }) }
    });

    return NextResponse.json(thread);
  } catch (error) {
    console.error("[FORUM_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to create thread" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ipCheck = forumLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ error: "Terlalu banyak permintaan penghapusan." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID utas diperlukan." }, { status: 400 });

  try {
    const thread = await prisma.forumThread.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!thread) return NextResponse.json({ error: "Utas diskusi tidak ditemukan." }, { status: 404 });

    const canDelete = user.role === "MENTOR" || user.role === "SUPER_ADMIN" || thread.authorId === user.id;
    if (!canDelete) {
      return NextResponse.json({ error: "Anda tidak memiliki hak akses untuk menghapus utas ini." }, { status: 403 });
    }

    await prisma.forumThread.delete({ where: { id } });

    await prisma.activityLog.create({
      data: { userId: user.id, action: "DELETE_FORUM_THREAD", metadata: JSON.stringify({ threadId: id }) }
    });

    return NextResponse.json({ success: true, message: "Utas berhasil dihapus." });
  } catch (error) {
    console.error("[FORUM_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Gagal menghapus utas diskusi" }, { status: 500 });
  }
}
