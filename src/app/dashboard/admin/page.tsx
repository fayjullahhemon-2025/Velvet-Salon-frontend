import {
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Plus,
  Scissors,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdminSession } from "@/lib/core/server";
import { getDb } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = {
  title: "Admin Overview | Velvet Saloon",
  description: "Salon management overview and operational statistics.",
};

export default async function AdminDashboardPage() {
  const session = await requireAdminSession().catch(() => null);
  if (!session?.user) {
    redirect("/signin");
  }

  let customerCount = 0;
  let activeServicesCount = 0;
  let totalAppointmentsCount = 0;
  let pendingAppointmentsCount = 0;
  let confirmedAppointmentsCount = 0;
  let successfulPaymentsCount = 0;

  try {
    const db = await getDb();
    const [
      customers,
      activeServices,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      successfulPayments,
    ] = await Promise.all([
      db
        .collection("users")
        .countDocuments({ role: "customer" })
        .then(async (c) => {
          if (c > 0) return c;
          return db.collection("user").countDocuments({ role: "customer" });
        }),
      db.collection("services").countDocuments({ status: "active" }),
      db.collection("appointments").countDocuments({}),
      db.collection("appointments").countDocuments({ status: "pending" }),
      db.collection("appointments").countDocuments({ status: "confirmed" }),
      db.collection("transactions").countDocuments({ status: "paid" }),
    ]);

    customerCount = customers;
    activeServicesCount = activeServices;
    totalAppointmentsCount = totalAppointments;
    pendingAppointmentsCount = pendingAppointments;
    confirmedAppointmentsCount = confirmedAppointments;
    successfulPaymentsCount = successfulPayments;
  } catch (error) {
    console.error("Failed to load admin overview stats:", error);
  }

  const stats = [
    {
      label: "Registered Customers",
      value: String(customerCount),
      icon: Users,
      description: "Active customer accounts",
    },
    {
      label: "Active Services",
      value: String(activeServicesCount),
      icon: Scissors,
      description: "Available salon services",
    },
    {
      label: "Appointment Requests",
      value: String(totalAppointmentsCount),
      icon: CalendarClock,
      description: "Total bookings submitted",
    },
    {
      label: "Pending Appointments",
      value: String(pendingAppointmentsCount),
      icon: Clock,
      description: "Require salon review",
    },
    {
      label: "Confirmed Appointments",
      value: String(confirmedAppointmentsCount),
      icon: CheckCircle2,
      description: "Scheduled for service",
    },
    {
      label: "Successful Payments",
      value: String(successfulPaymentsCount),
      icon: CreditCard,
      description: "Completed Stripe payments",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary">
            Admin Overview
          </h1>
          <p className="text-sm text-fg-muted">
            Manage your salon services, bookings, customers, and transactions.
          </p>
        </div>
        <Button
          className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium"
          render={<Link href="/dashboard/admin/services" />}
        >
          <Plus className="size-4 mr-1.5" aria-hidden />
          Manage Services
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-border-subtle bg-bg-surface-card"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-fg-muted">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-bg-accent-brand" aria-hidden />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-fg-primary">
                {stat.value}
              </div>
              <CardDescription className="text-xs text-fg-muted mt-1">
                {stat.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
