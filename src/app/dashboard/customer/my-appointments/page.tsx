import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MyAppointmentsClient } from "@/components/customer/MyAppointmentsClient";
import { getCustomerAppointments } from "@/lib/api/appointments";
import { requireCustomerSession } from "@/lib/core/server";

export const metadata: Metadata = {
  title: "My Appointments | Velvet Saloon",
  description:
    "View your scheduled appointments, track confirmation statuses, and manage your bookings.",
};

export default async function MyAppointmentsPage() {
  const session = await requireCustomerSession().catch(() => null);
  if (!session?.user) {
    redirect("/signin");
  }

  const appointments = await getCustomerAppointments(
    session.user.id,
    session.user.email,
  );

  return <MyAppointmentsClient initialAppointments={appointments} />;
}
