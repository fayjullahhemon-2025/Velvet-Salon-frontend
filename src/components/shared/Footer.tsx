"use client";

import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const LOGO_SRC =
  "https://i.ibb.co.com/PGNhm8rg/Vel-Vet-Chair-1-removebg-preview.png";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse Services", href: "/services" },
  { label: "Sign In", href: "/signin" },
  { label: "Sign Up", href: "/signup" },
] as const;

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
  {
    label: "Instagram",
    href: "#",
    path: "M16 4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4zm-4 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4.5-6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z",
  },
  {
    label: "YouTube",
    href: "#",
    path: "M22.5 6.5a3 3 0 0 0-2.1-2.1C18.6 4 12 4 12 4s-6.6 0-8.4.4A3 3 0 0 0 1.5 6.5 31 31 0 0 0 1 12a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1C5.4 20 12 20 12 20s6.6 0 8.4-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23 12a31 31 0 0 0-.5-5.5zM10 15.5v-7l6 3.5-6 3.5z",
  },
] as const;

const OPENING_HOURS = [
  { days: "Mon – Fri", hours: "9:00 AM – 8:00 PM" },
  { days: "Saturday", hours: "9:00 AM – 6:00 PM" },
  { days: "Sunday", hours: "10:00 AM – 4:00 PM" },
] as const;

const Footer = () => {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="border-t border-border-subtle bg-bg-surface-dark text-fg-inverse">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={LOGO_SRC}
                alt="Velvet Saloon logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-lg font-semibold tracking-wide">
                Velvet Saloon
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-inverse/80">
              Premium salon care for hair, skin, and spa — book trusted
              professionals and look your best, every day.
            </p>
            <div className="mt-6 flex gap-4">
              {SOCIAL_LINKS.map(({ label, href, path }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="rounded-md p-2 text-fg-inverse transition-colors hover:bg-fg-inverse/10 hover:text-bg-accent-brand focus-visible:border-border-focus focus-visible:outline-none"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    role="img"
                    aria-label={label}
                  >
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Footer">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-bg-accent-brand">
              Important Links
            </h3>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-fg-inverse/80 transition-colors hover:text-bg-accent-brand focus-visible:border-border-focus focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-bg-accent-brand">
              Contact Us
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-fg-inverse/80">
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-0.5 shrink-0" aria-hidden />
                <a
                  href="tel:+15551234567"
                  className="transition-colors hover:text-bg-accent-brand"
                >
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-0.5 shrink-0" aria-hidden />
                <a
                  href="mailto:hello@velvetsaloon.com"
                  className="transition-colors hover:text-bg-accent-brand"
                >
                  hello@velvetsaloon.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  128 Style Avenue, Suite 4
                  <br />
                  Brooklyn, NY 11201, USA
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-bg-accent-brand">
              Opening Hours
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-fg-inverse/80">
              {OPENING_HOURS.map(({ days, hours }) => (
                <li key={days} className="flex items-start gap-3">
                  <Clock size={16} className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    <span className="block font-medium text-fg-inverse">
                      {days}
                    </span>
                    {hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border-subtle">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-fg-inverse/70">
            © {year} Velvet Saloon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
