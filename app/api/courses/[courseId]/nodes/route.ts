import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";
import { rateLimit } from "@/services/rate-limit";
import { NodeType } from "@prisma/client";

const nodesLimiter = rateLimit({ limit: 30, windowMs: 60 * 1000 });

type CurriculumNodeInput = {
  id: string;
  parentId: string | null;
  assessmentId: string | null;
  assessmentType: string | null;
  title: string;
  type: NodeType;
  order: number;
  description: string | null;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  durationMin: number;
};

class CurriculumValidationError extends Error {}

function optionalString(value: unknown, maxLength: number): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : null;
}

function optionalResourceUrl(value: unknown): string | null {
  const input = optionalString(value, 2_000);
  if (!input) return null;
  if (input.startsWith("/api/uploads/")) return input;
  try {
    const parsed = new URL(input);
    if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error("Unsupported resource URL");
    }
    return parsed.toString();
  } catch {
    throw new CurriculumValidationError("URL materi harus menggunakan http, https, atau path unggahan internal yang valid.");
  }
}

function parseCurriculumNodes(rawNodes: unknown[]): CurriculumNodeInput[] {
  const parsed: CurriculumNodeInput[] = [];
  const seenIds = new Set<string>();

  for (const rawNode of rawNodes) {
    if (!rawNode || typeof rawNode !== "object") {
      throw new CurriculumValidationError("Setiap item kurikulum harus berupa node yang valid.");
    }

    const node = rawNode as Record<string, unknown>;
    const id = typeof node.id === "string" ? node.id.trim() : "";
    const title = typeof node.title === "string" ? node.title : "";
    const type = node.type;
    const order = node.order;

    if (!id || id.length > 191 || id === "new_node" || seenIds.has(id)) {
      throw new CurriculumValidationError("ID node kurikulum kosong, duplikat, atau tidak valid.");
    }
    if (!title.trim()) {
      throw new CurriculumValidationError("Setiap node kurikulum harus memiliki judul.");
    }
    if (typeof type !== "string" || !Object.values(NodeType).includes(type as NodeType)) {
      throw new CurriculumValidationError("Jenis node kurikulum tidak valid.");
    }
    if (!Number.isInteger(order) || (order as number) < 0 || (order as number) > 300) {
      throw new CurriculumValidationError("Urutan node kurikulum tidak valid.");
    }

    const parentId = typeof node.parentId === "string" && node.parentId.trim()
      ? node.parentId.trim()
      : null;
    const assessmentId = typeof node.assessmentId === "string" && node.assessmentId.trim()
      ? node.assessmentId.trim()
      : null;
    const assessmentType = typeof node.assessmentType === "string" && node.assessmentType.trim()
      ? node.assessmentType.trim()
      : null;

    if (parentId === id || (parentId && parentId.length > 191)) {
      throw new CurriculumValidationError("Relasi induk node kurikulum tidak valid.");
    }
    if (assessmentId && assessmentId.length > 191) {
      throw new CurriculumValidationError("ID evaluasi tidak valid.");
    }

    seenIds.add(id);
    parsed.push({
      id,
      parentId,
      assessmentId,
      assessmentType,
      title: title.replace(/<[^>]*>?/gm, "").trim().slice(0, 150) || "Bab Materi",
      type: type as NodeType,
      order: order as number,
      description: optionalString(node.description, 500)?.replace(/<[^>]*>?/gm, "") ?? null,
      content: optionalString(node.content, 100_000),
      fileUrl: optionalResourceUrl(node.fileUrl),
      fileName: optionalString(node.fileName, 255),
      fileSize: typeof node.fileSize === "number" && Number.isFinite(node.fileSize) && node.fileSize >= 0
        ? Math.round(node.fileSize)
        : null,
      durationMin: typeof node.durationMin === "number" && Number.isFinite(node.durationMin)
        ? Math.min(100_000, Math.max(0, Math.round(node.durationMin)))
        : 0,
    });
  }

  const nodesById = new Map(parsed.map(node => [node.id, node]));
  for (const node of parsed) {
    if (node.parentId) {
      const parent = nodesById.get(node.parentId);
      if (!parent || parent.type !== NodeType.FOLDER) {
        throw new CurriculumValidationError("Induk node harus berupa folder dalam program yang sama.");
      }
    }

    const visited = new Set([node.id]);
    let ancestorId = node.parentId;
    while (ancestorId) {
      if (visited.has(ancestorId)) {
        throw new CurriculumValidationError("Hierarki kurikulum tidak boleh membentuk siklus.");
      }
      visited.add(ancestorId);
      ancestorId = nodesById.get(ancestorId)?.parentId ?? null;
    }
  }

  return parsed;
}

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

  const rawNodes: unknown[] = body.nodes;
  if (rawNodes.length > 300) {
    return NextResponse.json({ message: "Jumlah materi/node dalam satu kurikulum melebihi batas maksimal (300)." }, { status: 400 });
  }

  try {
    const nodes = parseCurriculumNodes(rawNodes);
    const activeIds = nodes.map(node => node.id);

    await prisma.$transaction(async (tx) => {
      const submittedNodeRecords = await tx.courseNode.findMany({
        where: { id: { in: activeIds } },
        select: { id: true, courseId: true, assessmentId: true }
      });
      if (submittedNodeRecords.some(node => node.courseId !== courseId)) {
        throw new CurriculumValidationError("Node berasal dari program lain dan tidak dapat diperbarui.");
      }
      const existingCourseNodes = await tx.courseNode.findMany({
        where: { courseId },
        select: {
          id: true,
          assessmentId: true,
          _count: { select: { progress: true, discussionPosts: true } },
          assessment: { select: { _count: { select: { attempts: true } } } },
        },
      });
      const existingNodesById = new Map(submittedNodeRecords.map(node => [node.id, node]));
      const assessmentCleanupCandidates = existingCourseNodes
        .map(node => node.assessmentId)
        .filter((assessmentId): assessmentId is string => Boolean(assessmentId));

      const removedNodes = existingCourseNodes.filter(node => !activeIds.includes(node.id));
      const destructiveRemoval = removedNodes.find(node =>
        node._count.progress > 0
        || node._count.discussionPosts > 0
        || (node.assessment?._count.attempts ?? 0) > 0
      );
      if (destructiveRemoval) {
        throw new CurriculumValidationError(
          "Materi yang sudah memiliki progres, diskusi, atau kiriman evaluasi tidak dapat dihapus. Pertahankan materi tersebut sebagai arsip belajar."
        );
      }

      for (const existingNode of existingCourseNodes) {
        if (!existingNode.assessmentId || (existingNode.assessment?._count.attempts ?? 0) === 0) continue;
        const submitted = nodes.find(node => node.id === existingNode.id);
        const nextAssessmentId = submitted && (submitted.type === NodeType.QUIZ || submitted.type === NodeType.ASSIGNMENT)
          ? (submitted.assessmentId || existingNode.assessmentId || submitted.id)
          : null;
        if (nextAssessmentId !== existingNode.assessmentId) {
          throw new CurriculumValidationError(
            "Evaluasi yang sudah memiliki kiriman peserta tidak dapat dilepas atau diubah menjadi tipe materi lain."
          );
        }
      }

      // Detach retained children first. Deleting an old folder would otherwise
      // cascade-delete a child that the submitted curriculum is reparenting.
      if (activeIds.length > 0) {
        await tx.courseNode.updateMany({
          where: { courseId, id: { in: activeIds }, parentId: { not: null } },
          data: { parentId: null },
        });
      }
      await tx.courseNode.deleteMany({
        where: {
          courseId,
          id: { notIn: activeIds }
        }
      });

      // Clear sibling order first to avoid collisions on the compound unique constraint.
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

      for (const node of nodes) {
        const existingCourseNode = existingNodesById.get(node.id);
        const isAssessmentNode = node.type === NodeType.QUIZ || node.type === NodeType.ASSIGNMENT;
        const assessmentId = isAssessmentNode
          ? node.assessmentId || existingCourseNode?.assessmentId || node.id
          : null;

        if (assessmentId) {
          const existingAssessment = await tx.assessment.findUnique({
            where: { id: assessmentId },
            select: { id: true, courseId: true }
          });
          if (existingAssessment && existingAssessment.courseId !== courseId) {
            throw new CurriculumValidationError("Evaluasi berasal dari program lain dan tidak dapat digunakan.");
          }

          let finalAssType = node.type === NodeType.QUIZ ? "MODULE" : "FINAL";
          if (node.type === NodeType.QUIZ && node.assessmentType && ["PRETEST", "POSTTEST", "MODULE", "FINAL"].includes(node.assessmentType)) {
            finalAssType = node.assessmentType;
          }

          if (existingAssessment) {
            await tx.assessment.updateMany({
              where: { id: assessmentId, courseId },
              data: {
                title: node.title,
                type: finalAssType as any,
                isAssignment: node.type === NodeType.ASSIGNMENT
              }
            });
          } else {
            await tx.assessment.create({
              data: {
                id: assessmentId,
                courseId,
                title: node.title,
                type: finalAssType as any,
                isAssignment: node.type === NodeType.ASSIGNMENT
              }
            });
          }
        }

        if (existingCourseNode) {
          await tx.courseNode.updateMany({
            where: { id: node.id, courseId },
            data: {
              parentId: node.parentId,
              title: node.title,
              type: node.type,
              order: node.order,
              description: node.description,
              content: node.content,
              fileUrl: node.fileUrl,
              fileName: node.fileName,
              fileSize: node.fileSize,
              durationMin: node.durationMin,
              assessmentId
            }
          });
        } else {
          await tx.courseNode.create({
            data: {
              id: node.id,
              courseId,
              parentId: node.parentId,
              title: node.title,
              type: node.type,
              order: node.order,
              description: node.description,
              content: node.content,
              fileUrl: node.fileUrl,
              fileName: node.fileName,
              fileSize: node.fileSize,
              durationMin: node.durationMin,
              assessmentId
            }
          });
        }
      }

      if (assessmentCleanupCandidates.length > 0) {
        await tx.assessment.deleteMany({
          where: {
            id: { in: assessmentCleanupCandidates },
            courseId,
            nodes: { none: {} }
          }
        });
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
    if (error instanceof CurriculumValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan kurikulum." }, { status: 500 });
  }
}
