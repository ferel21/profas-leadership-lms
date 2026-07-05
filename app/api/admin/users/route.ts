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
