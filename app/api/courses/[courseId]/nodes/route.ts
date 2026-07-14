import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const nodesLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

export async function PUT(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const ipCheck = nodesLimiter.check(request);
  if (!ipCheck.success) {
    return NextResponse.json({ message: "Terlalu banyak pembaruan struktur kurikulum. Silakan tunggu 1 menit." }, { status: 429 });
  }

  const user = await getCurrentUser();
  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ message: "Akses ditolak" }, { status: 403 });
  }

  const { courseId } = await params;
  const course = await prisma.course.findFirst({
    where: user.role === "SUPER_ADMIN" ? { id: courseId } : { id: courseId, mentorId: user.id },
    select: { id: true, slug: true }
  });
  if (!course) {
    return NextResponse.json({ message: "Course tidak ditemukan atau bukan milik Anda" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !Array.isArray(body.nodes)) {
    return NextResponse.json({ message: "Format daftar node tidak valid." }, { status: 400 });
  }

  const nodes = body.nodes;
  if (nodes.length > 300) {
    return NextResponse.json({ message: "Jumlah materi/node dalam satu kurikulum melebihi batas maksimal (300)." }, { status: 400 });
  }

  try {
    // 1. MASTER SKILL: Total Clean Deletion (Hapus node yang dieksplisitkan ATAU yang tidak ada lagi di daftar aktif frontend)
    const activeIds = (nodes as unknown[])
      .map((n: unknown) => (n && typeof n === "object" && "id" in n && typeof (n as { id?: unknown }).id === "string") ? (n as { id: string }).id : undefined)
      .filter((id: unknown): id is string => typeof id === "string" && !id.startsWith("tmp_") && id !== "new_node");

    await prisma.$transaction(async (tx) => {
      await tx.courseNode.deleteMany({
        where: {
          courseId,
          id: { notIn: activeIds }
        }
      });

      // 2. MASTER SKILL: Total Order Wipeout & Bypass SQLite Unique Constraint (courseId, parentId, order)
      // Geser seluruh node yang ada di database untuk course ini ke urutan negatif yang aman
      // Ini menjamin 100% ruang urutan (0, 1, 2...) kosong dan tidak akan pernah tabrakan!
      const allExistingNodes = await tx.courseNode.findMany({
        where: { courseId },
        select: { id: true }
      });
      for (let i = 0; i < allExistingNodes.length; i++) {
        await tx.courseNode.updateMany({
          where: { id: allExistingNodes[i].id, courseId },
          data: { order: -(100000 + i) }
        });
      }

      // 3. MASTER SKILL: Update/Create nodes menggunakan 100% Idempotent UPSERT
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node || typeof node !== "object" || typeof node.id !== "string" || !node.id || typeof node.title !== "string") continue;
        
        const cleanTitle = node.title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150) || "Bab Materi";
        const cleanDesc = typeof node.description === "string" ? node.description.replace(/<[^>]*>?/gm, "").trim().slice(0, 500) : "";
        const safeParentId = (typeof node.parentId === "string" && node.parentId && node.parentId !== node.id) ? node.parentId : null;

        let assessmentId = node.assessmentId || null;
        if (!assessmentId && (node.type === 'QUIZ' || node.type === 'ASSIGNMENT')) {
          const existingNode = await tx.courseNode.findUnique({
            where: { id: node.id },
            select: { assessmentId: true }
          });
          if (existingNode?.assessmentId) {
            assessmentId = existingNode.assessmentId;
          } else {
            let assessment = await tx.assessment.findUnique({ where: { id: node.id } });
            if (!assessment) {
              assessment = await tx.assessment.findFirst({ where: { courseId, title: cleanTitle } });
            }
            if (assessment) {
              await tx.assessment.update({
                where: { id: assessment.id },
                data: { title: cleanTitle }
              });
            } else {
              assessment = await tx.assessment.create({
                data: {
                  id: node.id,
                  courseId,
                  title: cleanTitle,
                  type: node.type === 'QUIZ' ? 'MODULE' : 'FINAL',
                  isAssignment: node.type === 'ASSIGNMENT'
                }
              });
            }
            assessmentId = assessment.id;
          }
        } else if (assessmentId && (node.type === 'QUIZ' || node.type === 'ASSIGNMENT')) {
          const existingAssessment = await tx.assessment.findUnique({ where: { id: assessmentId } });
          if (existingAssessment) {
            await tx.assessment.update({
              where: { id: assessmentId },
              data: { title: cleanTitle }
            });
          } else {
            await tx.assessment.create({
              data: {
                id: assessmentId,
                courseId,
                title: cleanTitle,
                type: node.type === 'QUIZ' ? 'MODULE' : 'FINAL',
                isAssignment: node.type === 'ASSIGNMENT'
              }
            });
          }
        }

        const existingCourseNode = await tx.courseNode.findUnique({ where: { id: node.id } });
        if (existingCourseNode) {
          await tx.courseNode.update({
            where: { id: node.id },
            data: {
              parentId: safeParentId,
              title: cleanTitle,
              type: node.type || "TEXT",
              order: node.order,
              description: cleanDesc,
              content: node.content || null,
              fileUrl: node.fileUrl || null,
              fileName: node.fileName || null,
              fileSize: typeof node.fileSize === "number" ? node.fileSize : null,
              durationMin: node.durationMin || 0,
              ...(assessmentId ? { assessmentId } : {})
            }
          });
        } else {
          await tx.courseNode.create({
            data: {
              id: node.id,
              courseId,
              parentId: safeParentId,
              title: cleanTitle,
              type: node.type || "TEXT",
              order: node.order,
              description: cleanDesc,
              content: node.content || null,
              fileUrl: node.fileUrl || null,
              fileName: node.fileName || null,
              fileSize: typeof node.fileSize === "number" ? node.fileSize : null,
              durationMin: node.durationMin || 0,
              assessmentId
            }
          });
        }
      }

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_COURSE_CURRICULUM",
          metadata: JSON.stringify({ courseId, nodeCount: nodes.length })
        }
      });
    }, { timeout: 25000 });

    revalidatePath(`/belajar/${course.slug}`);
    revalidatePath(`/belajar/${courseId}`);
    revalidatePath("/dashboard");
    revalidatePath(`/mentor/courses/${courseId}/builder`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan", error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
