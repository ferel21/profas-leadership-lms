import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(120), password: z.string().min(6).max(128), remember: z.boolean().optional() });
const loginLimiter = rateLimit({ limit: 15, windowMs: 60 * 1000 });

export async function POST(request: Request) {
  const ipCheck = loginLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak percobaan dari IP Anda. Silakan tunggu 1 menit." }, { status: 429 });
  }
  try {
    const input = schema.parse(await request.json());
    const emailCheck = loginLimiter.check(request, input.email);
    if (!emailCheck.success) {
      return NextResponse.json({ message: "Terlalu banyak percobaan masuk untuk akun ini. Silakan tunggu 1 menit." }, { status: 429 });
    }
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user) return NextResponse.json({ message: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    if (!user.passwordHash) return NextResponse.json({ message: "Akun ini menggunakan Google. Silakan klik 'Masuk dengan Google'." }, { status: 401 });
    if (!(await bcrypt.compare(input.password, user.passwordHash!))) return NextResponse.json({ message: "Email atau kata sandi tidak sesuai." }, { status: 401 });
    await prisma.activityLog.create({ data: { userId: user.id, action: "USER_LOGIN", metadata: JSON.stringify({ method: "LOCAL" }) } }).catch(() => {});
    const token = await createToken({ userId: user.id, role: user.role, email: user.email, name: user.name, avatar: user.avatar || undefined, authProvider: user.authProvider });
    
    const response = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
    response.cookies.set("profas_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: input.remember ? 60 * 60 * 24 * 7 : undefined, path: "/" });
    return response;
  } catch {
    return NextResponse.json({ message: "Data masuk tidak valid." }, { status: 400 });
  }
}
