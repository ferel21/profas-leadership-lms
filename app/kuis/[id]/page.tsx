/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Quiz } from "@/components/Quiz";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KuisPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  const { id } = await params;

  let assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          published: true,
          enrollments: { where: { userId: user.id }, select: { id: true } }
        }
      },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, options: true, order: true, type: true, points: true }
      }
    }
  });

  // MASTER SKILL: Smart Resolve & Self-Healing Assessment
  // Jika assessment tidak ada ATAU soalnya sedikit/default, cari berdasarkan CourseNode (assessmentId maupun node.id)
  const node = await prisma.courseNode.findFirst({ where: { OR: [{ id }, { assessmentId: id }] } });
  if (node && (!assessment || assessment.questions.length <= 1)) {
    const possibleIds = [node.assessmentId, node.id].filter(Boolean) as string[];
    for (const pid of possibleIds) {
      if (pid === id && assessment && assessment.questions.length > 1) continue;
      const altAssessment = await prisma.assessment.findUnique({
        where: { id: pid },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              published: true,
              enrollments: { where: { userId: user.id }, select: { id: true } }
            }
          },
          questions: {
            orderBy: { order: "asc" },
            select: { id: true, prompt: true, options: true, order: true, type: true, points: true }
          }
        }
      });
      if (altAssessment && altAssessment.questions.length > 0) {
        assessment = altAssessment;
        break;
      }
    }
  }

  // MASTER SKILL: Self-Healing Assessment jika belum ada di database atau ter-reset
  if (!assessment) {
    const node = await prisma.courseNode.findFirst({ where: { OR: [{ id }, { assessmentId: id }] } });
    const course = node ? await prisma.course.findUnique({ where: { id: node.courseId } }) : await prisma.course.findFirst({ where: { published: true } });
    if (!course) notFound();

    assessment = await prisma.assessment.create({
      data: {
        id,
        courseId: course.id,
        title: node ? node.title : "Evaluasi & Kuis Pemahaman",
        type: (node && node.type === "ASSIGNMENT") ? "FINAL" : "MODULE",
        isAssignment: node ? node.type === "ASSIGNMENT" : false,
        passingScore: 70,
        timeLimitMin: 30
      },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            published: true,
            enrollments: { where: { userId: user.id }, select: { id: true } }
          }
        },
        questions: {
          orderBy: { order: "asc" },
          select: { id: true, prompt: true, options: true, order: true, type: true, points: true }
        }
      }
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
          "Fokus eksklusif pada keuntungan jangka pendek semata"
        ]),
        correctAnswer: "Kepemimpinan berorientasi pada eksekusi strategi dan visi jangka panjang",
        points: 100,
        explanation: "Kepemimpinan strategis PROFAS berfokus pada keseimbangan antara eksekusi nyata dan visi jangka panjang.",
        order: 0
      },
      select: { id: true, prompt: true, options: true, order: true, type: true, points: true }
    });
    assessment.questions = [defaultQ];
  }

  return <Quiz assessment={assessment as any} />;
}
