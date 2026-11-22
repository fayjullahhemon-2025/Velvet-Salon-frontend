import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileFormClient } from "@/components/profile/ProfileFormClient";
import { getCurrentUserProfile } from "@/lib/api/users";
import { requireAdminSession } from "@/lib/core/server";

export const metadata: Metadata = {
  title: "Admin Profile | Velvet Saloon",
  description: "View and update administrative profile information.",
};

export default async function AdminProfilePage() {
  const session = await requireAdminSession().catch(() => null);
  if (!session?.user) {
    redirect("/signin");
  }

  const profile = await getCurrentUserProfile(
    session.user.email,
    session.user.id,
  );
  if (!profile) {
    redirect("/signin");
  }

  return (
    <ProfileFormClient
      initialProfile={profile}
      roleTitle="Administrator Profile"
    />
  );
}
