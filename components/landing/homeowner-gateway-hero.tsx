"use client";

import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck } from "lucide-react";
import { AussiesFirstHomeLogo } from "@/components/branding/aussies-first-home-logo";
import { GlossaryPopover } from "@/components/ui/glossary-popover";

const SCHEME_HIGHLIGHTS = [
  {
    metric: "Save up to $30,000",
    title: "Stamp Duty Exemption",
    body: "Broad NSW first-home duty relief can reduce or remove transfer duty within the current price bands.",
  },
  {
    metric: "Reduce your deposit to 5%",
    title: "First Home Guarantee",
    body: "This is a broad guarantee concept that can change the deposit side of the comparison.",
  },
  {
    metric: "Reduce your deposit to 2%",
    title: "Help to Buy Scheme",
    body: "This remains a broad shared-equity concept and the live settings can change over time.",
  },
  {
    metric: "Save up to $7,500 in tax",
    title: "Super Saver Scheme",
    body: "A super-linked first-home concept that can change the side-by-side deposit comparison.",
  },
];

export function HomeownerGatewayHero() {
  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_15%_20%,rgba(121,171,118,0.18),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(82,127,79,0.16),transparent_28%),linear-gradient(180deg,#f6f2e9,#edf4e8_50%,#e7efe2)] p-6 shadow-soft md:p-10">
      <div className="space-y-8">
        <div className="flex justify-center">
          <AussiesFirstHomeLogo compact />
        </div>

        <div className="mx-auto max-w-4xl space-y-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-strong">
            <Leaf className="h-4 w-4" />
            Aussies First Home
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Start the quiz to find the true cost of buying your first home.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-foreground-soft md:text-lg">
            A calmer pathway through the grants, the deposit, and the cash you need to bring.
          </p>
          <div className="flex justify-center">
            <Link
              href="/First-Home-Quiz"
              data-testid="start-homeowner-pathway-quiz"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-primary px-8 py-4 text-base font-semibold text-white shadow-soft transition hover:bg-primary-strong md:min-w-[28rem]"
            >
              Start the quiz to find the true cost of buying your first home
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-strong">
              <ShieldCheck className="h-4 w-4" />
              Most-used scheme shortcuts
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {SCHEME_HIGHLIGHTS.map((scheme) => (
                <div key={scheme.title} className="rounded-[1.5rem] border border-border bg-[#f8faf6] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">{scheme.metric}</p>
                  <div className="mt-2 text-lg font-semibold text-foreground">
                    <GlossaryPopover term={scheme.title} body={scheme.body}>
                      {scheme.title}
                    </GlossaryPopover>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </section>
  );
}
