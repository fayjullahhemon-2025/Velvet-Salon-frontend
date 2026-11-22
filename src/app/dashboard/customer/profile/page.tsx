import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileFormClient } from "@/components/profile/ProfileFormClient";
import { getCurrentUserProfile } from "@/lib/api/users";
import { requireCustomerSession } from "@/lib/core/server";

export const metadata: Metadata = {
  title: "Customer Profile | Velvet Saloon",
  description: "View and update your customer profile information.",
};

export default async function CustomerProfilePage() {
  try {
    await requireCustomerSession();
  } catch {
    redirect("/signin");
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/signin");
  }

  return (
    <ProfileFormClient initialProfile={profile} roleTitle="Customer Profile" />
  );
}
