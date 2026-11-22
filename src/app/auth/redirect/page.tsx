"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { getHomeForRole, isUserBlocked } from "@/lib/auth-helpers";

function AuthRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/signin");
      return;
    }
    if (isUserBlocked(session.user)) {
      signOut();
      toast.error(
        "Your account has been suspended. Please contact salon support.",
      );
      router.replace("/signin");
      return;
    }

    const defaultHome = getHomeForRole(session.user);
    let targetUrl = defaultHome;

    if (callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")) {
      const isAdminRoute =
        callbackUrl.startsWith("/dashboard/admin") ||
        callbackUrl.startsWith("/dashboard/manage-");
      const userIsAdmin = (session.user as { role?: string })?.role === "admin";
      if (!isAdminRoute || userIsAdmin) {
        targetUrl = callbackUrl;
      }
    }

    router.replace(targetUrl);
  }, [isPending, session, router, callbackUrl]);

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
