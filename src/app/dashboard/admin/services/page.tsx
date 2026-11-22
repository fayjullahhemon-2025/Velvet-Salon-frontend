import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ServicesManagementClient } from "@/components/admin/ServicesManagementClient";
import { getAllServicesForAdmin } from "@/lib/api/services";
import { requireAdminSession } from "@/lib/core/server";

export const metadata: Metadata = {
  title: "Manage Services | Velvet Saloon Admin",
  description: "Create, edit, delete, activate, and deactivate salon services.",
};

export default async function ManageServicesPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/signin");
  }

  const services = await getAllServicesForAdmin();

  return <ServicesManagementClient initialServices={services} />;
}
