import Banner from "@/components/homepage/Banner";
import FeaturedServices from "@/components/homepage/FeaturedServices";
import HowBookingWorks from "@/components/homepage/HowBookingWorks";
import ServiceCategories from "@/components/homepage/ServiceCategories";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { getBannerImage } from "@/lib/api/banner";
import { getServices } from "@/lib/api/services";

export default async function Home() {
  // Fetch active services and dynamic banner image from backend/database
  const [services, bannerImage] = await Promise.all([
    getServices({ status: "active" }),
    getBannerImage(),
  ]);

  return (
    <div className="relative">
      <Navbar />
      <main>
        <Banner bannerImage={bannerImage} />
        <FeaturedServices services={services} />
        <ServiceCategories services={services} />
        <HowBookingWorks />
      </main>
      <Footer />
    </div>
  );
}
