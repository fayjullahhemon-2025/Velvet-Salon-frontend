import type { Metadata } from "next";
import { AppSidebar } from "@/components/shared/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Dashboard | Velvet Saloon",
  description: "Velvet Saloon appointment and management portal.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
