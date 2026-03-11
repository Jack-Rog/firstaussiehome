import type { ReactNode } from "react";
import Link from "next/link";
import { DisclosureProvider } from "@/components/compliance/disclosure-context";
import { PersistentBanner } from "@/components/compliance/persistent-banner";
import { SiteHeader } from "@/components/navigation/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <DisclosureProvider>
      <PersistentBanner />
      <SiteHeader />
      <main className="pb-28">{children}</main>
      <footer className="mt-16 border-t border-border bg-white/80">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
          <div className="space-y-3">
            <p className="text-base font-semibold text-primary">First Aussie Home</p>
            <p className="text-sm text-foreground-soft">
              First Aussie Home keeps the core flow factual, calmer, and easier to scan.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Product</h4>
            <div className="mt-3 grid gap-2 text-sm text-foreground-soft">
              <Link href="/First-Home-Quiz" className="hover:text-primary">
                First Home Quiz
              </Link>
              <Link href="/first-home-dashboard" className="hover:text-primary">
                Dashboard
              </Link>
              <Link href="/eoi/tools" className="hover:text-primary">
                Tools + Support Research
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Support</h4>
            <div className="mt-3 grid gap-2 text-sm text-foreground-soft">
              <Link href="/learn" className="hover:text-primary">
                Learn
              </Link>
              <Link href="/eoi/tools" className="hover:text-primary">
                Tools + Support Research
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground">Safety</h4>
            <div className="mt-3 grid gap-2 text-sm text-foreground-soft">
              <Link href="/learn#safety" className="hover:text-primary">
                Get help safely
              </Link>
              <Link href="/bookmarks" className="hover:text-primary">
                Bookmarks
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-border px-6 py-6">
          <p className="text-xs text-foreground-soft">
            Disclaimer: This tool provides general information only and is not financial advice. Always consult a qualified professional for personal advice.
          </p>
        </div>
      </footer>
    </DisclosureProvider>
  );
}
