import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseServicesClient } from "@/components/services/BrowseServicesClient";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { getServices } from "@/lib/api/services";

export const metadata: Metadata = {
  title: "Browse Services | Velvet Saloon",
  description:
    "Explore haircut & styling, coloring, facial treatments, and spa services at Velvet Saloon.",
};

interface ServicesPageProps {
  searchParams?: Promise<{ category?: string }>;
}

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  // Public page only requests active services
  const services = await getServices({ status: "active" });

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center text-fg-muted">
              Loading salon services…
            </div>
          }
        >
          <BrowseServicesClient
            key={resolvedParams.category || "all"}
            initialServices={services}
            initialCategory={resolvedParams.category}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
