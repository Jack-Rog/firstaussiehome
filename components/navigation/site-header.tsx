"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AussiesFirstHomeLogo } from "@/components/branding/aussies-first-home-logo";

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/first-home-dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-6">
        <Link href="/" className="shrink-0">
          <AussiesFirstHomeLogo />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary-strong"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={"/start" as never}
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(74,124,89,0.28)] transition hover:bg-primary-strong sm:inline-flex"
          >
            First Home Quiz
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-white/95 px-5 py-4 md:hidden">
          <nav className="grid gap-1">
            {MAIN_LINKS.map((link) => (
              <Link
                key={`mobile-${link.href}`}
                href={link.href as never}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-primary-soft hover:text-primary-strong"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
