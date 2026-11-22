import { Calendar, CheckCircle2, Clock, Receipt, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { verifyAndProcessStripePayment } from "@/lib/api/payment";

export const instant = false;

export const metadata: Metadata = {
  title: "Payment Successful | Velvet Saloon",
  description:
    "Your salon appointment booking payment has been verified and confirmed.",
};

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    appointment_id?: string;
  }>;
}

export default async function PaymentSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-canvas">
        <div className="bg-bg-surface-dark pb-16">
          <Navbar />
        </div>
        <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <Card className="max-w-md w-full border-border-subtle bg-bg-surface-card p-6 text-center shadow-md">
            <h1 className="text-xl font-bold text-fg-primary">
              Missing Session Identifier
            </h1>
            <p className="mt-2 text-xs text-fg-muted">
              We could not locate a valid Stripe payment session in your
              request. If your card was charged, please check your appointments.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                className="w-full bg-bg-accent-brand text-fg-on-accent text-xs font-semibold"
                render={<Link href="/dashboard/customer/my-appointments" />}
              >
                Go to My Appointments
              </Button>
              <Button
                variant="outline"
                className="w-full border-border-subtle text-xs"
                render={<Link href="/" />}
              >
                Return to Home
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Authoritative verification with Stripe & idempotent DB persistence
  const result = await verifyAndProcessStripePayment(session_id);

  if (!result.success) {
    return (
      <div className="flex min-h-screen flex-col bg-bg-canvas">
        <div className="bg-bg-surface-dark pb-16">
          <Navbar />
        </div>
        <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <Card className="max-w-md w-full border-border-subtle bg-bg-surface-card p-6 text-center shadow-md">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-3">
              <Receipt className="size-6" />
            </div>
            <h1 className="text-xl font-bold text-fg-primary">
              Payment Under Review
            </h1>
            <p className="mt-2 text-xs text-fg-muted">
              {result.error ||
                "Your payment session was received, but confirmation could not be finalized. Please inspect your appointment status."}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                className="w-full bg-bg-accent-brand text-fg-on-accent text-xs font-semibold"
                render={<Link href="/dashboard/customer/my-appointments" />}
              >
                Inspect Appointments
              </Button>
              <Button
                variant="outline"
                className="w-full border-border-subtle text-xs"
                render={<Link href="/" />}
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const { appointment, transaction, session } = result;

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-xl border-border-subtle bg-bg-surface-card shadow-lg overflow-hidden">
          {/* Header Banner */}
          <div className="bg-emerald-600/10 border-b border-emerald-600/20 p-6 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
              <CheckCircle2 className="size-8" />
            </div>
            <Badge className="mt-3 bg-emerald-600 text-white font-semibold text-xs px-2.5 py-0.5">
              Payment Successful
            </Badge>
            <h1 className="mt-2 text-2xl font-bold text-fg-primary sm:text-3xl">
              Booking Confirmed & Paid
            </h1>
            <p className="mt-1 text-xs text-fg-muted max-w-md mx-auto">
              Your payment has been verified. The transaction is saved and your
              appointment is secured.
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Service & Appointment Details */}
            {appointment ? (
              <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-bg-accent-brand">
                      {appointment.serviceCategory || "Salon Service"}
                    </span>
                    <h2 className="text-base font-bold text-fg-primary">
                      {appointment.serviceName}
                    </h2>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-600 text-[11px] font-semibold">
                    PAID
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle/50 text-xs text-fg-muted">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-bg-accent-brand" />
                    <span>Date: {appointment.appointmentDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-bg-accent-brand" />
                    <span>Time: {appointment.timeSlot}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Receipt Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                <span>Amount Paid</span>
                <span className="font-bold text-fg-primary text-sm">
                  $
                  {(transaction?.amount ?? session?.amountTotal ?? 0).toFixed(
                    2,
                  )}{" "}
                  {(
                    transaction?.currency ??
                    session?.currency ??
                    "usd"
                  ).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                <span>Payment Status</span>
                <span className="font-semibold text-emerald-600 uppercase">
                  Verified (Paid)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                <span>Stripe Session Reference</span>
                <span className="font-mono text-[11px] text-fg-primary truncate max-w-[220px]">
                  {session?.id || session_id}
                </span>
              </div>
              {session?.customerEmail ? (
                <div className="flex justify-between py-1 border-b border-border-subtle text-fg-muted">
                  <span>Confirmation Sent To</span>
                  <span className="font-medium text-fg-primary">
                    {session.customerEmail}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Tip Notice */}
            <div className="flex items-center gap-2 rounded-lg bg-bg-accent-brand/10 p-3 text-xs text-fg-primary">
              <Sparkles className="size-4 text-bg-accent-brand shrink-0" />
              <span>
                Please arrive 10 minutes prior to your scheduled time at Velvet
                Saloon. We look forward to pampering you!
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 bg-bg-canvas/40 p-6 border-t border-border-subtle">
            <Button
              className="w-full sm:flex-1 bg-bg-accent-brand text-fg-on-accent font-semibold text-xs"
              render={<Link href="/dashboard/customer/my-appointments" />}
            >
              View My Appointments
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-border-subtle text-xs"
              render={<Link href="/" />}
            >
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
