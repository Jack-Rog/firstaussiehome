"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { getSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { AussiesFirstHomeLogo } from "@/components/branding/aussies-first-home-logo";
import type { SessionUser } from "@/src/lib/types";

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/first-home-dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
];

function getUserLabel(user: SessionUser) {
  const trimmedName = user.name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const emailLocalPart = user.email?.split("@")[0]?.trim();
  return emailLocalPart || "Your account";
}

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const signInHref = "/sign-in?callbackUrl=%2Ffirst-home-dashboard";
  const signedInLabel = user ? getUserLabel(user) : null;

  useEffect(() => {
    let isActive = true;

    void getSession().then((session) => {
      if (!isActive) {
        return;
      }

      const sessionUser =
        session?.user && "id" in session.user ? (session.user as SessionUser) : null;
      setUser(sessionUser);
    });

    return () => {
      isActive = false;
    };
  }, []);

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
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href={"/first-home-dashboard" as never}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                  {signedInLabel?.charAt(0).toUpperCase()}
                </span>
                <span>{signedInLabel}</span>
              </Link>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary-strong"
                onClick={() =>
                  startTransition(() => {
                    setUser(null);
                    void signOut({ callbackUrl: "/" });
                  })
                }
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href={`${signInHref}&mode=login` as never}
              className="hidden rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted sm:inline-flex"
            >
              Log in
            </Link>
          )}
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
            {user ? (
              <>
                <div className="mt-2 rounded-xl border border-border bg-surface px-3 py-3 text-sm text-foreground-soft">
                  Signed in as <span className="font-semibold text-foreground">{signedInLabel}</span>
                </div>
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-primary-soft hover:text-primary-strong"
                  onClick={() => {
                    setMobileOpen(false);
                    startTransition(() => {
                      setUser(null);
                      void signOut({ callbackUrl: "/" });
                    });
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href={`${signInHref}&mode=login` as never}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-primary-soft hover:text-primary-strong"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
