import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/DashboardChrome";
import { BuilderClient } from "./BuilderClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CourseBuilderPage({ params }: { params: Promise<{ courseId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "MENTOR") redirect("/masuk");

  const courseId = (await params).courseId;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      nodes: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!course || course.mentorId !== user.id) redirect("/mentor");

  type TreeNode = import("@prisma/client").CourseNode & { children: TreeNode[] };
  const nodes = course.nodes;
  const buildTree = (parent: import("@prisma/client").CourseNode): TreeNode => ({
    ...parent,
    children: nodes.filter(n => n.parentId === parent.id).map(buildTree)
  });
  
  const treeNodes = nodes.filter(n => !n.parentId).map(buildTree);
  const shapedCourse = { id: course.id, nodes: treeNodes };

  return (
    <DashboardChrome user={user}>
      <div className="mb-6">
        <Link href="/mentor" className="text-link inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Kembali ke Dashboard
        </Link>
      </div>
      <div className="dash-title">
        <div>
          <p>Course Builder</p>
          <h1>{course.title}</h1>
          <small>Kelola modul dan materi untuk program ini.</small>
        </div>
      </div>
      <BuilderClient course={shapedCourse} />
    </DashboardChrome>
  );
}
