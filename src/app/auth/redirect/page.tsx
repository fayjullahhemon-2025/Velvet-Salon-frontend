"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";
import { getHomeForRole, isUserBlocked } from "@/lib/auth-helpers";

export default function AuthRedirectPage() {
  const router = useRouter();
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
    router.replace(getHomeForRole(session.user));
  }, [isPending, session, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-canvas">
      <Loader2 className="size-6 animate-spin text-fg-primary" aria-hidden />
      <p className="text-sm text-fg-muted">Completing sign in…</p>
    </div>
  );
}
