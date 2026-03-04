import type { ReactNode } from "react";
import Link from "next/link";
import { DisclosureProvider } from "@/components/compliance/disclosure-context";
import { SiteHeader } from "@/components/navigation/site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <DisclosureProvider>
      <SiteHeader />
      <main className="pb-28">{children}</main>
      <footer className="mt-16 border-t border-border bg-[#faf7f0]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm text-foreground-soft sm:flex-row sm:items-center sm:justify-between">
          <p>Aussies First Home keeps the core flow factual, calmer, and easier to scan.</p>
          <div className="flex gap-4">
            <Link href="/First-Home-Quiz" className="hover:text-primary">
              First Home Quiz
            </Link>
            <Link href="/pricing" className="hover:text-primary">
              Pricing
            </Link>
            <Link href="/safety" className="hover:text-primary">
              Safety
            </Link>
            <Link href="/eoi/advice" className="hover:text-primary">
              Tier 3 EOI
            </Link>
          </div>
        </div>
      </footer>
    </DisclosureProvider>
  );
}
