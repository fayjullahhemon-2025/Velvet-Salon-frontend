import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppointmentsManagementClient } from "@/components/admin/AppointmentsManagementClient";
import { getAllAppointmentsForAdmin } from "@/lib/api/appointments";
import { requireAdminSession } from "@/lib/core/server";

export const metadata: Metadata = {
  title: "Manage Appointments | Velvet Saloon Admin",
  description:
    "Review customer booking requests, inspect appointment details, confirm pending slots, and cancel bookings.",
};

export default async function AdminAppointmentsPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/signin");
  }

  const appointments = await getAllAppointmentsForAdmin();

  return <AppointmentsManagementClient initialAppointments={appointments} />;
}
