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
          
          await prisma.courseNode.updateMany({
            where: { assessmentId: a.id },
            data: { assessmentType: AssessmentType.PRETEST }
          });
          
          updated++;
        }
      }
    }
    
    return NextResponse.json({ success: true, updated, message: `Fixed ${updated} pretests.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
