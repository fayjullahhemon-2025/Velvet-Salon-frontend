import Banner from "@/components/homepage/Banner";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function Home() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <Banner />
      </main>
      <Footer />
    </div>
  );
}
