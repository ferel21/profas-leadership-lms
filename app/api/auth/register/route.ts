import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Persona, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(3).max(80),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(128),
  persona: z.nativeEnum(Persona),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const duplicate = await prisma.user.findFirst({ where: { OR: [{ email: input.email }, { username: input.username }] }, select: { email: true, username: true } });
    if (duplicate) return NextResponse.json({ message: duplicate.email === input.email ? "Email sudah terdaftar." : "Nama akun sudah digunakan." }, { status: 409 });
    const user = await prisma.user.create({ data: { name: input.name, username: input.username, email: input.email, passwordHash: await bcrypt.hash(input.password, 10), persona: input.persona, role: "STUDENT" } });
    
    const token = await createToken({ userId: user.id, role: user.role, email: user.email, name: user.name, avatar: user.avatar || undefined, authProvider: "LOCAL" });
    
    const response = NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } }, { status: 201 });
    response.cookies.set("profas_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 604800, path: "/" });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Mohon lengkapi data dengan format yang benar." }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ message: "Email atau nama akun sudah digunakan." }, { status: 409 });
    return NextResponse.json({ message: "Pendaftaran belum berhasil." }, { status: 500 });
  }
}
