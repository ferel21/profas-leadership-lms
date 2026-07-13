import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

export async function finalizeCourseCompletion(userId: string, courseId: string) {
  return prisma.$transaction(async (tx) => {
    const [enrollment,totalLessons,completedLessons,requiredAssessments,passedAttempts] = await Promise.all([
      tx.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } }, select: { completedAt: true } }),
      tx.courseNode.count({ where: { courseId, type: { not: "FOLDER" } } }),
      tx.nodeProgress.count({ where: { userId, node: { courseId, type: { not: "FOLDER" } } } }),
      tx.assessment.count({ where: { courseId, type: { not: "PRETEST" } } }),
      tx.assessmentAttempt.findMany({ where: { userId, passed: true, assessment: { courseId, type: { not: "PRETEST" } } }, select: { assessmentId: true } }),
    ]);
    if (!enrollment) return null;
    const progressPercent=Math.round((completedLessons/Math.max(totalLessons,1))*100);
    const passedAssessments=new Set(passedAttempts.map((attempt: { assessmentId: string }) => attempt.assessmentId)).size;
    const eligible=progressPercent===100&&passedAssessments===requiredAssessments;
    await tx.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { progressPercent, status: eligible?"COMPLETED":"ACTIVE", completedAt: eligible?(enrollment.completedAt??new Date()):null },
    });
    let certificateNumber:string|null=null;
    if(eligible){
      const existingCert = await tx.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { uniqueNumber: true }
      });
      if (existingCert) {
        certificateNumber = existingCert.uniqueNumber;
      } else {
        const candidate=`PROFAS-LDR-${new Date().getFullYear()}-${randomUUID().slice(0,8).toUpperCase()}`;
        try {
          const certificate=await tx.certificate.upsert({where:{userId_courseId:{userId,courseId}},update:{},create:{userId,courseId,uniqueNumber:candidate},select:{uniqueNumber:true}});
          certificateNumber=certificate.uniqueNumber;
        } catch {
          const fallbackCert = await tx.certificate.findUnique({
            where: { userId_courseId: { userId, courseId } },
            select: { uniqueNumber: true }
          });
          certificateNumber = fallbackCert?.uniqueNumber ?? candidate;
        }

        if (certificateNumber === candidate) {
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
        }
      }
    }
    return {progressPercent,completedLessons,totalLessons,passedAssessments,requiredAssessments,eligible,certificateNumber};
  });
}
