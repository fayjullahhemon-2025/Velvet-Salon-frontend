"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime segment error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-canvas px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-bg-surface-card p-8 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-xs">
          <AlertTriangle className="size-7" aria-hidden />
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-fg-primary">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {error.message ||
            "An unexpected error occurred while loading this page. Please try again."}
        </p>

        {error.digest ? (
          <p className="mt-2 text-[11px] font-mono text-fg-muted/70">
            Error ID: {error.digest}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-bg-accent-brand text-fg-on-accent hover:opacity-90 font-semibold text-xs"
          >
            <RefreshCw className="size-3.5 mr-1.5" aria-hidden />
            Try Again
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-border-subtle text-fg-primary hover:bg-bg-canvas text-xs font-medium"
            render={<Link href="/" />}
          >
            <Home className="size-3.5 mr-1.5" aria-hidden />
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}
