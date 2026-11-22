"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointmentAction,
  fetchBookedSlotsAction,
} from "@/lib/actions/appointments";
import { getTokenFromClient } from "@/lib/getTokenFromClient";
import { APPOINTMENT_TIME_SLOTS, type Appointment } from "@/types/appointment";
import type { Service } from "@/types/service";

interface AppointmentBookingFormProps {
  service: Service;
  isLoggedIn: boolean;
  userRole?: string | null;
}

export function AppointmentBookingForm({
  service,
  isLoggedIn,
  userRole,
}: AppointmentBookingFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [message, setMessage] = useState("");

  // Booked slots for selected date
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Success Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(
    null,
  );

  const isInactive = service.status !== "active";
  const isAdmin = userRole === "admin";
  const _isCustomer = isLoggedIn && !isAdmin;

  // Whenever appointment date changes, fetch reserved slots for this service
  useEffect(() => {
    if (!service._id || !appointmentDate) return;

    let active = true;
    setLoadingSlots(true);

    fetchBookedSlotsAction(service._id, appointmentDate)
      .then((slots) => {
        if (active) {
          setBookedSlots(slots || []);
          // Clear selected slot if it became unavailable
          if (selectedSlot && slots.includes(selectedSlot)) {
            setSelectedSlot("");
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load booked slots:", err);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [service._id, appointmentDate, selectedSlot]);

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please sign in as a customer to book an appointment.");
      return;
    }

    if (isAdmin) {
      toast.error(
        "Administrators cannot book customer appointments. Please use a customer account.",
      );
      return;
    }

    if (isInactive) {
      toast.error("This service is inactive and cannot be booked.");
      return;
    }

    if (!appointmentDate) {
      toast.error("Please pick an appointment date.");
      return;
    }

    if (appointmentDate < todayStr) {
      toast.error("Appointment date cannot be in the past.");
      return;
    }

    if (!selectedSlot) {
      toast.error("Please select an available appointment time slot.");
      return;
    }

    startTransition(async () => {
      try {
        const clientToken = await getTokenFromClient().catch(() => undefined);
        const result = await createAppointmentAction({
          serviceId: service._id,
          appointmentDate,
          timeSlot: selectedSlot,
          message: message.trim(),
          token: clientToken,
        });

        if (result?.success) {
          toast.success(
            result.message || "Appointment request submitted successfully!",
          );
          if (result.data) {
            setConfirmedBooking(result.data as unknown as Appointment);
          }
          router.refresh();
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Failed to submit appointment request. Please try again.";
        toast.error(errorMsg);
      }
    });
  };

  // 1. Success confirmation screen
  if (confirmedBooking) {
    return (
      <div className="rounded-2xl border border-emerald-600/30 bg-bg-surface-card p-6 shadow-sm animate-in fade-in duration-300">
        <div className="flex items-center gap-3 text-emerald-600 mb-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-fg-primary">
              Appointment Request Submitted!
            </h3>
            <p className="text-xs text-fg-muted">
              Status:{" "}
              <span className="font-semibold text-amber-600">Pending</span> •
              Payment:{" "}
              <span className="font-semibold text-fg-muted">Unpaid</span>
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-canvas/50 p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-fg-muted">Service:</span>
            <span className="font-semibold text-fg-primary">
              {service.serviceName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Date:</span>
            <span className="font-semibold text-fg-primary">
              {confirmedBooking.appointmentDate || appointmentDate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Time Slot:</span>
            <span className="font-semibold text-fg-primary">
              {confirmedBooking.timeSlot || selectedSlot}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-fg-muted">Estimated Price:</span>
            <span className="font-bold text-fg-primary">
              ${service.price.toFixed(2)}
            </span>
          </div>
          {confirmedBooking.message ? (
            <div className="border-t border-border-subtle pt-2">
              <span className="text-fg-muted block mb-1">Your Note:</span>
              <p className="text-fg-primary italic">
                &ldquo;{confirmedBooking.message}&rdquo;
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-fg-muted">
          Our salon team will review your appointment request. You can track
          status updates and pay for confirmed appointments in your dashboard.
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Button
            className="flex-1 bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium"
            render={<Link href="/dashboard/customer/my-appointments" />}
          >
            View My Appointments
          </Button>
          <Button
            variant="outline"
            className="border-border-subtle text-fg-primary hover:bg-bg-canvas"
            onClick={() => {
              setConfirmedBooking(null);
              setSelectedSlot("");
              setMessage("");
              setIsOpen(false);
            }}
          >
            Book Another Slot
          </Button>
        </div>
      </div>
    );
  }

  // 2. Initial closed trigger state
  if (!isOpen) {
    return (
      <div className="border-t border-border-subtle pt-6">
        {isInactive ? (
          <div className="rounded-xl border border-amber-600/20 bg-amber-50/50 p-4 text-xs text-amber-800 mb-4">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="size-4 shrink-0 text-amber-600" />
              <span>Service Inactive</span>
            </div>
            <p className="mt-1 text-amber-700">
              This salon treatment is currently unavailable for booking. Please
              browse our active catalog.
            </p>
          </div>
        ) : null}

        <Button
          disabled={isInactive}
          onClick={() => setIsOpen(true)}
          className="w-full bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-semibold py-3 text-base shadow-xs"
        >
          <Calendar className="size-4 mr-2" aria-hidden />
          {isInactive ? "Service Currently Inactive" : "Book Appointment Now"}
        </Button>
        <p className="mt-2 text-center text-xs text-fg-muted">
          {isLoggedIn
            ? "Choose your appointment date and time slot with instant submission."
            : "Requires a customer account to schedule your appointment slot."}
        </p>
      </div>
    );
  }

  // 3. Unauthenticated State (Prompt to Sign In)
  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-border-subtle bg-bg-surface-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-fg-primary mb-3">
          <Lock className="size-5 text-bg-accent-brand" />
          <h3 className="text-base font-bold">Sign In Required</h3>
        </div>
        <p className="text-xs leading-relaxed text-fg-muted mb-5">
          Only authenticated customers can submit appointment requests. Please
          sign in or create an account to proceed with your booking for{" "}
          <strong className="text-fg-primary">{service.serviceName}</strong>.
        </p>
        <div className="flex flex-col gap-2.5">
          <Button
            className="w-full bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium"
            render={
              <Link
                href={`/signin?callbackUrl=${encodeURIComponent(`/services/${service._id}`)}`}
              />
            }
          >
            Sign In to Book
          </Button>
          <Button
            variant="outline"
            className="w-full border-border-subtle text-fg-primary hover:bg-bg-canvas"
            render={
              <Link
                href={`/signup?callbackUrl=${encodeURIComponent(`/services/${service._id}`)}`}
              />
            }
          >
            Create Customer Account
          </Button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-2 text-center text-xs text-fg-muted hover:text-fg-primary underline underline-offset-4"
          >
            Cancel and Return
          </button>
        </div>
      </div>
    );
  }

  // 4. Admin Role Guard State (Admins cannot book customer appointments)
  if (isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-600/30 bg-bg-surface-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-700 mb-3">
          <AlertCircle className="size-5 text-amber-600" />
          <h3 className="text-base font-bold text-fg-primary">
            Admin Account Detected
          </h3>
        </div>
        <p className="text-xs leading-relaxed text-fg-muted mb-4">
          You are currently signed in as an <strong>Administrator</strong>.
          Salon administrative rules require appointments to be booked under a
          customer account.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-border-subtle text-xs"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1 bg-bg-accent-brand text-fg-on-accent text-xs font-medium"
            render={<Link href="/dashboard/admin/appointments" />}
          >
            Manage Appointments
          </Button>
        </div>
      </div>
    );
  }

  // 5. Customer Booking Form
  return (
    <Card className="border-border-subtle bg-bg-surface-card shadow-sm animate-in fade-in duration-200">
      <CardHeader className="p-5 pb-3 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-fg-primary flex items-center gap-2">
            <Calendar className="size-4 text-bg-accent-brand" />
            Book Appointment
          </CardTitle>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs text-fg-muted hover:text-fg-primary transition-colors"
          >
            Close
          </button>
        </div>
        <p className="text-xs text-fg-muted mt-1">
          Select your date and time slot. Default status:{" "}
          <span className="font-semibold text-amber-600">Pending</span>.
        </p>
      </CardHeader>

      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Appointment Date */}
          <div>
            <Label
              htmlFor="appointmentDate"
              className="text-xs font-semibold text-fg-primary"
            >
              Appointment Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="appointmentDate"
              type="date"
              min={todayStr}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
              className="mt-1 text-xs"
            />
            <span className="mt-1 block text-[11px] text-fg-muted">
              Appointments must be scheduled for today or upcoming dates.
            </span>
          </div>

          {/* Time Slot Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs font-semibold text-fg-primary">
                Available Time Slot <span className="text-red-500">*</span>
              </Label>
              {loadingSlots ? (
                <span className="flex items-center gap-1 text-[11px] text-fg-muted">
                  <Loader2 className="size-3 animate-spin text-bg-accent-brand" />
                  Checking slots…
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {APPOINTMENT_TIME_SLOTS.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedSlot === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked || isPending}
                    onClick={() => setSelectedSlot(slot)}
                    className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all text-left ${
                      isSelected
                        ? "border-bg-accent-brand bg-bg-accent-brand text-fg-on-accent font-semibold shadow-xs"
                        : isBooked
                          ? "border-border-subtle bg-bg-canvas/60 text-fg-muted line-through opacity-60 cursor-not-allowed"
                          : "border-border-subtle bg-bg-surface-card text-fg-primary hover:border-bg-accent-brand hover:bg-bg-canvas"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3 shrink-0" aria-hidden />
                      <span>{slot}</span>
                    </span>
                    {isBooked ? (
                      <span className="text-[10px] uppercase tracking-wider text-red-500 font-semibold no-underline">
                        Booked
                      </span>
                    ) : isSelected ? (
                      <CheckCircle2 className="size-3.5 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <span className="mt-1.5 block text-[11px] text-fg-muted">
              Red &quot;Booked&quot; slots are already reserved for this date
              and cannot be double-booked.
            </span>
          </div>

          {/* Additional Message (Optional) */}
          <div>
            <Label
              htmlFor="additionalMessage"
              className="text-xs font-semibold text-fg-primary"
            >
              Additional Message{" "}
              <span className="text-fg-muted">(Optional)</span>
            </Label>
            <Textarea
              id="additionalMessage"
              placeholder="Any styling preferences, allergies, or questions for your stylist…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="mt-1 text-xs"
            />
          </div>

          {/* Summary Box */}
          <div className="rounded-lg border border-border-subtle bg-bg-canvas/50 p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-fg-muted">
              <span>Treatment Price:</span>
              <span className="font-bold text-fg-primary">
                ${service.price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-fg-muted">
              <span>Payment Terms:</span>
              <Badge
                variant="outline"
                className="text-[10px] font-medium border-border-subtle text-fg-muted"
              >
                Unpaid (Pay upon confirmation)
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setIsOpen(false)}
              className="border-border-subtle text-fg-primary hover:bg-bg-canvas text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedSlot}
              className="flex-1 bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-semibold text-xs py-2.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 mr-2 animate-spin" />
                  Submitting Request…
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5 mr-1.5" />
                  Confirm Booking Request
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
