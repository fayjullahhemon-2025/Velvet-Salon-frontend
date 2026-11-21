"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LOGO_SRC =
  "https://i.ibb.co.com/PGNhm8rg/Vel-Vet-Chair-1-removebg-preview.png";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse Services", href: "/services" },
] as const;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
          {/* <span className="text-lg font-semibold tracking-wide text-fg-inverse">

                    </span> */}
        </Link>

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

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/sign-in"
            className="rounded-md border border-fg-inverse px-4 py-2 text-sm font-medium text-fg-inverse transition-colors hover:bg-fg-inverse hover:text-bg-surface-dark focus-visible:border-border-focus focus-visible:outline-none"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-md bg-bg-accent-brand px-4 py-2 text-sm font-medium text-fg-on-accent transition-opacity hover:opacity-90 focus-visible:border-border-focus focus-visible:outline-none"
          >
            Sign Up
          </Link>
        </div>

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
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/sign-in"
              className="rounded-md border border-fg-inverse px-4 py-2 text-center text-sm font-medium text-fg-inverse transition-colors hover:bg-fg-inverse hover:text-bg-surface-dark"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-bg-accent-brand px-4 py-2 text-center text-sm font-medium text-fg-on-accent transition-opacity hover:opacity-90"
              onClick={() => setIsOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
