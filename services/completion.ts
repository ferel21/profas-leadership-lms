import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { accessibleEnrollmentWhere } from "./enrollment-access";

export function getCourseCompletionState(
  totalLessons: number,
  completedLessons: number,
  requiredAssessments: number,
  passedAssessments: number,
) {
  const progressPercent = totalLessons > 0
    ? Math.min(100, Math.floor((completedLessons / totalLessons) * 100))
    : 0;
  const eligible = totalLessons > 0
    && completedLessons === totalLessons
    && passedAssessments === requiredAssessments;
  return { progressPercent, eligible };
}

export async function finalizeCourseCompletion(userId: string, courseId: string) {
  return prisma.$transaction(async (tx) => {
    const [enrollment,totalLessons,completedLessons,requiredAssessments,passedAttempts] = await Promise.all([
      tx.enrollment.findFirst({
        where: accessibleEnrollmentWhere(userId, courseId),
        select: {
          completedAt: true,
          course: { select: { certificateAvailable: true } },
        },
      }),
      tx.courseNode.count({ where: { courseId, type: { not: "FOLDER" } } }),
      tx.nodeProgress.count({ where: { userId, node: { courseId, type: { not: "FOLDER" } } } }),
      tx.assessment.count({
        where: {
          courseId,
          type: { not: "PRETEST" },
          nodes: { some: { courseId, type: { in: ["QUIZ", "ASSIGNMENT"] } } }
        }
      }),
      tx.assessmentAttempt.findMany({
        where: {
          userId,
          passed: true,
          status: "GRADED",
          assessment: {
            courseId,
            type: { not: "PRETEST" },
            nodes: { some: { courseId, type: { in: ["QUIZ", "ASSIGNMENT"] } } }
          }
        },
        select: { assessmentId: true }
      }),
    ]);
    if (!enrollment) return null;
    const passedAssessments=new Set(passedAttempts.map((attempt: { assessmentId: string }) => attempt.assessmentId)).size;
    const { progressPercent, eligible } = getCourseCompletionState(
      totalLessons,
      completedLessons,
      requiredAssessments,
      passedAssessments,
    );
    const certificateEligible = eligible && enrollment.course.certificateAvailable;
    await tx.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { progressPercent, status: eligible?"COMPLETED":"ACTIVE", completedAt: eligible?(enrollment.completedAt??new Date()):null },
    });
    let certificateNumber: string | null = null;
    if (certificateEligible) {
      const existingCert = await tx.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { uniqueNumber: true }
      });
      if (existingCert) {
        certificateNumber = existingCert.uniqueNumber;
      } else {
        let candidate = `PROFAS-LDR-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
        while (await tx.certificate.findUnique({ where: { uniqueNumber: candidate }, select: { id: true } })) {
          candidate = `PROFAS-LDR-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
        }
        const certificate = await tx.certificate.create({
          data: { userId, courseId, uniqueNumber: candidate },
          select: { uniqueNumber: true }
        });
        certificateNumber = certificate.uniqueNumber;

        const course = await tx.course.findUnique({ where: { id: courseId }, select: { title: true } });
        await tx.notification.create({
          data: {
            userId,
            title: "Selamat! Sertifikat Diterbitkan 🎉",
            message: `Anda telah berhasil menyelesaikan program ${course?.title ?? ""}.`,
            type: "COURSE_COMPLETED",
            link: `/sertifikat/${certificateNumber}`
          }
        });

        await tx.activityLog.create({
          data: {
            userId,
            action: "ISSUE_CERTIFICATE",
            metadata: JSON.stringify({ certificateNumber, courseId, courseTitle: course?.title ?? "" })
          }
        });
      }
    } else if (!eligible) {
      const certificate = await tx.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { id: true, uniqueNumber: true }
      });
      if (certificate) {
        await tx.certificate.delete({ where: { id: certificate.id } });
        await tx.notification.create({
          data: {
            userId,
            title: "Status kelulusan diperbarui",
            message: "Sertifikat ditarik sementara karena syarat penyelesaian program belum lagi terpenuhi.",
            type: "COURSE_COMPLETION_REOPENED",
            link: "/dashboard"
          }
        });
        await tx.activityLog.create({
          data: {
            userId,
            action: "REVOKE_CERTIFICATE",
            metadata: JSON.stringify({ certificateNumber: certificate.uniqueNumber, courseId })
          }
        });
      }
    } else {
      const existingCert = await tx.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { uniqueNumber: true },
      });
      certificateNumber = existingCert?.uniqueNumber ?? null;
    }
    return {
      progressPercent,
      completedLessons,
      totalLessons,
      passedAssessments,
      requiredAssessments,
      eligible,
      certificateAvailable: enrollment.course.certificateAvailable,
      certificateNumber,
    };
  });
}
