import { ArrowLeft, Compass, Search } from "lucide-react";
import Link from "next/link";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg rounded-2xl border border-border-subtle bg-bg-surface-card p-8 text-center shadow-lg sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-bg-accent-brand/15 text-bg-accent-brand shadow-xs">
            <Compass className="size-8" aria-hidden />
          </div>

          <span className="mt-6 inline-block rounded-full bg-bg-accent-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-bg-accent-brand">
            404 Error
          </span>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-fg-primary sm:text-3xl">
            Page Not Found
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            The page, route, or salon service you are looking for does not exist
            or may have been moved.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-semibold"
              render={<Link href="/" />}
            >
              <ArrowLeft className="size-4 mr-2" aria-hidden />
              Return Home
            </Button>
            <Button
              variant="outline"
              className="border-border-subtle text-fg-primary hover:bg-bg-canvas font-medium"
              render={<Link href="/services" />}
            >
              <Search className="size-4 mr-2" aria-hidden />
              Browse Services
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
