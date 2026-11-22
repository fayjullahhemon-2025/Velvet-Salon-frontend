"use client";

import { cn } from "cn";
import {
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Receipt,
  Scissors,
  Sparkles,
  Store,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { signOut, useSession } from "@/lib/auth-client";
import { getUserRole } from "@/lib/auth-helpers";
import { LOGO_SRC } from "@/lib/constants";

export type SidebarRole = "admin" | "customer";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  matchExact?: boolean;
};

// Admin navigation items specified by requirements:
// overview, manage services, appointments, customers, transactions, my profile
export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    matchExact: true,
  },
  {
    title: "Manage Services",
    href: "/dashboard/admin/services",
    icon: Scissors,
  },
  {
    title: "Appointments",
    href: "/dashboard/admin/appointments",
    icon: CalendarCheck,
  },
  {
    title: "Customers",
    href: "/dashboard/admin/customers",
    icon: Users,
  },
  {
    title: "Transactions",
    href: "/dashboard/admin/transactions",
    icon: Receipt,
  },
  {
    title: "My Profile",
    href: "/dashboard/admin/profile",
    icon: User,
  },
];

// Customer navigation items specified by requirements:
// overview, my appointments, browse services, my profile
export const CUSTOMER_NAV_ITEMS: NavItem[] = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    matchExact: true,
  },
  {
    title: "My Appointments",
    href: "/dashboard/appointments",
    icon: CalendarCheck,
  },
  {
    title: "Browse Services",
    href: "/services",
    icon: Sparkles,
  },
  {
    title: "My Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: SidebarRole;
}

export function AppSidebar({ role, className, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Determine active role dynamically from prop or user session
  const detectedRole = getUserRole(session?.user);
  const activeRole: SidebarRole =
    role ?? (detectedRole === "admin" ? "admin" : "customer");

  const navItems =
    activeRole === "admin" ? ADMIN_NAV_ITEMS : CUSTOMER_NAV_ITEMS;

  const isItemActive = (item: NavItem): boolean => {
    if (item.matchExact) {
      if (item.href === "/dashboard") {
        return pathname === "/dashboard" || pathname === "/dashboard/customer";
      }
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully.");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <Sidebar
      className={cn(
        "border-r border-border-subtle bg-bg-surface-card text-fg-primary",
        className,
      )}
      {...props}
    >
      {/* Brand Header */}
      <SidebarHeader className="border-b border-border-subtle bg-bg-surface-card p-4">
        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-90"
          aria-label="Return to Velvet Saloon home"
        >
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bg-surface-dark p-1">
            <Image
              src={LOGO_SRC}
              alt="Velvet Saloon logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-base font-semibold tracking-tight text-fg-primary">
              Velvet Saloon
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  activeRole === "admin"
                    ? "bg-bg-accent-brand"
                    : "bg-emerald-500",
                )}
                aria-hidden
              />
              {activeRole === "admin" ? "Admin Console" : "Customer Portal"}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Dynamic Nav Content */}
      <SidebarContent className="bg-bg-surface-card px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
            {activeRole === "admin" ? "Management" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-1.5">
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const active = isItemActive(item);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-bg-accent-brand text-fg-on-accent hover:bg-bg-accent-brand hover:text-fg-on-accent"
                          : "text-fg-primary hover:bg-bg-canvas hover:text-fg-primary",
                      )}
                      render={<Link href={item.href} />}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-fg-on-accent" : "text-fg-muted",
                        )}
                        aria-hidden
                      />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Storefront link, User profile and Logout */}
      <SidebarFooter className="border-t border-border-subtle bg-bg-surface-card p-3">
        <SidebarMenu className="mb-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="View Storefront"
              className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-xs text-fg-muted transition-colors hover:bg-bg-canvas hover:text-fg-primary"
              render={<Link href="/" />}
            >
              <Store className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">View Storefront</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-1" />

        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User avatar"}
                width={32}
                height={32}
                unoptimized
                className="size-8 shrink-0 rounded-full border border-border-subtle object-cover"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-bg-canvas text-fg-primary">
                <User className="size-4" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-fg-primary">
                {session?.user?.name || "My Account"}
              </p>
              <p className="truncate text-[11px] text-fg-muted">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle text-fg-muted transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:border-border-focus focus-visible:outline-none"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-3.5" aria-hidden />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
