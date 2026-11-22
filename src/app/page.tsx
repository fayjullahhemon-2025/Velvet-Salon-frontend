import Banner from "@/components/homepage/Banner";
import FeaturedServices from "@/components/homepage/FeaturedServices";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { getServices } from "@/lib/api/services";

export default async function Home() {
  // Fetch only active services from database for homepage
  const services = await getServices({ status: "active" });

  return (
    <div className="relative">
      <Navbar />
      <main>
        <Banner />
        <FeaturedServices services={services} />
      </main>
      <Footer />
    </div>
  );
}
