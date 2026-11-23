"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { getHomeForRole, isUserBlocked } from "@/lib/auth-helpers";

function AuthRedirectContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      window.location.href = "/signin";
      return;
    }
    if (isUserBlocked(session.user)) {
      signOut();
      try {
        sessionStorage.setItem(
          "velvet_auth_toast_error",
          "Your account has been suspended. Please contact salon support.",
        );
      } catch {
        // Ignore sessionStorage access errors
      }
      toast.error(
        "Your account has been suspended. Please contact salon support.",
      );
      window.location.href = "/signin";
      return;
    }

    try {
      sessionStorage.setItem(
        "velvet_auth_toast",
        "Signed in successfully with Google.",
      );
    } catch {
      // Ignore sessionStorage access errors
    }

    const defaultHome = getHomeForRole(session.user);
    let targetUrl = defaultHome;

    let cleanCallback: string | null = null;
    if (callbackUrl) {
      try {
        cleanCallback = decodeURIComponent(callbackUrl);
      } catch {
        cleanCallback = callbackUrl;
      }
    }

    if (cleanCallback?.startsWith("/") && !cleanCallback.startsWith("//")) {
      const isAdminRoute =
        cleanCallback.startsWith("/dashboard/admin") ||
        cleanCallback.startsWith("/dashboard/manage-");
      const userIsAdmin = (session.user as { role?: string })?.role === "admin";
      if (!isAdminRoute || userIsAdmin) {
        targetUrl = cleanCallback;
      }
    }

    try {
      const url = new URL(targetUrl, window.location.origin);
      url.searchParams.set("auth_toast", "google_success");
      targetUrl = url.pathname + url.search + url.hash;
    } catch {
      // Ignore URL parsing errors
    }

    window.location.href = targetUrl;
  }, [isPending, session, callbackUrl]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-canvas">
      <Loader2 className="size-6 animate-spin text-fg-primary" aria-hidden />
      <p className="text-sm text-fg-muted">Completing sign in…</p>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-canvas">
          <Loader2
            className="size-6 animate-spin text-fg-primary"
            aria-hidden
          />
          <p className="text-sm text-fg-muted">Completing sign in…</p>
        </div>
      }
    >
      <AuthRedirectContent />
    </Suspense>
  );
}
