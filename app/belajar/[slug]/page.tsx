import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CoursePlayer, CourseNode } from "@/components/CoursePlayer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  const { slug } = await params;

  const course = await prisma.course.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
      published: true
    },
    select: {
      id: true,
      slug: true,
      title: true,
      enrollments: { where: { userId: user.id }, select: { id: true } },
      assessments: { select: { id: true, title: true, type: true } },
      nodes: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          parentId: true,
          title: true,
          type: true,
          order: true,
          durationMin: true,
          content: true,
          fileUrl: true,
          fileName: true,
          fileSize: true,
          assessmentId: true,
          progress: { where: { userId: user.id }, select: { id: true } },
          discussionPosts: {
            orderBy: { createdAt: "desc" },
            take: 15,
            select: { id: true, content: true, createdAt: true, user: { select: { id: true, name: true } } }
          }
        }
      }
    }
  });

  if (!course) notFound();
  if (course.enrollments.length === 0) redirect(`/program/${course.slug}`);

  // Build tree
  const buildTree = (parentId: string | null): CourseNode[] => {
    return course.nodes
      .filter(n => n.parentId === parentId)
      .map(n => ({
        id: n.id,
        parentId: n.parentId,
        title: n.title,
        type: n.type,
        order: n.order,
        durationMin: n.durationMin,
        content: n.content,
        fileUrl: n.fileUrl,
        fileName: n.fileName,
        fileSize: n.fileSize,
        assessmentId: n.assessmentId,
        completed: n.progress.length > 0,
        discussionPosts: n.discussionPosts.map(dp => ({
          ...dp,
          createdAt: dp.createdAt.toISOString()
        })),
        children: buildTree(n.id)
      }));
  };

  const treeNodes = buildTree(null);

  const shapedCourse = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    assessments: course.assessments,
    nodes: treeNodes
  };

  const getFirstIncomplete = (nodes: CourseNode[]): CourseNode | undefined => {
    for (const node of nodes) {
      if (node.type !== "FOLDER" && !node.completed) return node;
      const childIncomplete = getFirstIncomplete(node.children);
      if (childIncomplete) return childIncomplete;
    }
    return undefined;
  };

  const getFirstLesson = (nodes: CourseNode[]): CourseNode | undefined => {
    for (const node of nodes) {
      if (node.type !== "FOLDER") return node;
      const child = getFirstLesson(node.children);
      if (child) return child;
    }
    return undefined;
  };

  const firstIncomplete = getFirstIncomplete(treeNodes) ?? getFirstLesson(treeNodes);
  if (!firstIncomplete) notFound();

  return <CoursePlayer course={shapedCourse} initialLessonId={firstIncomplete.id} currentUser={{ id: user.id, name: user.name }} />;
}
