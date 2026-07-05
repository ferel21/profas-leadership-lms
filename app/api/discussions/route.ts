import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const lessonSchema = z.string().min(1);
const postSchema = z.object({ lessonId: z.string().min(1), content: z.string().trim().min(3).max(1000) });

async function canAccessLesson(userId: string, lessonId: string) {
  return prisma.courseNode.findFirst({
    where: { id: lessonId, course: { published: true, enrollments: { some: { userId } } } },
    select: { id: true },
  });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  const lessonId = new URL(request.url).searchParams.get("lessonId");
  if (!lessonSchema.safeParse(lessonId).success) return NextResponse.json({ message: "Materi tidak valid." }, { status: 400 });
  if (!await canAccessLesson(user.id, lessonId!)) return NextResponse.json({ message: "Anda tidak memiliki akses ke materi ini." }, { status: 403 });
  const posts = await prisma.discussionPost.findMany({
    where: { nodeId: lessonId! },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(posts.reverse());
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Tuliskan diskusi antara 3–1000 karakter." }, { status: 400 });
  if (!await canAccessLesson(user.id, parsed.data.lessonId)) return NextResponse.json({ message: "Anda tidak memiliki akses ke materi ini." }, { status: 403 });
  const post = await prisma.discussionPost.create({
    data: { userId: user.id, nodeId: parsed.data.lessonId, content: parsed.data.content },
    select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(post, { status: 201 });
}
