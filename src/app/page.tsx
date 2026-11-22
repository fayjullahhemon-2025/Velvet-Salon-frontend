import Banner from "@/components/homepage/Banner";
import FeaturedServices from "@/components/homepage/FeaturedServices";
import HowBookingWorks from "@/components/homepage/HowBookingWorks";
import ServiceCategories from "@/components/homepage/ServiceCategories";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { getServices } from "@/lib/api/services";

export default async function Home() {
  // Fetch active services from database for homepage showcase and category counts
  const services = await getServices({ status: "active" });

  return (
    <div className="relative">
      <Navbar />
      <main>
        <Banner />
        <FeaturedServices services={services} />
        <ServiceCategories services={services} />
        <HowBookingWorks />
      </main>
      <Footer />
    </div>
  );
}
