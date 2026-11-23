"use client";

import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function BlockedUserSignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      toast.success("Signed out successfully.");
      router.push("/signin");
      router.refresh();
    } catch (err) {
      console.error("Signout error:", err);
      window.location.href = "/api/auth/signout";
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      disabled={loading}
      onClick={handleSignOut}
      className="w-full bg-bg-accent-brand text-fg-on-accent text-xs font-semibold hover:opacity-90 transition-opacity"
    >
      {loading ? (
        <Loader2 className="size-3.5 mr-1.5 animate-spin" />
      ) : (
        <LogOut className="size-3.5 mr-1.5" />
      )}
      Sign Out
    </Button>
  );
}
