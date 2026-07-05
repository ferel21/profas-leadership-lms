import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { courseId } = await params;
  const course = await prisma.course.findFirst({ where: { id: courseId, mentorId: user.id } });
  if (!course) {
    return NextResponse.json({ message: "Course tidak ditemukan atau bukan milik Anda" }, { status: 404 });
  }

  const { nodes, deletedIds } = await request.json();

  try {
    // 1. Delete nodes if any
    if (deletedIds && deletedIds.length > 0) {
      await prisma.courseNode.deleteMany({
        where: { id: { in: deletedIds }, courseId }
      });
    }

    // 2. Bypass SQLite Unique Constraint (courseId, parentId, order)
    // Gunakan updateMany agar tidak melempar error P2025 jika node tidak ditemukan saat ganti kontainer Vercel
    const updatingNodes = nodes.filter((n: any) => !n.isNew);
    for (let i = 0; i < updatingNodes.length; i++) {
      await prisma.courseNode.updateMany({
        where: { id: updatingNodes[i].id, courseId },
        data: { order: -(10000 + i) }
      });
    }

    // 3. Update/Create nodes menggunakan UPSERT (100% Idempotent & Anti-Crash)
    for (const node of nodes) {
      let assessmentId = null;
      if (node.type === 'QUIZ' || node.type === 'ASSIGNMENT') {
        const existingNode = await prisma.courseNode.findUnique({
          where: { id: node.id },
          select: { assessmentId: true }
        });
        if (existingNode?.assessmentId) {
          assessmentId = existingNode.assessmentId;
        } else {
          const assessment = await prisma.assessment.create({
            data: {
              courseId,
              title: node.title,
              type: node.type === 'QUIZ' ? 'MODULE' : 'FINAL',
              isAssignment: node.type === 'ASSIGNMENT'
            }
          });
          assessmentId = assessment.id;
        }
      }

      await prisma.courseNode.upsert({
        where: { id: node.id },
        update: {
          parentId: node.parentId || null,
          title: node.title,
          order: node.order,
          description: node.description || "",
          durationMin: node.durationMin || 0,
          ...(assessmentId ? { assessmentId } : {})
        },
        create: {
          id: node.id,
          courseId,
          parentId: node.parentId || null,
          title: node.title,
          type: node.type || "TEXT",
          order: node.order,
          description: node.description || "",
          durationMin: node.durationMin || 0,
          assessmentId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan", error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
