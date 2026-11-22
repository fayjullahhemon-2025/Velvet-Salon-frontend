export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-60 animate-pulse rounded-lg bg-border-subtle/50" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-border-subtle/30" />
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton placeholder
            key={index}
            className="rounded-2xl border border-border-subtle bg-bg-surface-card p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 animate-pulse rounded bg-border-subtle/40" />
              <div className="size-8 animate-pulse rounded-lg bg-border-subtle/40" />
            </div>
            <div className="h-8 w-20 animate-pulse rounded-lg bg-border-subtle/60" />
            <div className="h-3 w-32 animate-pulse rounded bg-border-subtle/30" />
          </div>
        ))}
      </div>

      {/* Table / Recent Activity Skeleton */}
      <div className="rounded-2xl border border-border-subtle bg-bg-surface-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 animate-pulse rounded bg-border-subtle/50" />
          <div className="h-8 w-24 animate-pulse rounded-lg bg-border-subtle/40" />
        </div>

        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton placeholder
              key={idx}
              className="flex items-center justify-between border-b border-border-subtle/40 py-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-lg bg-border-subtle/40" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 animate-pulse rounded bg-border-subtle/40" />
                  <div className="h-3 w-24 animate-pulse rounded bg-border-subtle/30" />
                </div>
              </div>
              <div className="h-5 w-20 animate-pulse rounded-full bg-border-subtle/40" />
              <div className="h-7 w-20 animate-pulse rounded-lg bg-border-subtle/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
