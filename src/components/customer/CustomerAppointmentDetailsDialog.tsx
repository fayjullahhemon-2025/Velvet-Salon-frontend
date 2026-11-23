"use client";

import {
  Calendar,
  Clock,
  CreditCard,
  Info,
  Loader2,
  MessageSquare,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useTransition } from "react";
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
import { cancelCustomerAppointmentAction } from "@/lib/actions/appointments";
import type { Appointment } from "@/types/appointment";

interface CustomerAppointmentDetailsDialogProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelled?: (appointmentId: string) => void;
  onPayNow?: (appointment: Appointment) => void;
}

export function CustomerAppointmentDetailsDialog({
  appointment,
  isOpen,
  onClose,
  onCancelled,
  onPayNow,
}: CustomerAppointmentDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();

  if (!appointment) return null;

  const canCancel = appointment.status === "pending";
  const canPay =
    appointment.status === "confirmed" &&
    appointment.paymentStatus === "unpaid";

  const handleCancel = () => {
    if (!canCancel) {
      toast.error(
        "Only pending appointment requests can be cancelled online. Please contact the salon for assistance.",
      );
      return;
    }

    startTransition(async () => {
      try {
        const res = await cancelCustomerAppointmentAction(appointment._id);
        if (res.success) {
          toast.success(
            res.message || "Appointment request cancelled successfully.",
          );
          onCancelled?.(appointment._id);
          onClose();
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
      <DialogContent className="sm:max-w-xl w-full bg-bg-surface-card border-border-subtle max-h-[90vh] overflow-y-auto overflow-x-hidden p-6">
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

        <div className="space-y-4 py-3 text-sm">
          {/* Service Information Card */}
          <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4">
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
                  <h4 className="font-bold text-fg-primary text-base">
                    {appointment.serviceName || "Salon Service"}
                  </h4>
                  <span className="font-bold text-fg-primary text-base">
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

          {/* Schedule Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3.5">
              <span className="text-xs text-fg-muted block mb-1">
                Appointment Date
              </span>
              <div className="flex items-center gap-2 text-fg-primary font-bold">
                <Calendar className="size-4 text-bg-accent-brand" />
                <span>{appointment.appointmentDate}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3.5">
              <span className="text-xs text-fg-muted block mb-1">
                Appointment Time
              </span>
              <div className="flex items-center gap-2 text-fg-primary font-bold">
                <Clock className="size-4 text-bg-accent-brand" />
                <span>{appointment.timeSlot}</span>
              </div>
            </div>
          </div>

          {/* Customer Message */}
          <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-bg-accent-brand" />
              Special Notes / Requests
            </h5>
            {appointment.message ? (
              <p className="text-xs text-fg-primary leading-relaxed italic bg-bg-surface-card p-3 rounded-lg border border-border-subtle">
                &ldquo;{appointment.message}&rdquo;
              </p>
            ) : (
              <p className="text-xs text-fg-muted italic">
                No special requests were included with this booking.
              </p>
            )}
          </div>

          {/* Status Context Alerts */}
          {appointment.status === "pending" ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400 flex items-start gap-2">
              <Info className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">
                  Pending Confirmation
                </span>
                <span>
                  Our salon staff is reviewing your booking request. You can
                  cancel this request anytime while it remains pending.
                </span>
              </div>
            </div>
          ) : appointment.status === "confirmed" &&
            appointment.paymentStatus === "unpaid" ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-start gap-2">
              <Info className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Confirmed Booking</span>
                <span>
                  Your appointment slot is reserved! You can proceed to payment
                  or pay upon arrival at the salon reception.
                </span>
              </div>
            </div>
          ) : appointment.status === "cancelled" ? (
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-3 text-xs text-fg-muted flex items-start gap-2">
              <XCircle className="size-4 text-fg-muted shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">
                  Cancelled Appointment
                </span>
                <span>
                  This appointment has been cancelled and cannot be modified.
                </span>
              </div>
            </div>
          ) : null}
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

          {/* Cancel button: enabled only for pending requests */}
          {canCancel ? (
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleCancel}
              className="w-full sm:w-auto text-xs font-semibold whitespace-nowrap shrink-0"
            >
              {isPending ? (
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5 mr-1.5" />
              )}
              Cancel Request
            </Button>
          ) : null}

          {/* Pay Now button: enabled only for confirmed + unpaid */}
          {canPay ? (
            <Button
              type="button"
              onClick={() => onPayNow?.(appointment)}
              className="w-full sm:w-auto bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-semibold text-xs whitespace-nowrap shrink-0"
            >
              <CreditCard className="size-3.5 mr-1.5" />
              Pay Now (${appointment.servicePrice.toFixed(2)})
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
