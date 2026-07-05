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

    // 2. Update/Create nodes
    for (const node of nodes) {
      if (node.isNew) {
        // Create new node
        let assessmentId = null;
        if (node.type === 'QUIZ' || node.type === 'ASSIGNMENT') {
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

        await prisma.courseNode.create({
          data: {
            id: node.id, 
            courseId,
            parentId: node.parentId,
            title: node.title,
            type: node.type,
            order: node.order,
            description: node.description || "",
            durationMin: node.durationMin || 0,
            assessmentId
          }
        });
      } else {
        // Update existing node
        await prisma.courseNode.update({
          where: { id: node.id },
          data: {
            parentId: node.parentId,
            title: node.title,
            order: node.order,
            description: node.description || "",
            durationMin: node.durationMin || 0
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan", error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
