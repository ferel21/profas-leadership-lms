/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
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
  } catch (err: any) {
    console.error("Get Users Error:", err);
    return NextResponse.json({ message: "Gagal mengambil daftar pengguna." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak. Hanya Super Admin yang berhak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, role = "STUDENT", authProvider = "GOOGLE" } = body;

    if (!name || !email) {
      return NextResponse.json({ message: "Nama dan email wajib diisi." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (existingUser) {
      return NextResponse.json({ message: "Email pengguna sudah terdaftar di sistem." }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        role: role as Role,
        authProvider: authProvider,
        passwordHash: "",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2a6ba7&color=fff`
      }
    });

    // Auto-enroll ke semua program kepemimpinan jika role adalah STUDENT
    if (newUser.role === "STUDENT") {
      const publishedCourses = await prisma.course.findMany({ where: { published: true } });
      for (const course of publishedCourses) {
        await prisma.enrollment.create({
          data: { userId: newUser.id, courseId: course.id, status: "ACTIVE", progressPercent: 0 }
        });
      }
    }

    const userRow = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      authProvider: newUser.authProvider,
      createdAt: newUser.createdAt.toISOString(),
      _count: {
        enrollments: newUser.role === "STUDENT" ? 3 : 0,
        certificates: 0,
        mentoredCourses: 0
      }
    };

    return NextResponse.json({ success: true, user: userRow }, { status: 201 });
  } catch (err: any) {
    console.error("Create User Error:", err);
    return NextResponse.json({ message: "Gagal membuat atau menyinkronkan pengguna baru." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak. Hanya Super Admin yang berhak." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json({ message: "ID Pengguna dan Role baru dibutuhkan." }, { status: 400 });
    }

    if (!["STUDENT", "MENTOR", "SUPER_ADMIN"].includes(newRole)) {
      return NextResponse.json({ message: "Role tidak valid." }, { status: 400 });
    }

    if (userId === user.id && newRole !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Anda tidak dapat menurunkan role akun Anda sendiri." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as Role }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error("Update User Role Error:", err);
    return NextResponse.json({ message: "Gagal memperbarui role pengguna." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
  } catch (err: any) {
    console.error("Delete User Error:", err);
    return NextResponse.json({ message: "Gagal menghapus pengguna." }, { status: 500 });
  }
}
