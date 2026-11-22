import {
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  HeartHandshake,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Discover & Choose",
    description:
      "Explore our catalog of precision haircuts, balayage, facials, and spa rituals with transparent pricing and real treatment times.",
  },
  {
    step: "02",
    icon: CalendarCheck,
    title: "Select Time & Stylist",
    description:
      "Pick your ideal date and convenient time slot. Add personalized consultation notes so our stylists can prepare for your visit.",
  },
  {
    step: "03",
    icon: CreditCard,
    title: "Confirm & Unwind",
    description:
      "Receive real-time confirmation. Pay securely online via Stripe or at the salon counter, then simply arrive and indulge.",
  },
];

const PERKS = [
  {
    icon: Sparkles,
    title: "Master Certified Stylists",
    description:
      "Every artisan is rigorously trained in modern European and American salon techniques.",
  },
  {
    icon: HeartHandshake,
    title: "Hypoallergenic & Organic",
    description:
      "We exclusively use dermatologically approved, vegan, and sulfate-free hair and skin formulations.",
  },
  {
    icon: ShieldCheck,
    title: "Stripe-Secured & Flexible",
    description:
      "Encrypted payment checkout and self-service appointment updates right from your dashboard.",
  },
];

export default function HowBookingWorks() {
  return (
    <section
      className="bg-bg-surface-dark text-fg-inverse py-20 sm:py-28"
      id="how-it-works"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-accent-brand/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-bg-accent-brand">
            <CheckCircle2 className="size-3.5" aria-hidden />
            The Velvet Experience
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg-inverse sm:text-4xl">
            How Salon Booking Works
          </h2>
          <p className="mt-3 text-base text-fg-inverse/80 sm:text-lg">
            Effortless luxury from discovery to your salon chair in three simple
            steps.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="relative flex flex-col rounded-2xl border border-fg-inverse/10 bg-fg-inverse/5 p-8 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-bg-accent-brand text-fg-on-accent shadow-md">
                  <step.icon className="size-7" aria-hidden />
                </div>
                <span className="text-3xl font-extrabold tracking-tight text-fg-inverse/20">
                  {step.step}
                </span>
              </div>
              <h3 className="text-xl font-bold text-fg-inverse mb-2">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-fg-inverse/70">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Salon Guarantees / Perks Bar */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 border-t border-fg-inverse/10 pt-12">
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-bg-accent-brand/20 text-bg-accent-brand">
                <perk.icon className="size-5" aria-hidden />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-fg-inverse">
                  {perk.title}
                </h4>
                <p className="mt-1 text-xs text-fg-inverse/70 leading-relaxed">
                  {perk.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Bar */}
        <div className="mt-16 text-center">
          <Button
            className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium px-8 py-3 text-base"
            render={<Link href="/services" />}
          >
            Ready? Book Your Appointment
          </Button>
        </div>
      </div>
    </section>
  );
}
