import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { getCurrentUser } from "@/services/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Akses ditolak. Harus Super Admin." }, { status: 403 });
  }

  try {
    // Menghapus data course dummy "PROFAS LEADERSHIP"
    await prisma.course.deleteMany({
      where: {
        id: "course-profas-leadership"
      }
    });
    return NextResponse.json({ message: "Data dummy berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
