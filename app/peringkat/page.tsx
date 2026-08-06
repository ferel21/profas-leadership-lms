import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/ui/DashboardChrome";
import { getCurrentUser } from "@/services/auth";
import { LeaderboardClient } from "./LeaderboardClient";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk?next=/peringkat");

  return (
    <DashboardChrome user={user}>
      <LeaderboardClient user={user} />
    </DashboardChrome>
  );
}
