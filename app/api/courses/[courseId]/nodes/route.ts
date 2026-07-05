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

    // 2. MASTER SKILL: Total Order Wipeout & Bypass SQLite Unique Constraint (courseId, parentId, order)
    // Geser seluruh node yang ada di database untuk course ini ke urutan negatif yang aman
    // Ini menjamin 100% ruang urutan (0, 1, 2...) kosong dan tidak akan pernah tabrakan!
    const allExistingNodes = await prisma.courseNode.findMany({
      where: { courseId },
      select: { id: true }
    });
    for (let i = 0; i < allExistingNodes.length; i++) {
      await prisma.courseNode.updateMany({
        where: { id: allExistingNodes[i].id, courseId },
        data: { order: -(100000 + i) }
      });
    }

    // 3. MASTER SKILL: Update/Create nodes menggunakan 100% Idempotent UPSERT
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      let assessmentId = null;
      if (node.type === 'QUIZ' || node.type === 'ASSIGNMENT') {
        const existingNode = await prisma.courseNode.findFirst({
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
          order: node.order, // Dijamin unik dan sekuensial dari frontend & Phase 2!
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
          order: node.order, // Dijamin unik dan sekuensial!
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
