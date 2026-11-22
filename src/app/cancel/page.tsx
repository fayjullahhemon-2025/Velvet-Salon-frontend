import { AlertCircle, ArrowLeft, CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export const instant = false;

export const metadata: Metadata = {
  title: "Payment Cancelled | Velvet Saloon",
  description:
    "Your appointment payment was cancelled. Your slot remains reserved.",
};

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-border-subtle bg-bg-surface-card shadow-lg text-center overflow-hidden">
          <div className="bg-amber-500/10 border-b border-amber-500/20 p-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
              <AlertCircle className="size-8" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-fg-primary">
              Payment Cancelled
            </h1>
            <p className="mt-1 text-xs text-fg-muted">
              The checkout procedure was not completed.
            </p>
          </div>

          <CardContent className="p-6 space-y-4 text-xs text-fg-muted text-left">
            <div className="rounded-xl border border-border-subtle bg-bg-canvas/50 p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-fg-primary">
                <CalendarCheck className="size-4 text-bg-accent-brand" />
                <span>Your Reservation is Safe</span>
              </div>
              <p className="leading-relaxed">
                Your appointment remains in <strong>Confirmed</strong> status
                with <strong>Unpaid</strong> payment status. You can initiate
                payment at any time prior to your visit.
              </p>
            </div>

            <p className="text-[11px] leading-relaxed">
              If this was accidental or you experienced card checkout issues,
              you can retry now from your appointments overview.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 bg-bg-canvas/40 p-6 border-t border-border-subtle">
            <Button
              className="w-full bg-bg-accent-brand text-fg-on-accent font-semibold text-xs"
              render={<Link href="/dashboard/customer/my-appointments" />}
            >
              Return to My Appointments
            </Button>
            <Button
              variant="outline"
              className="w-full border-border-subtle text-xs"
              render={<Link href="/" />}
            >
              <ArrowLeft className="size-3 mr-1.5" />
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
