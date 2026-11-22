"use client";

import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { CustomerAppointmentDetailsDialog } from "@/components/customer/CustomerAppointmentDetailsDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cancelCustomerAppointmentAction } from "@/lib/actions/appointments";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

interface MyAppointmentsClientProps {
  initialAppointments: Appointment[];
}

export function MyAppointmentsClient({
  initialAppointments,
}: MyAppointmentsClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );

  // Modal states
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Cancel Confirmation Modal State
  const [cancellingAppointment, setCancellingAppointment] =
    useState<Appointment | null>(null);
  const [isCancellingPending, startCancelTransition] = useTransition();

  // Payment notice dialog state
  const [payingAppointment, setPayingAppointment] =
    useState<Appointment | null>(null);

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
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false;
      }

      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = app.serviceName?.toLowerCase().includes(query);
        const matchesCategory = app.serviceCategory
          ?.toLowerCase()
          .includes(query);
        const matchesDate = app.appointmentDate.includes(query);
        const matchesTime = app.timeSlot.toLowerCase().includes(query);

        if (!matchesName && !matchesCategory && !matchesDate && !matchesTime)
          return false;
      }

      return true;
    });
  }, [appointments, search, statusFilter]);

  // Handle Cancel Submission
  const handleConfirmCancel = () => {
    if (!cancellingAppointment) return;

    // Rule: Customers cannot cancel an already confirmed or cancelled appointment.
    if (cancellingAppointment.status !== "pending") {
      toast.error(
        "Only pending appointment requests can be cancelled online. Please contact the salon for confirmed bookings.",
      );
      setCancellingAppointment(null);
      return;
    }

    startCancelTransition(async () => {
      try {
        const res = await cancelCustomerAppointmentAction(
          cancellingAppointment._id,
        );
        if (res.success) {
          toast.success(
            res.message || "Appointment request cancelled successfully.",
          );
          setAppointments((prev) =>
            prev.map((app) =>
              app._id === cancellingAppointment._id
                ? {
                    ...app,
                    status: "cancelled",
                    updatedAt: new Date().toISOString(),
                  }
                : app,
            ),
          );
          setCancellingAppointment(null);
          router.refresh();
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Failed to cancel appointment.";
        toast.error(msg);
      }
    });
  };

  const handlePayNow = (appointment: Appointment) => {
    // Rule: Customers cannot pay for cancelled or pending appointments.
    if (appointment.status !== "confirmed") {
      toast.error("You can only pay for confirmed appointments.");
      return;
    }
    if (appointment.paymentStatus === "paid") {
      toast.info("This appointment has already been paid for.");
      return;
    }
    setPayingAppointment(appointment);
  };

  const openDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl flex items-center gap-2">
            <CalendarCheck className="size-7 text-bg-accent-brand" />
            My Appointments
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Track your appointment requests, review scheduled times, cancel
            pending slots, or pay for confirmed bookings.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            className="border-border-subtle text-fg-primary text-xs"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium text-xs"
            render={<Link href="/services" />}
          >
            <Sparkles className="size-3.5 mr-1.5" />
            Book New Service
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total */}
        <Card className="border-border-subtle bg-bg-surface-card shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-medium text-fg-muted">
              Total Appointments
            </span>
            <div className="mt-2 text-2xl font-bold text-fg-primary">
              {stats.total}
            </div>
            <span className="text-[11px] text-fg-muted mt-1 block">
              Lifetime requests
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
              Awaiting salon review
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
              Ready for your visit
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
              Cancelled requests
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            placeholder="Search by service or date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-canvas/50 p-1 text-xs">
          {(["all", "pending", "confirmed", "cancelled"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? "bg-bg-accent-brand text-fg-on-accent shadow-xs"
                  : "text-fg-muted hover:text-fg-primary"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List / Table */}
      {filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-surface-card p-12 text-center shadow-xs">
          <div className="flex size-14 items-center justify-center rounded-full bg-bg-canvas text-fg-muted mb-4">
            <Calendar className="size-6" aria-hidden />
          </div>
          <h3 className="text-base font-bold text-fg-primary">
            No appointments found
          </h3>
          <p className="mt-1 max-w-sm text-xs text-fg-muted">
            {appointments.length === 0
              ? "You haven't scheduled any salon appointments yet. Explore our treatments to book your first session."
              : "No appointments match your search or status filter."}
          </p>
          <div className="mt-4 flex gap-2">
            {search || statusFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="border-border-subtle text-xs"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-bg-accent-brand text-fg-on-accent font-medium text-xs"
                render={<Link href="/services" />}
              >
                Explore Services
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border-subtle bg-bg-canvas/50 text-fg-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Service</th>
                  <th className="py-3 px-4 font-semibold">
                    Appointment Date & Time
                  </th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold">Requested On</th>
                  <th className="py-3 px-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-fg-primary">
                {filteredAppointments.map((app) => {
                  const reqDateFormatted = new Date(
                    app.createdAt,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  const isPending = app.status === "pending";
                  const isConfirmed = app.status === "confirmed";
                  const isUnpaid = app.paymentStatus === "unpaid";

                  return (
                    <tr
                      key={app._id}
                      className="hover:bg-bg-canvas/40 transition-colors"
                    >
                      {/* Service Name & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {app.serviceImage ? (
                            <div className="relative size-12 rounded-lg overflow-hidden bg-bg-canvas shrink-0 border border-border-subtle">
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
                            <span className="font-semibold text-fg-primary block line-clamp-1">
                              {app.serviceName || "Salon Service"}
                            </span>
                            {app.serviceCategory ? (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-normal border-border-subtle text-fg-muted mt-0.5"
                              >
                                {app.serviceCategory}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Appointment Date & Time */}
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
                      <td className="py-3.5 px-4 font-bold text-fg-primary text-sm">
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

                      {/* Request Date */}
                      <td className="py-3.5 px-4 text-[11px] text-fg-muted whitespace-nowrap">
                        {reqDateFormatted}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View Details"
                            onClick={() => openDetails(app)}
                            className="size-8 text-fg-muted hover:text-fg-primary"
                          >
                            <Eye className="size-4" />
                          </Button>

                          {/* Pay Now Button:
                              Rule: Customers cannot pay for cancelled or pending appointments.
                              Only enabled when status === 'confirmed' and paymentStatus === 'unpaid'.
                           */}
                          {isConfirmed && isUnpaid ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayNow(app)}
                              className="h-7 px-2.5 bg-bg-accent-brand text-fg-on-accent hover:opacity-90 text-[11px] font-semibold"
                            >
                              <CreditCard className="size-3 mr-1" />
                              Pay Now
                            </Button>
                          ) : null}

                          {/* Cancel Button:
                              Rule: Customers cannot cancel an already confirmed or cancelled appointment.
                              A customer can cancel ONLY pending appointments.
                           */}
                          {isPending ? (
                            <Button
                              variant="outline"
                              size="sm"
                              title="Cancel Pending Request"
                              onClick={() => setCancellingAppointment(app)}
                              className="h-7 px-2 text-[11px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                              <X className="size-3 mr-1" />
                              Cancel
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
      <CustomerAppointmentDetailsDialog
        appointment={selectedAppointment}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onCancelled={(id) => {
          setAppointments((prev) =>
            prev.map((app) =>
              app._id === id
                ? {
                    ...app,
                    status: "cancelled",
                    updatedAt: new Date().toISOString(),
                  }
                : app,
            ),
          );
        }}
        onPayNow={(app) => handlePayNow(app)}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={Boolean(cancellingAppointment)}
        onOpenChange={(open) => !open && setCancellingAppointment(null)}
      >
        <DialogContent className="max-w-md bg-bg-surface-card border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-fg-primary flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600" />
              Cancel Appointment Request?
            </DialogTitle>
            <DialogDescription className="text-xs text-fg-muted mt-1">
              Are you sure you want to cancel your appointment request for{" "}
              <strong className="text-fg-primary">
                {cancellingAppointment?.serviceName}
              </strong>{" "}
              scheduled on{" "}
              <strong className="text-fg-primary">
                {cancellingAppointment?.appointmentDate} at{" "}
                {cancellingAppointment?.timeSlot}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border-subtle bg-bg-canvas/50 p-3 text-xs text-fg-muted">
            Once cancelled, this time slot will be released and you will need to
            submit a new request if you wish to reschedule.
          </div>
          <DialogFooter className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isCancellingPending}
              onClick={() => setCancellingAppointment(null)}
              className="border-border-subtle text-xs text-fg-primary"
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isCancellingPending}
              onClick={handleConfirmCancel}
              className="text-xs font-semibold"
            >
              {isCancellingPending ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Confirm Cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Now Information Dialog */}
      <Dialog
        open={Boolean(payingAppointment)}
        onOpenChange={(open) => !open && setPayingAppointment(null)}
      >
        <DialogContent className="max-w-md bg-bg-surface-card border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-fg-primary flex items-center gap-2">
              <CreditCard className="size-5 text-bg-accent-brand" />
              Pay for Confirmed Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-fg-muted mt-1">
              {payingAppointment?.serviceName} • Total Amount: $
              {payingAppointment?.servicePrice.toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-xl border border-emerald-600/20 bg-emerald-50/60 p-3.5 text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Slot Confirmed by Salon Staff</span>
              </div>
              <p className="mt-1 text-emerald-700">
                Your appointment on {payingAppointment?.appointmentDate} at{" "}
                {payingAppointment?.timeSlot} is confirmed.
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3.5 text-fg-muted">
              <div className="flex items-center gap-1.5 font-semibold text-fg-primary mb-1">
                <Info className="size-4 text-bg-accent-brand" />
                Payment Notice
              </div>
              <p className="leading-relaxed">
                Online payment gateway will be enabled soon. You can pay
                securely at the salon reception during your appointment via
                cash, card, or digital wallet.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              className="w-full bg-bg-accent-brand text-fg-on-accent font-semibold text-xs"
              onClick={() => {
                toast.info(
                  "Online payment gateway integration will be active soon. Please settle at the salon reception upon visit.",
                );
                setPayingAppointment(null);
              }}
            >
              Acknowledge & Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
