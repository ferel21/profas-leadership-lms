import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({ where: { userId: user.id, read: false } });

  return NextResponse.json({ notifications, unreadCount });
}

const patchSchema = z.object({
  action: z.enum(["read", "read_all"]),
  id: z.string().optional(),
});

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });

  if (parsed.data.action === "read_all") {
    await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
  } else if (parsed.data.id) {
    await prisma.notification.updateMany({ where: { id: parsed.data.id, userId: user.id }, data: { read: true } });
  }

  return NextResponse.json({ success: true });
}
