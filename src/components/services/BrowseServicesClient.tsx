"use client";

import { Clock, Filter, Scissors, Search, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { SERVICE_CATEGORIES, type Service } from "@/types/service";

interface BrowseServicesClientProps {
  initialServices: Service[];
  initialCategory?: string;
}

export function BrowseServicesClient({
  initialServices,
  initialCategory,
}: BrowseServicesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL search parameter directly so navigations and category clicks update instantly without requiring a page refresh
  const selectedCategory =
    searchParams?.get("category") || initialCategory || "all";

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<
    "default" | "price_asc" | "price_desc" | "duration_asc"
  >("default");

  // Filter only active services (guardrail: inactive services are NEVER shown to the public)
  const activeServices = useMemo(() => {
    return initialServices.filter((s) => s.status === "active");
  }, [initialServices]);

  const displayedServices = useMemo(() => {
    let result = activeServices.filter((service) => {
      if (
        selectedCategory !== "all" &&
        service.category.trim().toLowerCase() !==
          selectedCategory.trim().toLowerCase()
      ) {
        return false;
      }
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = service.serviceName.toLowerCase().includes(query);
        const matchesDesc = service.description.toLowerCase().includes(query);
        const matchesCat = service.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });

    if (sortOrder === "price_asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price_desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortOrder === "duration_asc") {
      result = [...result].sort((a, b) => a.duration - b.duration);
    }

    return result;
  }, [activeServices, search, selectedCategory, sortOrder]);

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(
      searchParams ? searchParams.toString() : "",
    );
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `/services?${queryString}` : "/services";
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-accent-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-bg-accent-brand">
          <Sparkles className="size-3.5" aria-hidden />
          Our Services
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg-primary sm:text-4xl">
          Browse Salon Services
        </h1>
        <p className="mt-2 text-base text-fg-muted">
          Explore our premier hair styling, treatments, skincare, and spa
          services designed for your personal care.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border-subtle bg-bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <Input
            placeholder="Search by service name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category & Sort controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Filter className="size-3.5 text-fg-muted" aria-hidden />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="rounded-md border border-border-subtle bg-bg-surface-card px-3 py-1.5 text-xs text-fg-primary outline-none focus:border-border-focus"
            >
              <option value="all">All Categories</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(
                e.target.value as
                  | "default"
                  | "price_asc"
                  | "price_desc"
                  | "duration_asc",
              )
            }
            className="rounded-md border border-border-subtle bg-bg-surface-card px-3 py-1.5 text-xs text-fg-primary outline-none focus:border-border-focus"
          >
            <option value="default">Sort by: Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="duration_asc">Duration: Shortest</option>
          </select>
        </div>
      </div>

      {/* Active Category Filter Indicator */}
      {selectedCategory !== "all" ? (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-bg-surface-card px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2 text-sm text-fg-primary">
            <span className="text-fg-muted">Showing category:</span>
            <Badge className="bg-bg-accent-brand text-fg-on-accent font-semibold px-2.5 py-0.5">
              {selectedCategory}
            </Badge>
            <span className="text-xs text-fg-muted">
              ({displayedServices.length}{" "}
              {displayedServices.length === 1 ? "service" : "services"} found)
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className="text-xs font-semibold text-fg-muted hover:text-fg-primary underline underline-offset-4 transition-colors"
          >
            Show All Categories
          </button>
        </div>
      ) : null}

      {/* Services Grid */}
      {displayedServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-surface-card p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-bg-canvas text-fg-muted mb-4">
            <Scissors className="size-6" aria-hidden />
          </div>
          <h3 className="text-lg font-semibold text-fg-primary">
            No active services found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-fg-muted">
            {activeServices.length === 0
              ? "We are currently curating our salon service menu. Please check back soon!"
              : "No services match your search or filter criteria. Try resetting the filters."}
          </p>
          {activeServices.length > 0 ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                handleCategoryChange("all");
                setSortOrder("default");
              }}
              className="mt-4"
            >
              Reset Filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedServices.map((service) => (
            <Card
              key={service._id}
              className="flex flex-col overflow-hidden border-border-subtle bg-bg-surface-card shadow-xs transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 w-full bg-bg-canvas overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.serviceName}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-bg-surface-card/90 text-fg-primary backdrop-blur text-xs font-semibold shadow-xs border border-border-subtle">
                    ${service.price.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-[11px] font-normal border-border-subtle text-fg-muted"
                  >
                    {service.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-fg-muted">
                    <Clock className="size-3" aria-hidden />
                    {service.duration} mins
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-fg-primary mt-1.5 line-clamp-1">
                  {service.serviceName}
                </CardTitle>
                <CardDescription className="text-xs text-fg-muted line-clamp-2 mt-1">
                  {service.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 p-4 pt-0" />

              <CardFooter className="p-4 pt-2 border-t border-border-subtle">
                <Button
                  className="w-full bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-medium"
                  render={<Link href={`/services/${service._id}`} />}
                >
                  View Details & Book
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
