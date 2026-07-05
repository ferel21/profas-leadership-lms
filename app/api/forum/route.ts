import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const forumSchema = z.object({
  title: z.string().min(5, "Judul terlalu pendek").max(100, "Judul terlalu panjang"),
  content: z.string().min(10, "Konten terlalu pendek"),
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
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json();
    const result = forumSchema.safeParse(json);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validasi gagal", details: result.error.format() }, { status: 400 });
    }

    const { title, content, categoryId } = result.data;

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
