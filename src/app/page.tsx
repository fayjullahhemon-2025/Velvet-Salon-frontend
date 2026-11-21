import Banner from "@/components/homepage/Banner";
import Navbar from "@/components/shared/Navbar";

export default function Home() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <Banner />
      </main>
    </div>
  );
}
