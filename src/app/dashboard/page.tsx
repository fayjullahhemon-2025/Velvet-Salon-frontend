import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Sparkles,
  XCircle,
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
  title: "Customer Overview | Velvet Saloon",
  description: "Overview of your salon appointment requests and bookings.",
};

export default function CustomerDashboardPage() {
  const stats = [
    {
      label: "Total Requests",
      value: "0",
      icon: CalendarClock,
      description: "All appointments booked",
    },
    {
      label: "Pending",
      value: "0",
      icon: Clock,
      description: "Awaiting salon confirmation",
    },
    {
      label: "Confirmed",
      value: "0",
      icon: CheckCircle2,
      description: "Ready for your visit",
    },
    {
      label: "Cancelled",
      value: "0",
      icon: XCircle,
      description: "Cancelled bookings",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary">
            Customer Overview
          </h1>
          <p className="text-sm text-fg-muted">
            Track your appointment requests, booking status, and salon visits.
          </p>
        </div>
        <Button
          className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium"
          render={<Link href="/services" />}
        >
          <Sparkles className="size-4 mr-1.5" aria-hidden />
          Browse Services
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
