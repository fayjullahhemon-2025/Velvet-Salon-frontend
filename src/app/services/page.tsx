import type { Metadata } from "next";
import { BrowseServicesClient } from "@/components/services/BrowseServicesClient";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { getServices } from "@/lib/api/services";

export const metadata: Metadata = {
  title: "Browse Services | Velvet Saloon",
  description:
    "Explore haircut & styling, coloring, facial treatments, and spa services at Velvet Saloon.",
};

export default async function ServicesPage() {
  // Public page only requests active services
  const services = await getServices({ status: "active" });

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>
      <main className="flex-1">
        <BrowseServicesClient initialServices={services} />
      </main>
      <Footer />
    </div>
  );
}
