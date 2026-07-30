import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { z } from "zod";
import { rateLimit } from "@/services/rate-limit";

const notifLimiter = rateLimit({ limit: 40, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = notifLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan notifikasi." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  try {
    // Keep both reads on one checkout. This matters for Supabase transaction
    // poolers configured with connection_limit=1, which are common in local
    // previews and should not make the decorative sidebar fail.
    const [notifications, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);

    return NextResponse.json(
      { notifications, unreadCount },
      { headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" } }
    );
  } catch (error) {
    // Notifications are non-critical chrome. Render an empty state while the
    // database recovers instead of turning a sidebar refresh into a runtime
    // error page.
    if (process.env.NODE_ENV === "development") {
      console.warn("Unable to load notifications", error);
    }
    return NextResponse.json(
      { notifications: [], unreadCount: 0 },
      { headers: { "Cache-Control": "private, max-age=5" } }
    );
  }
}

const patchSchema = z.object({
  action: z.enum(["read", "read_all"]),
  id: z.string().optional(),
});

export async function PATCH(request: Request) {
  const ipCheck = notifLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan pembaruan notifikasi." }, { status: 429 });
  }

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

export async function DELETE(request: Request) {
  const ipCheck = notifLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan penghapusan notifikasi." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Silakan masuk." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  if (action === "clear_all") {
    await prisma.notification.deleteMany({ where: { userId: user.id } });
  } else if (action === "clear_read") {
    await prisma.notification.deleteMany({ where: { userId: user.id, read: true } });
  } else if (id && typeof id === "string") {
    await prisma.notification.deleteMany({ where: { id: id.trim(), userId: user.id } });
  } else {
    return NextResponse.json({ message: "Parameter penghapusan tidak valid." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
