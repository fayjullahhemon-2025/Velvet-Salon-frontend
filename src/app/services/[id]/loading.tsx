import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function ServiceDetailsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Back link skeleton */}
          <div className="h-4 w-36 animate-pulse rounded bg-border-subtle/40 mb-8" />

          {/* 2-column card skeleton */}
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface-card shadow-sm grid grid-cols-1 md:grid-cols-2">
            {/* Image Placeholder */}
            <div className="h-72 md:h-full min-h-[380px] w-full animate-pulse bg-border-subtle/50" />

            {/* Info and booking form skeleton */}
            <div className="flex flex-col justify-between p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-8 w-3/4 animate-pulse rounded-lg bg-border-subtle/50" />
                  <div className="flex items-center gap-4">
                    <div className="h-7 w-24 animate-pulse rounded bg-border-subtle/50" />
                    <div className="h-4 w-28 animate-pulse rounded bg-border-subtle/40" />
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-4 space-y-2">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-border-subtle/40" />
                  <div className="h-3.5 w-full animate-pulse rounded bg-border-subtle/30" />
                  <div className="h-3.5 w-5/6 animate-pulse rounded bg-border-subtle/30" />
                </div>

                <div className="border-t border-border-subtle pt-4 space-y-2.5">
                  <div className="h-3.5 w-36 animate-pulse rounded bg-border-subtle/40" />
                  <div className="h-3 w-48 animate-pulse rounded bg-border-subtle/30" />
                  <div className="h-3 w-44 animate-pulse rounded bg-border-subtle/30" />
                </div>
              </div>

              {/* Booking trigger button skeleton */}
              <div className="border-t border-border-subtle pt-6">
                <div className="h-12 w-full animate-pulse rounded-xl bg-border-subtle/50" />
                <div className="mx-auto mt-2 h-3 w-48 animate-pulse rounded bg-border-subtle/30" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
