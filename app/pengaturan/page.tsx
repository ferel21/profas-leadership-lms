import { getCurrentUser } from "@/lib/auth";
import { DashboardChrome } from "@/components/DashboardChrome";
import { ProfileForm } from "@/components/ProfileForm";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");

  return (
    <DashboardChrome user={user}>
      <div className="dash-title profile-title">
        <span className="eyebrow">PENGATURAN AKUN</span>
        <h1>Profil Saya</h1>
        <p>Kelola identitas dan informasi pribadi yang tampil di ekosistem PROFAS Leadership.</p>
      </div>
      <ProfileForm user={{
        id: user.id,
        name: user.name,
        username: user.username ?? "",
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone ?? "",
        headline: user.headline ?? "",
        bio: user.bio ?? "",
        organization: user.organization ?? "",
        location: user.location ?? "",
        persona: user.persona,
      }} />
    </DashboardChrome>
  );
}
