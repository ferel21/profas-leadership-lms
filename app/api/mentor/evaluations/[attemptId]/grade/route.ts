/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;
    const body = await req.json();
    const { score, feedback, passed, answersScores } = body;

    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: { include: { course: true } }
      }
    });

    if (!attempt || attempt.assessment.course.mentorId !== user.id) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 });
    }

    // Update individual answer scores if provided
    if (answersScores && Array.isArray(answersScores)) {
      for (const ans of answersScores) {
        await prisma.attemptAnswer.updateMany({
          where: { attemptId, questionId: ans.questionId },
          data: {
            score: ans.score,
            feedback: ans.feedback
          }
        });
      }
    }

    // Update attempt
    const updatedAttempt = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        score: score,
        passed: passed,
        feedback: feedback,
        status: 'GRADED',
        gradedAt: new Date()
      }
    });

    // If passed, we might need to award XP and mark completion
    if (passed && !attempt.passed) {
      await prisma.xPLog.upsert({
        where: {
          userId_source_sourceId: {
            userId: attempt.userId,
            source: 'ASSESSMENT',
            sourceId: attempt.assessmentId
          }
        },
        create: {
          userId: attempt.userId,
          points: 50,
          source: 'ASSESSMENT',
          sourceId: attempt.assessmentId
        },
        update: {}
      });

      // Find node that has this assessment
      const node = await prisma.courseNode.findFirst({
        where: { assessmentId: attempt.assessmentId }
      });

      if (node) {
        await prisma.nodeProgress.upsert({
          where: {
            userId_nodeId: {
              userId: attempt.userId,
              nodeId: node.id
            }
          },
          create: {
            userId: attempt.userId,
            nodeId: node.id
          },
          update: {}
        });
      }
    }

    return NextResponse.json(updatedAttempt);
  } catch (error: any) {
    console.error('Error grading attempt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
