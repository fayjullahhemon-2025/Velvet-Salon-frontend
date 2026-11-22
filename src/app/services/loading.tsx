import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

export default function ServicesLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas">
      <div className="bg-bg-surface-dark pb-16">
        <Navbar />
      </div>

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Skeleton */}
          <div className="max-w-xl space-y-3">
            <div className="h-9 w-64 animate-pulse rounded-lg bg-border-subtle/50" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded bg-border-subtle/40" />
          </div>

          {/* Controls Bar Skeleton */}
          <div className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-10 w-full sm:w-72 animate-pulse rounded-lg bg-border-subtle/40" />
            <div className="flex gap-2">
              <div className="h-10 w-32 animate-pulse rounded-lg bg-border-subtle/40" />
              <div className="h-10 w-28 animate-pulse rounded-lg bg-border-subtle/40" />
            </div>
          </div>

          {/* Service Cards Grid Skeleton (6 items) */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: Static loading placeholder
                key={index}
                className="overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface-card shadow-sm flex flex-col"
              >
                {/* Image Placeholder */}
                <div className="h-48 w-full animate-pulse bg-border-subtle/50" />

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-24 animate-pulse rounded-full bg-border-subtle/40" />
                      <div className="h-4 w-16 animate-pulse rounded bg-border-subtle/40" />
                    </div>
                    <div className="h-6 w-3/4 animate-pulse rounded bg-border-subtle/50" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-full animate-pulse rounded bg-border-subtle/30" />
                      <div className="h-3.5 w-5/6 animate-pulse rounded bg-border-subtle/30" />
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="border-t border-border-subtle pt-4 flex items-center justify-between">
                    <div className="h-7 w-20 animate-pulse rounded bg-border-subtle/50" />
                    <div className="h-9 w-28 animate-pulse rounded-lg bg-border-subtle/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
