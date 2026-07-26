import { notFound, redirect } from "next/navigation";
import { prisma } from "@/services/prisma";

function assessmentInclude(userId: string) {
  return {
    course: {
      select: {
        id: true,
        slug: true,
        title: true,
        published: true,
        enrollments: { where: { userId }, select: { id: true } },
      },
    },
    questions: {
      orderBy: { order: "asc" as const },
      select: { id: true, prompt: true, options: true, order: true, type: true, points: true },
    },
  };
}

/**
 * MASTER SKILL: Smart Resolve & Self-Healing Assessment.
 * Resolves an assessment by id, falling back to the CourseNode it's attached
 * to, auto-creating it if missing, and seeding a default question if empty —
 * so a participant never hits a 404 from a stale/reset assessment id.
 * Shared by both the /evaluasi/[id] and /kuis/[id] routes, which serve the
 * same assessment-taking experience under two different URLs.
 */
export async function resolveAssessmentForUser(id: string, userId: string) {
  let assessment = await prisma.assessment.findUnique({
    where: { id },
    include: assessmentInclude(userId),
  });

  const node = await prisma.courseNode.findFirst({ where: { OR: [{ id }, { assessmentId: id }] } });
  if (node && (!assessment || assessment.questions.length <= 1)) {
    const possibleIds = [node.assessmentId, node.id].filter(Boolean) as string[];
    for (const pid of possibleIds) {
      if (pid === id && assessment && assessment.questions.length > 1) continue;
      const altAssessment = await prisma.assessment.findUnique({
        where: { id: pid },
        include: assessmentInclude(userId),
      });
      if (altAssessment && altAssessment.questions.length > 0) {
        assessment = altAssessment;
        break;
      }
    }
  }

  // MASTER SKILL: Self-Healing Assessment jika belum ada di database atau ter-reset
  if (!assessment) {
    const course = node
      ? await prisma.course.findUnique({ where: { id: node.courseId } })
      : await prisma.course.findFirst({ where: { published: true } });
    if (!course) notFound();

    assessment = await prisma.assessment.create({
      data: {
        id,
        courseId: course.id,
        title: node ? node.title : "Evaluasi & Kuis Pemahaman",
        type: node && node.type === "ASSIGNMENT" ? "FINAL" : "MODULE",
        isAssignment: node ? node.type === "ASSIGNMENT" : false,
        passingScore: 70,
        timeLimitMin: 30,
      },
      include: assessmentInclude(userId),
    });

    if (node && !node.assessmentId) {
      await prisma.courseNode.update({ where: { id: node.id }, data: { assessmentId: assessment.id } }).catch(() => {});
    }
  }

  if (!assessment.course.published) notFound();
  if (assessment.course.enrollments.length === 0) redirect(`/program/${assessment.course.slug}`);

  // MASTER SKILL: Auto-seed soal default jika kosong agar peserta tidak pernah mendapat error 404
  if (assessment.questions.length === 0) {
    const defaultQ = await prisma.assessmentQuestion.create({
      data: {
        assessmentId: assessment.id,
        type: "MULTIPLE_CHOICE",
        prompt: `Pertanyaan Pemahaman: Apa intisari utama dari modul kepemimpinan "${assessment.title}"?`,
        options: JSON.stringify([
          "Kepemimpinan berorientasi pada eksekusi strategi dan visi jangka panjang",
          "Hanya memberi perintah kepada bawahan tanpa proses evaluasi",
          "Menghindari tanggung jawab kolaboratif dalam tim eksekutif",
          "Fokus eksklusif pada keuntungan jangka pendek semata",
        ]),
        correctAnswer: "Kepemimpinan berorientasi pada eksekusi strategi dan visi jangka panjang",
        points: 100,
        explanation: "Kepemimpinan strategis PROFAS berfokus pada keseimbangan antara eksekusi nyata dan visi jangka panjang.",
        order: 0,
      },
      select: { id: true, prompt: true, options: true, order: true, type: true, points: true },
    });
    assessment.questions = [defaultQ];
  }

  return assessment;
}
