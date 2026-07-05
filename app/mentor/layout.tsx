import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "MENTOR" && user.role !== "SUPER_ADMIN")) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
