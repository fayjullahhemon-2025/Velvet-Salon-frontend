import Image from "next/image";
import Link from "next/link";
import { AUTH_HERO_SRC, LOGO_SRC } from "@/lib/constants";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas lg:flex-row">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-bg-surface-dark p-6 sm:p-8 lg:p-12 min-h-52 sm:min-h-60 lg:min-h-screen lg:w-1/2">
        <Image
          src={AUTH_HERO_SRC}
          alt="Stylists working in a modern hair salon"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-bg-surface-dark/50" />

        <div className="relative z-10">
          <Link
            href="/"
            className="mb-8 flex justify-center border rounded-2xl"
            aria-label="Go to Velvet Saloon home"
          >
            <Image
              src={LOGO_SRC}
              alt="Velvet Saloon logo"
              width={160}
              height={160}
              priority
              className="h-44 w-auto object-contain sm:h-48"
            />
          </Link>
        </div>

        <div className="relative z-10 hidden lg:block">
          <p className="max-w-md text-3xl leading-snug font-medium text-fg-inverse">
            Your next salon visit, just a few taps away.
          </p>
          <p className="mt-3 max-w-md text-sm text-fg-inverse/80">
            Browse services, book your favourite stylist and pay securely — all
            in one place.
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
