"use client";

import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  Mail,
  MessageSquare,
  Scissors,
  User,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateAppointmentStatusAction } from "@/lib/actions/appointments";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import type { Appointment } from "@/types/appointment";

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (
    appointmentId: string,
    newStatus: "confirmed" | "cancelled",
  ) => void;
}

export function AppointmentDetailsDialog({
  appointment,
  isOpen,
  onClose,
  onStatusUpdated,
}: AppointmentDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmActionType, setConfirmActionType] = useState<
    "confirm" | "cancel" | null
  >(null);

  if (!appointment) return null;

  const handleUpdateStatus = (newStatus: "confirmed" | "cancelled") => {
    // Rule: Only pending appointments can be confirmed
    if (newStatus === "confirmed" && appointment.status !== "pending") {
      toast.error(
        `Only pending appointments can be confirmed. Current status is ${appointment.status}.`,
      );
      return;
    }

    if (newStatus === "cancelled" && appointment.status === "cancelled") {
      toast.error("This appointment is already cancelled.");
      return;
    }

    startTransition(async () => {
      try {
        const token = await getTokenFromClient().catch(() => undefined);
        const res = await updateAppointmentStatusAction(
          appointment._id,
          newStatus,
          token,
        );
        if (res.success) {
          toast.success(
            res.message || `Appointment successfully marked as ${newStatus}.`,
          );
          onStatusUpdated?.(appointment._id, newStatus);
          setConfirmActionType(null);
          onClose();
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Failed to update appointment status.";
        toast.error(errorMsg);
      }
    });
  };

  const formattedRequestDate = new Date(
    appointment.createdAt,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl w-full bg-bg-surface-card border-border-subtle max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-fg-primary flex items-center gap-2">
              <Calendar className="size-5 text-bg-accent-brand" />
              Appointment Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <Badge
                className={`text-xs font-semibold px-2.5 py-0.5 ${
                  appointment.status === "confirmed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : appointment.status === "cancelled"
                      ? "bg-neutral-800 text-neutral-400 border border-neutral-700"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {appointment.status.toUpperCase()}
              </Badge>
              {/* Payment Badge */}
              <Badge
                variant="outline"
                className={`text-xs font-semibold px-2.5 py-0.5 ${
                  appointment.paymentStatus === "paid"
                    ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                    : "border-border-subtle text-fg-muted bg-bg-canvas"
                }`}
              >
                {appointment.paymentStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs text-fg-muted">
            Booking ID: #{appointment._id} • Requested on {formattedRequestDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3 text-sm">
          {/* Customer Information Card */}
          <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-3 flex items-center gap-1.5">
              <User className="size-4 text-bg-accent-brand" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-fg-muted block">Full Name</span>
                <span className="font-semibold text-fg-primary text-sm">
                  {appointment.customerName || "Customer"}
                </span>
              </div>
              <div>
                <span className="text-fg-muted block">Email Address</span>
                <span className="font-medium text-fg-primary flex items-center gap-1">
                  <Mail className="size-3.5 text-fg-muted" />
                  {appointment.customerEmail || "Not provided"}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-fg-muted block">Customer Account ID</span>
                <span className="font-mono text-[11px] text-fg-muted">
                  {appointment.customerId}
                </span>
              </div>
            </div>
          </div>

          {/* Service Information Card */}
          <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-3 flex items-center gap-1.5">
              <Scissors className="size-4 text-bg-accent-brand" />
              Service Information
            </h4>
            <div className="flex items-start gap-4">
              {appointment.serviceImage ? (
                <div className="relative size-16 rounded-lg overflow-hidden border border-border-subtle bg-bg-surface-card shrink-0">
                  <Image
                    src={appointment.serviceImage}
                    alt={appointment.serviceName || "Service"}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-fg-primary text-sm sm:text-base">
                    {appointment.serviceName || "Salon Service"}
                  </h5>
                  <span className="font-bold text-fg-primary text-sm sm:text-base">
                    ${appointment.servicePrice.toFixed(2)}
                  </span>
                </div>
                {appointment.serviceCategory ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] border-border-subtle text-fg-muted"
                  >
                    {appointment.serviceCategory}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {/* Appointment Schedule & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4">
              <span className="text-xs text-fg-muted block mb-1">
                Scheduled Date
              </span>
              <div className="flex items-center gap-2 text-fg-primary font-bold">
                <Calendar className="size-4 text-bg-accent-brand" />
                <span>{appointment.appointmentDate}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4">
              <span className="text-xs text-fg-muted block mb-1">
                Reserved Time Slot
              </span>
              <div className="flex items-center gap-2 text-fg-primary font-bold">
                <Clock className="size-4 text-bg-accent-brand" />
                <span>{appointment.timeSlot}</span>
              </div>
            </div>
          </div>

          {/* Customer Message */}
          <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-2 flex items-center gap-1.5">
              <MessageSquare className="size-4 text-bg-accent-brand" />
              Customer Message / Request Notes
            </h4>
            {appointment.message ? (
              <p className="text-xs text-fg-primary leading-relaxed bg-bg-surface-card p-3 rounded-lg border border-border-subtle italic">
                &ldquo;{appointment.message}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-fg-muted italic">
                No special requests or message provided by the customer.
              </p>
            )}
          </div>

          {/* Payment & Status Summary */}
          <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface-card p-3 text-xs">
            <div className="flex items-center gap-1.5 text-fg-muted">
              <DollarSign className="size-4 text-bg-accent-brand" />
              <span>Service Charge:</span>
              <span className="font-bold text-fg-primary">
                ${appointment.servicePrice.toFixed(2)}
              </span>
            </div>
            <div className="text-fg-muted">
              Payment Status:{" "}
              <span
                className={`font-semibold ${
                  appointment.paymentStatus === "paid"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {appointment.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-2.5 pt-4 border-t border-border-subtle">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="w-full sm:w-auto border-border-subtle text-fg-primary text-xs shrink-0"
          >
            Close
          </Button>

          {/* Cancel button: can cancel pending or confirmed appointments */}
          {appointment.status !== "cancelled" ? (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => handleUpdateStatus("cancelled")}
              className="w-full sm:w-auto font-medium text-xs whitespace-nowrap shrink-0"
            >
              {isPending && confirmActionType === "cancel" ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5 mr-1.5" />
              )}
              Cancel Appointment
            </Button>
          ) : null}

          {/* Confirm button: Rule: Only pending appointments can be confirmed */}
          {appointment.status === "pending" ? (
            <Button
              type="button"
              disabled={isPending}
              onClick={() => handleUpdateStatus("confirmed")}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs whitespace-nowrap shrink-0"
            >
              {isPending && confirmActionType === "confirm" ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="size-3.5 mr-1.5" />
              )}
              Confirm Appointment
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
