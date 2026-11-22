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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Overview | Velvet Saloon",
  description: "Salon management overview and operational statistics.",
};

export default function AdminDashboardPage() {
  const stats = [
    {
      label: "Registered Customers",
      value: "0",
      icon: Users,
      description: "Active customer accounts",
    },
    {
      label: "Active Services",
      value: "0",
      icon: Scissors,
      description: "Available salon services",
    },
    {
      label: "Appointment Requests",
      value: "0",
      icon: CalendarClock,
      description: "Total bookings submitted",
    },
    {
      label: "Pending Appointments",
      value: "0",
      icon: Clock,
      description: "Require salon review",
    },
    {
      label: "Confirmed Appointments",
      value: "0",
      icon: CheckCircle2,
      description: "Scheduled for service",
    },
    {
      label: "Successful Payments",
      value: "0",
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
