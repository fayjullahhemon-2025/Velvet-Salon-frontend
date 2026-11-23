"use client";

import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  User as UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";
import { getHomeForRole, getUserRole } from "@/lib/auth-helpers";

const LOGO_SRC =
  "https://i.ibb.co.com/PGNhm8rg/Vel-Vet-Chair-1-removebg-preview.png";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse Services", href: "/services" },
] as const;

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully.");
      setIsOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to log out. Please try again.");
    }
  };

  const dashboardHref = session?.user ? getHomeForRole(session.user) : "/";
  const userRole = session?.user ? getUserRole(session.user) : null;

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setIsOpen(false)}
        >
          <Image
            src={LOGO_SRC}
            alt="Velvet Saloon logo"
            width={100}
            height={100}
            className="h-40 w-40 object-contain"
          />
        </Link>

        {/* Public Desktop Nav Links */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-bg-accent-brand focus-visible:border-border-focus focus-visible:outline-none ${
                pathname === link.href
                  ? "text-bg-accent-brand"
                  : "text-fg-inverse"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Controls / Profile Dropdown */}
        <div className="hidden items-center gap-3 md:flex">
          {isPending ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-fg-inverse/10" />
          ) : session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-full border border-fg-inverse/30 bg-bg-surface-dark/70 py-1.5 pl-1.5 pr-3 text-sm text-fg-inverse transition-colors hover:border-bg-accent-brand hover:text-bg-accent-brand focus-visible:border-border-focus focus-visible:outline-none"
                aria-label="User account menu"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User avatar"}
                    width={28}
                    height={28}
                    unoptimized
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-bg-accent-brand text-fg-on-accent">
                    <UserIcon className="size-4" aria-hidden />
                  </div>
                )}
                <span className="max-w-[120px] truncate text-sm font-medium">
                  {session.user.name || "Account"}
                </span>
                <ChevronDown
                  className="size-3.5 text-fg-inverse/70 transition-transform duration-200"
                  aria-hidden
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 rounded-xl border border-border-subtle bg-bg-surface-card p-1 text-fg-primary shadow-xl"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-fg-primary">
                    {session.user.name || "User"}
                  </p>
                  <p className="truncate text-xs text-fg-muted">
                    {session.user.email}
                  </p>
                  {userRole ? (
                    <span className="mt-1.5 inline-block rounded bg-bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                      {userRole}
                    </span>
                  ) : null}
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border-subtle" />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push(dashboardHref)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg-primary transition-colors hover:bg-bg-canvas focus:bg-bg-canvas"
                  >
                    <LayoutDashboard
                      className="size-4 text-fg-muted"
                      aria-hidden
                    />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border-subtle" />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    variant="destructive"
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
                  >
                    <LogOut className="size-4" aria-hidden />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-md border border-fg-inverse px-4 py-2 text-sm font-medium text-fg-inverse transition-colors hover:bg-fg-inverse hover:text-bg-surface-dark focus-visible:border-border-focus focus-visible:outline-none"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-bg-accent-brand px-4 py-2 text-sm font-medium text-fg-on-accent transition-opacity hover:opacity-90 focus-visible:border-border-focus focus-visible:outline-none"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-fg-inverse hover:text-bg-accent-brand focus-visible:border-border-focus focus-visible:outline-none md:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <nav
          className="border-t border-border-subtle bg-bg-surface-dark/95 px-4 pb-4 pt-2 backdrop-blur md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-bg-surface-dark text-bg-accent-brand"
                    : "text-fg-inverse hover:bg-fg-inverse/10"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4">
            {session?.user ? (
              <div className="rounded-xl border border-border-subtle bg-bg-surface-dark/80 p-3">
                <div className="flex items-center gap-3">
                  {session.user.image ? (
                    <Image
                      referrerPolicy="no-referrer"
                      src={session.user.image}
                      alt={session.user.name ?? "User avatar"}
                      width={36}
                      height={36}
                      unoptimized
                      className="size-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-bg-accent-brand text-fg-on-accent">
                      <UserIcon className="size-5" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-fg-inverse">
                      {session.user.name || "User"}
                    </p>
                    <p className="truncate text-xs text-fg-inverse/70">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 rounded-lg bg-fg-inverse/10 px-3 py-2 text-sm font-medium text-fg-inverse transition-colors hover:bg-fg-inverse/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="size-4" aria-hidden />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-fg-inverse"
                  >
                    <LogOut className="size-4" aria-hidden />
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/signin"
                  className="rounded-md border border-fg-inverse px-4 py-2 text-center text-sm font-medium text-fg-inverse transition-colors hover:bg-fg-inverse hover:text-bg-surface-dark"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-bg-accent-brand px-4 py-2 text-center text-sm font-medium text-fg-on-accent transition-opacity hover:opacity-90"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
