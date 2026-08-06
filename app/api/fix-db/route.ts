import { NextResponse } from 'next/server';
import { prisma } from '@/services/prisma';
import { AssessmentType } from '@prisma/client';

export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany();
    let updated = 0;
    
    for (const a of assessments) {
      if (a.title.toLowerCase().includes('pretest') || a.title.toLowerCase().includes('pre-test')) {
        if (a.type !== AssessmentType.PRETEST) {
          await prisma.assessment.update({
            where: { id: a.id },
            data: { type: AssessmentType.PRETEST, passingScore: 0 }
          });
          updated++;
        }
        
        // Update existing attempts to passed: true
        const attempts = await prisma.assessmentAttempt.findMany({
          where: { assessmentId: a.id, passed: false, status: 'GRADED' }
        });
        
        for (const attempt of attempts) {
          await prisma.assessmentAttempt.update({
            where: { id: attempt.id },
            data: { 
              passed: true,
              feedback: "Bagus! Anda siap melanjutkan ke tahap berikutnya."
            }
          });
          
          // Fix node progress
          const nodes = await prisma.courseNode.findMany({
            where: { assessmentId: a.id }
          });
          
          if (nodes.length > 0) {
            await prisma.nodeProgress.createMany({
              data: nodes.map(n => ({
                userId: attempt.userId,
                nodeId: n.id,
                completedAt: attempt.submittedAt ?? new Date()
              })),
              skipDuplicates: true
            });
          }
        }
      } else if (a.title.toLowerCase().includes('posttest') || a.title.toLowerCase().includes('post-test')) {
        if (a.type !== AssessmentType.POSTTEST || a.passingScore === 0) {
          await prisma.assessment.update({
            where: { id: a.id },
            data: { type: AssessmentType.POSTTEST, passingScore: 80 }
          });
          updated++;
        }
        
        // Revoke any invalid passed attempts that scored below 80
        const wrongAttempts = await prisma.assessmentAttempt.findMany({
          where: { assessmentId: a.id, passed: true, score: { lt: 80 }, status: 'GRADED' }
        });

        for (const attempt of wrongAttempts) {
          await prisma.assessmentAttempt.update({
            where: { id: attempt.id },
            data: { 
              passed: false,
              feedback: "Tinjau kembali materi inti, lalu coba sekali lagi."
            }
          });
          
          // Delete node progress so it gets locked again
          const nodes = await prisma.courseNode.findMany({
            where: { assessmentId: a.id }
          });
          
          if (nodes.length > 0) {
            await prisma.nodeProgress.deleteMany({
              where: {
                userId: attempt.userId,
                nodeId: { in: nodes.map(n => n.id) }
              }
            });
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, updated, message: `Fixed pretests and attempts.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
