import Image from "next/image";
import Link from "next/link";
import { getBannerImage } from "@/lib/api/banner";

interface BannerProps {
  bannerImage?: string;
}

const Banner = async ({ bannerImage }: BannerProps = {}) => {
  const imageSrc =
    bannerImage ||
    (await getBannerImage().catch(() => null)) ||
    "https://i.ibb.co.com/Hptnwr5X/img-71.png";

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Image
        src={imageSrc}
        alt="Velvet Saloon interior"
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-bg-surface-dark/60"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-20 text-center sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-fg-inverse sm:text-5xl lg:text-6xl">
          Style, Care &amp; Confidence
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-fg-inverse/90 sm:text-lg">
          Indulge in premium salon treatments crafted just for you — from
          precision haircuts to rejuvenating spa rituals. Book your next
          appointment in minutes.
        </p>
        <Link
          href="/services"
          className="mt-10 inline-flex items-center justify-center rounded-md bg-bg-accent-brand px-8 py-3 text-base font-semibold text-fg-on-accent transition-opacity hover:opacity-90 focus-visible:border-border-focus focus-visible:outline-none"
        >
          Explore Salon Services
        </Link>
      </div>
    </section>
  );
};

export default Banner;
