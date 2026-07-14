import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";

const userLimiter = rateLimit({ limit: 40, windowMs: 60 * 1000 });

export async function GET(request: Request) {
  const ipCheck = userLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan data pengguna. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak. Hanya Super Admin yang berhak." }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        authProvider: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            mentoredCourses: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(users);
  } catch (err: unknown) {
    console.error("Get Users Error:", err);
    return NextResponse.json({ message: "Gagal mengambil daftar pengguna." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const ipCheck = userLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan pembuatan pengguna. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak. Hanya Super Admin yang berhak." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Data pengguna tidak valid." }, { status: 400 });
    }

    const { name, email, role = "STUDENT", authProvider = "GOOGLE" } = body;

    if (!name || typeof name !== "string" || !email || typeof email !== "string") {
      return NextResponse.json({ message: "Nama dan email wajib diisi." }, { status: 400 });
    }

    const cleanName = name.replace(/<[^>]*>?/gm, "").trim().slice(0, 100);
    const cleanEmail = email.trim().toLowerCase().slice(0, 150);
    if (!cleanName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ message: "Format nama atau email tidak valid." }, { status: 400 });
    }

    const validRole = Object.values(Role).includes(role as Role) ? (role as Role) : Role.STUDENT;

    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (existingUser) {
      return NextResponse.json({ message: "Email pengguna sudah terdaftar di sistem." }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        role: validRole,
        authProvider: typeof authProvider === "string" ? authProvider.slice(0, 50) : "GOOGLE",
        passwordHash: "",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2a6ba7&color=fff`
      }
    });

    const userRow = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      authProvider: newUser.authProvider,
      createdAt: newUser.createdAt.toISOString(),
      _count: {
        enrollments: 0,
        certificates: 0,
        mentoredCourses: 0
      }
    };

    return NextResponse.json({ success: true, user: userRow }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create User Error:", err);
    return NextResponse.json({ message: "Gagal membuat atau menyinkronkan pengguna baru." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const ipCheck = userLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan pembaruan pengguna. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak. Hanya Super Admin yang berhak." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Data pengguna tidak valid." }, { status: 400 });
    }

    const { userId, newRole } = body;

    if (!userId || typeof userId !== "string" || !newRole || typeof newRole !== "string") {
      return NextResponse.json({ message: "ID Pengguna dan Role baru dibutuhkan." }, { status: 400 });
    }

    if (!Object.values(Role).includes(newRole as Role)) {
      return NextResponse.json({ message: "Role tidak valid." }, { status: 400 });
    }

    if (userId === user.id && newRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Anda tidak dapat menurunkan role akun Anda sendiri." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as Role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        authProvider: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: { ...updatedUser, createdAt: updatedUser.createdAt.toISOString() },
    });
  } catch (err: unknown) {
    console.error("Update User Role Error:", err);
    return NextResponse.json({ message: "Gagal memperbarui role pengguna." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const ipCheck = userLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak permintaan penghapusan pengguna. Silakan tunggu sebentar." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak. Hanya Super Admin yang berhak." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID pengguna diperlukan." }, { status: 400 });
  }

  if (id === user.id) {
    return NextResponse.json({ message: "Anda tidak dapat menghapus akun Anda sendiri." }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Delete User Error:", err);
    return NextResponse.json({ message: "Gagal menghapus pengguna." }, { status: 500 });
  }
}
