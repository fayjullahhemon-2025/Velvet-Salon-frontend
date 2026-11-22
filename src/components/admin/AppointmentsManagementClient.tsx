"use client";

import {
  Calendar,
  CalendarCheck,
  Check,
  Clock,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AppointmentDetailsDialog } from "@/components/admin/AppointmentDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateAppointmentStatusAction } from "@/lib/actions/appointments";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

interface AppointmentsManagementClientProps {
  initialAppointments: Appointment[];
}

export function AppointmentsManagementClient({
  initialAppointments,
}: AppointmentsManagementClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );
  const [dateFilter, setDateFilter] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [activeUpdatingId, setActiveUpdatingId] = useState<string | null>(null);
  const [_isPending, startTransition] = useTransition();

  // Compute live statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter(
      (a) => a.status === "confirmed",
    ).length;
    const cancelled = appointments.filter(
      (a) => a.status === "cancelled",
    ).length;
    return { total, pending, confirmed, cancelled };
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Status filter
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter && app.appointmentDate !== dateFilter) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesCustomer =
          app.customerName?.toLowerCase().includes(query) ||
          app.customerEmail?.toLowerCase().includes(query) ||
          app.customerId.toLowerCase().includes(query);
        const matchesService =
          app.serviceName?.toLowerCase().includes(query) ||
          app.serviceCategory?.toLowerCase().includes(query);
        const matchesDate = app.appointmentDate.includes(query);
        const matchesSlot = app.timeSlot.toLowerCase().includes(query);

        if (!matchesCustomer && !matchesService && !matchesDate && !matchesSlot)
          return false;
      }

      return true;
    });
  }, [appointments, search, statusFilter, dateFilter]);

  // Action: Confirm or Cancel appointment from table or dialog
  const handleUpdateStatus = (
    appointmentId: string,
    newStatus: "confirmed" | "cancelled",
  ) => {
    const target = appointments.find((a) => a._id === appointmentId);
    if (!target) return;

    // Rule: Only pending appointments can be confirmed
    if (newStatus === "confirmed" && target.status !== "pending") {
      toast.error(
        `Only pending appointments can be confirmed. Current status is '${target.status}'.`,
      );
      return;
    }

    if (newStatus === "cancelled" && target.status === "cancelled") {
      toast.error("This appointment is already cancelled.");
      return;
    }

    setActiveUpdatingId(appointmentId);

    startTransition(async () => {
      try {
        const token = await getTokenFromClient().catch(() => undefined);
        const res = await updateAppointmentStatusAction(
          appointmentId,
          newStatus,
          token,
        );
        if (res.success) {
          toast.success(
            res.message || `Appointment marked as ${newStatus} successfully.`,
          );
          setAppointments((prev) =>
            prev.map((app) =>
              app._id === appointmentId
                ? {
                    ...app,
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                  }
                : app,
            ),
          );
          if (selectedAppointment?._id === appointmentId) {
            setSelectedAppointment((prev) =>
              prev ? { ...prev, status: newStatus } : null,
            );
          }
          router.refresh();
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Failed to update appointment status.";
        toast.error(errorMsg);
      } finally {
        setActiveUpdatingId(null);
      }
    });
  };

  const openDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFilter("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl flex items-center gap-2">
            <CalendarCheck className="size-7 text-bg-accent-brand" />
            Manage Appointments
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Admin can view all appointment requests, inspect customer details,
            confirm pending bookings, and cancel appointments.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.refresh()}
          className="self-start sm:self-auto border-border-subtle text-fg-primary"
        >
          <RefreshCw className="size-3.5 mr-1.5" />
          Refresh List
        </Button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-fg-muted">
              Total Requests
            </span>
            <div className="mt-2 text-2xl font-bold text-fg-primary">
              {stats.total}
            </div>
            <span className="text-[11px] text-fg-muted mt-1 block">
              All lifetime bookings
            </span>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-amber-600">
              Pending Confirmation
            </span>
            <div className="mt-2 text-2xl font-bold text-amber-600">
              {stats.pending}
            </div>
            <span className="text-[11px] text-fg-muted mt-1 block">
              Needs staff review
            </span>
          </CardContent>
        </Card>

        {/* Confirmed */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-emerald-600">
              Confirmed
            </span>
            <div className="mt-2 text-2xl font-bold text-emerald-600">
              {stats.confirmed}
            </div>
            <span className="text-[11px] text-fg-muted mt-1 block">
              Approved appointments
            </span>
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-neutral-500">
              Cancelled
            </span>
            <div className="mt-2 text-2xl font-bold text-neutral-600">
              {stats.cancelled}
            </div>
            <span className="text-[11px] text-fg-muted mt-1 block">
              Voided / withdrawn
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface-card p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            placeholder="Search by customer name, email, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-canvas/50 p-1 text-xs">
            {(["all", "pending", "confirmed", "cancelled"] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    statusFilter === st
                      ? "bg-bg-accent-brand text-fg-on-accent shadow-xs"
                      : "text-fg-muted hover:text-fg-primary"
                  }`}
                >
                  {st}
                </button>
              ),
            )}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-fg-muted" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 text-xs py-1 px-2.5 w-auto"
            />
          </div>

          {search || statusFilter !== "all" || dateFilter ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs text-fg-muted hover:text-fg-primary"
            >
              <X className="size-3.5 mr-1" />
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      {/* Appointments List / Table */}
      {filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-surface-card p-12 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-bg-canvas text-fg-muted mb-4">
            <Calendar className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-fg-primary">
            No appointment requests found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-fg-muted">
            {appointments.length === 0
              ? "No customer appointment requests have been submitted yet."
              : "No appointments match your active filters or search query."}
          </p>
          {search || statusFilter !== "all" || dateFilter ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 border-border-subtle text-xs"
            >
              Reset Filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border-subtle bg-bg-canvas/50 text-fg-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Service</th>
                  <th className="py-3 px-4 font-semibold">
                    Appointment Date & Time
                  </th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold">Request Date</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-fg-primary">
                {filteredAppointments.map((app) => {
                  const isUpdating = activeUpdatingId === app._id;
                  const reqDateFormatted = new Date(
                    app.createdAt,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-bg-canvas/40 transition-colors"
                    >
                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-fg-primary">
                          {app.customerName || "Customer"}
                        </div>
                        <div className="text-[11px] text-fg-muted flex items-center gap-1 mt-0.5">
                          <Mail className="size-3 text-fg-muted" />
                          <span>{app.customerEmail || "No email"}</span>
                        </div>
                      </td>

                      {/* Service Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {app.serviceImage ? (
                            <div className="relative size-10 rounded-md overflow-hidden bg-bg-canvas shrink-0 border border-border-subtle">
                              <Image
                                src={app.serviceImage}
                                alt={app.serviceName || "Service"}
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                          ) : null}
                          <div>
                            <span className="font-medium text-fg-primary block line-clamp-1">
                              {app.serviceName || "Service"}
                            </span>
                            {app.serviceCategory ? (
                              <span className="text-[10px] text-fg-muted block">
                                {app.serviceCategory}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Appointment Date & Time Slot */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-fg-primary">
                          {app.appointmentDate}
                        </div>
                        <div className="text-[11px] text-fg-muted flex items-center gap-1 mt-0.5">
                          <Clock className="size-3 text-bg-accent-brand" />
                          <span>{app.timeSlot}</span>
                        </div>
                      </td>

                      {/* Service Price */}
                      <td className="py-3.5 px-4 font-bold text-fg-primary">
                        ${app.servicePrice.toFixed(2)}
                      </td>

                      {/* Appointment Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            app.status === "confirmed"
                              ? "bg-emerald-600 text-white"
                              : app.status === "cancelled"
                                ? "bg-neutral-600 text-white"
                                : "bg-amber-600 text-white"
                          }`}
                        >
                          {app.status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            app.paymentStatus === "paid"
                              ? "border-emerald-600 text-emerald-600 bg-emerald-50"
                              : "border-border-subtle text-fg-muted bg-bg-canvas"
                          }`}
                        >
                          {app.paymentStatus.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Booking Request Date */}
                      <td className="py-3.5 px-4 text-[11px] text-fg-muted whitespace-nowrap">
                        {reqDateFormatted}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details Button */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View Appointment Details"
                            onClick={() => openDetails(app)}
                            className="size-8 text-fg-muted hover:text-fg-primary"
                          >
                            <Eye className="size-4" />
                          </Button>

                          {/* Confirm Button: Rule: Only pending appointments can be confirmed */}
                          {app.status === "pending" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Confirm Pending Appointment"
                              disabled={isUpdating}
                              onClick={() =>
                                handleUpdateStatus(app._id, "confirmed")
                              }
                              className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-4" />
                              )}
                            </Button>
                          ) : null}

                          {/* Cancel Button: Admin can cancel pending or confirmed appointments */}
                          {app.status !== "cancelled" ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Cancel Appointment"
                              disabled={isUpdating}
                              onClick={() =>
                                handleUpdateStatus(app._id, "cancelled")
                              }
                              className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-4" />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      <AppointmentDetailsDialog
        appointment={selectedAppointment}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onStatusUpdated={(id, status) => {
          setAppointments((prev) =>
            prev.map((app) =>
              app._id === id
                ? { ...app, status, updatedAt: new Date().toISOString() }
                : app,
            ),
          );
        }}
      />
    </div>
  );
}
