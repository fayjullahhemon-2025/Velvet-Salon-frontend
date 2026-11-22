import { ArrowRight, Clock, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Service } from "@/types/service";

interface FeaturedServicesProps {
  services: Service[];
}

export default function FeaturedServices({ services }: FeaturedServicesProps) {
  // Only display active services, showing at least 6 (or up to 6 for the featured showcase)
  const activeServices = services.filter(
    (service) => service.status === "active",
  );
  const featured = activeServices.slice(0, 6);

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="bg-bg-canvas py-16 sm:py-24" id="featured-services">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end mb-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-accent-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-bg-accent-brand">
              <Sparkles className="size-3.5" aria-hidden />
              Top Rated Treatments
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-fg-primary sm:text-4xl">
              Featured Salon Services
            </h2>
            <p className="mt-2 text-base text-fg-muted sm:text-lg">
              Indulge in our most requested signature treatments — crafted by
              expert stylists to elevate your personal style and confidence.
            </p>
          </div>

          <Button
            variant="outline"
            className="border-border-subtle text-fg-primary hover:bg-bg-surface-card hover:text-bg-accent-brand"
            render={<Link href="/services" />}
          >
            <span>View All Services</span>
            <ArrowRight className="size-4 ml-1.5" aria-hidden />
          </Button>
        </div>

        {/* 6-Service Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((service) => (
            <Card
              key={service._id}
              className="group flex flex-col overflow-hidden border-border-subtle bg-bg-surface-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* 1. Service Image */}
              <div className="relative h-56 w-full overflow-hidden bg-bg-canvas">
                <Image
                  src={service.image}
                  alt={service.serviceName}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* 4. Price Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className="border border-border-subtle bg-bg-surface-card/95 px-2.5 py-1 text-sm font-bold text-fg-primary shadow-xs backdrop-blur">
                    ${service.price.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  {/* 3. Category */}
                  <Badge
                    variant="outline"
                    className="border-border-subtle text-xs font-medium text-fg-muted"
                  >
                    {service.category}
                  </Badge>
                  {/* 5. Duration */}
                  <span className="flex items-center gap-1 text-xs text-fg-muted font-medium">
                    <Clock
                      className="size-3.5 text-bg-accent-brand"
                      aria-hidden
                    />
                    {service.duration} mins
                  </span>
                </div>

                {/* 2. Service Name */}
                <CardTitle className="mt-2.5 text-xl font-bold text-fg-primary line-clamp-1 group-hover:text-bg-accent-brand transition-colors">
                  {service.serviceName}
                </CardTitle>

                {/* 6. Short Description */}
                <CardDescription className="mt-1.5 text-sm text-fg-muted line-clamp-2 leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 p-5 pt-0" />

              {/* 7. View Details Button */}
              <CardFooter className="p-5 pt-2 border-t border-border-subtle/60">
                <Button
                  className="w-full bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium transition-opacity"
                  render={<Link href={`/services/${service._id}`} />}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Bottom CTA for exploring more */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-semibold text-fg-primary hover:text-bg-accent-brand transition-colors"
          >
            <span>Explore all {activeServices.length} salon services</span>
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
