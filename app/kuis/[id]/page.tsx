/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth";
import { resolveAssessmentForUser } from "@/services/assessmentResolver";
import { Quiz } from "@/components/shared/Quiz";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KuisPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  const { id } = await params;

  const assessment = await resolveAssessmentForUser(id, user.id);

  return <Quiz assessment={assessment as any} />;
}
