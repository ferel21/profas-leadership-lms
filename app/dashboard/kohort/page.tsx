import { redirect } from "next/navigation";
import { CohortManager } from "@/components/shared/CohortManager";
import { DashboardChrome } from "@/components/ui/DashboardChrome";
import { getCurrentUser } from "@/services/auth";
import { prisma } from "@/services/prisma";

export const dynamic = "force-dynamic";

export default async function CohortDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?next=/dashboard/kohort");
  if (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const courseWhere = user.role === "MENTOR" ? { mentorId: user.id } : undefined;
  const [courses, cohorts] = await Promise.all([
    prisma.course.findMany({
      where: courseWhere,
      orderBy: [{ published: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true, published: true },
    }),
    prisma.cohort.findMany({
      where: user.role === "MENTOR" ? { course: { mentorId: user.id } } : undefined,
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        organization: true,
        capacity: true,
        startsAt: true,
        endsAt: true,
        status: true,
        joinCodeHint: true,
        course: { select: { id: true, title: true, slug: true, published: true } },
        _count: { select: { enrollments: { where: { accessRevokedAt: null } } } },
      },
    }),
  ]);

  const serializedCohorts = cohorts.map((cohort) => ({
    ...cohort,
    startsAt: cohort.startsAt.toISOString(),
    endsAt: cohort.endsAt.toISOString(),
    memberCount: cohort._count.enrollments,
    _count: undefined,
  }));

  return (
    <DashboardChrome user={user}>
      <CohortManager courses={courses} initialCohorts={serializedCohorts} />
    </DashboardChrome>
  );
}
