"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Listens for queued auth toasts across page navigations and OAuth redirects (e.g. Google login).
 * Uses sessionStorage as the primary carrier and window.location search params as a resilient fallback.
 */
export function AuthToastListener() {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return;

    let handled = false;

    // 1. Check for error toast in sessionStorage
    try {
      const errorMsg = sessionStorage.getItem("velvet_auth_toast_error");
      if (errorMsg) {
        sessionStorage.removeItem("velvet_auth_toast_error");
        toast.error(errorMsg);
        handled = true;
        triggeredRef.current = true;
      }
    } catch {
      // Ignore sessionStorage access errors
    }

    // 2. Check for success toast in sessionStorage
    if (!handled) {
      try {
        const successMsg = sessionStorage.getItem("velvet_auth_toast");
        if (successMsg) {
          sessionStorage.removeItem("velvet_auth_toast");
          toast.success(successMsg);
          handled = true;
          triggeredRef.current = true;
        }
      } catch {
        // Ignore sessionStorage access errors
      }
    }

    // 3. Resilient fallback: inspect URL query params directly (no hook to prevent Suspense bailout)
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const authToastParam = params.get("auth_toast");

        if (authToastParam === "google_success") {
          if (!handled) {
            toast.success("Signed in successfully with Google.");
            triggeredRef.current = true;
          }

          // Clean up the query param from browser address bar without reload
          params.delete("auth_toast");
          const remainingQuery = params.toString();
          const cleanUrl =
            window.location.pathname +
            (remainingQuery ? `?${remainingQuery}` : "") +
            window.location.hash;
          window.history.replaceState(null, "", cleanUrl);
        }
      }
    } catch {
      // Ignore URL manipulation errors
    }
  }, []);

  return null;
}
