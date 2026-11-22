import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentBookingForm } from "@/components/services/AppointmentBookingForm";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Badge } from "@/components/ui/badge";
import { getServiceById } from "@/lib/api/services";
import { getUserRole } from "@/lib/auth-helpers";
import { getServerSession } from "@/lib/core/server";

interface ServiceDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ServiceDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) {
    return { title: "Service Not Found | Velvet Saloon" };
  }
  return {
    title: `${service.serviceName} | Velvet Saloon`,
    description: service.description,
  };
}

export default async function ServiceDetailsPage({
  params,
}: ServiceDetailsPageProps) {
  const { id } = await params;
  const [service, session] = await Promise.all([
    getServiceById(id),
    getServerSession(),
  ]);

  if (!service) {
    notFound();
  }

  const userRole = getUserRole(session?.user);
  const isLoggedIn = Boolean(session?.user);

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-fg-primary mb-8 transition-colors"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span>Back to All Services</span>
          </Link>

          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface-card shadow-sm grid grid-cols-1 md:grid-cols-2">
            {/* Service Image */}
            <div className="relative h-72 md:h-full min-h-[340px] w-full bg-bg-canvas">
              <Image
                src={service.image}
                alt={service.serviceName}
                fill
                unoptimized
                priority
                className="object-cover"
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <Badge className="border border-border-subtle bg-bg-surface-card/95 px-3 py-1 text-xs font-semibold text-fg-primary shadow-xs backdrop-blur">
                  {service.category}
                </Badge>
                {service.status === "inactive" ? (
                  <Badge
                    variant="destructive"
                    className="text-xs font-semibold"
                  >
                    Inactive
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Service Info & Booking Form Callout */}
            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
                    {service.serviceName}
                  </h1>
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-2xl font-extrabold text-fg-primary">
                      ${service.price.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-medium text-fg-muted">
                      <Clock
                        className="size-4 text-bg-accent-brand"
                        aria-hidden
                      />
                      {service.duration} minutes
                    </span>
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
                    About this service
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-fg-primary/90 whitespace-pre-line">
                    {service.description}
                  </p>
                </div>

                <div className="space-y-2 border-t border-border-subtle pt-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
                    Treatment Highlights
                  </h2>
                  <ul className="space-y-2 text-xs text-fg-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="size-4 text-emerald-600 shrink-0"
                        aria-hidden
                      />
                      <span>
                        Dedicated one-on-one professional stylist consultation
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="size-4 text-emerald-600 shrink-0"
                        aria-hidden
                      />
                      <span>
                        Premium salon-grade products and sanitized equipment
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2
                        className="size-4 text-emerald-600 shrink-0"
                        aria-hidden
                      />
                      <span>Complimentary beverage and relaxation session</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Interactive Appointment Booking System */}
              <div className="mt-8">
                <AppointmentBookingForm
                  service={service}
                  isLoggedIn={isLoggedIn}
                  userRole={userRole}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
