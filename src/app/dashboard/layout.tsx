import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getServerSession } from "@/lib/core/server";
import { getDb } from "@/lib/db";

export const instant = false;

export const metadata: Metadata = {
  title: "Dashboard | Velvet Saloon",
  description: "Velvet Saloon appointment and management portal.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Rule: Blocked users must not be able to access protected platform features
  if (session?.user) {
    try {
      const db = await getDb();
      const liveUser =
        (await db.collection("user").findOne({ email: session.user.email })) ||
        (await db.collection("users").findOne({ email: session.user.email }));

      if (liveUser?.isBlocked) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-bg-canvas p-4 text-center">
            <div className="max-w-md rounded-2xl border border-red-600/30 bg-bg-surface-card p-8 shadow-md">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
                <ShieldAlert className="size-8" />
              </div>
              <h1 className="text-xl font-bold text-fg-primary">
                Account Suspended
              </h1>
              <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                Your account has been suspended by salon administration. You are
                currently blocked from booking services, modifying appointments,
                or accessing protected platform features.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full border-border-subtle text-xs"
                  render={<Link href="/" />}
                >
                  Return to Home
                </Button>
                <Button
                  className="w-full bg-bg-accent-brand text-fg-on-accent text-xs font-semibold"
                  render={<Link href="/api/auth/signout" />}
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        );
      }
    } catch {
      // Continue if DB check fails
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex min-h-screen flex-col bg-bg-canvas">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-surface-card/90 px-4 backdrop-blur sm:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border-subtle" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-fg-primary">
                Dashboard Portal
              </span>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
