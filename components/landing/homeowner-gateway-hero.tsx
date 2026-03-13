"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf, Shield, Sparkles, Target } from "lucide-react";
import { AussiesFirstHomeLogo } from "@/components/branding/aussies-first-home-logo";
import { GlossaryPopover } from "@/components/ui/glossary-popover";
import { REFERENCE_LINKS } from "@/src/lib/references";

type SchemeHighlight = {
  metric: string;
  title: string;
  body: string;
  amount: number;
  blurb: string;
  slug: string;
  colorClass: string;
};

const SCHEME_HIGHLIGHTS: SchemeHighlight[] = [
  {
    metric: "Save up to $30,000",
    title: "Stamp Duty Exemption",
    body: "Broad NSW first-home duty relief can reduce or remove transfer duty within the current price bands.",
    amount: 30000,
    blurb: "Can reduce upfront duty pressure at settlement.",
    slug: "nsw-fhbas-concept",
    colorClass: "from-[#6e8b58] to-[#4a7c59]",
  },
  {
    metric: "Reduce your deposit to 5%",
    title: "First Home Guarantee",
    body: "This is a broad guarantee concept that can change the deposit side of the comparison.",
    amount: 35000,
    blurb: "Can lower initial cash required by replacing the 20% baseline.",
    slug: "home-guarantee-concept",
    colorClass: "from-[#4a7c59] to-[#7a9c89]",
  },
  {
    metric: "Reduce your deposit to 2%",
    title: "Help to Buy Scheme",
    body: "This remains a broad shared-equity concept and the live settings can change over time.",
    amount: 40000,
    blurb: "Can shift ownership and deposit requirements in supported states.",
    slug: "shared-equity-concept",
    colorClass: "from-[#6d7f54] to-[#8ca36e]",
  },
  {
    metric: "Save up to $7,500 in tax",
    title: "Super Saver Scheme",
    body: "A super-linked first-home concept that can change the side-by-side deposit comparison.",
    amount: 7500,
    blurb: "Can improve deposit momentum under broad FHSS assumptions.",
    slug: "fhss-concept",
    colorClass: "from-[#789870] to-[#9eb98f]",
  },
  {
    metric: "Grant support where eligible",
    title: "First Home Owner Grant",
    body: "Grant pathways can change the upfront cash picture, but they are tightly defined and depend on current criteria.",
    amount: 10000,
    blurb: "Can directly reduce upfront out-of-pocket cash in eligible cases.",
    slug: "nsw-fhog-concept",
    colorClass: "from-[#4d7e61] to-[#7aa184]",
  },
];

const TRUSTED_SOURCES = [
  {
    label: "Services Australia",
    href: "https://www.servicesaustralia.gov.au/financial-information-service",
    note: "Services Australia Financial Information Service.",
  },
  {
    label: "Australian Taxation Office",
    href: REFERENCE_LINKS.FIRSTHOME_FHSS.href,
    note: REFERENCE_LINKS.FIRSTHOME_FHSS.note,
  },
  {
    label: "Housing Australia",
    href: REFERENCE_LINKS.FIRSTHOME_HOME_GUARANTEE.href,
    note: REFERENCE_LINKS.FIRSTHOME_HOME_GUARANTEE.note,
  },
  {
    label: "State Revenue Offices",
    href: "https://www.revenue.nsw.gov.au/grants-schemes/first-home-buyer/assistance-scheme",
    note: "Official state revenue office first-home duty relief guidance.",
  },
] as const;

export function HomeownerGatewayHero() {
  const sortedSchemeHighlights = useMemo(
    () => [...SCHEME_HIGHLIGHTS].sort((left, right) => right.amount - left.amount),
    [],
  );
  const targetSavings = useMemo(
    () => sortedSchemeHighlights.reduce((total, item) => total + item.amount, 0),
    [sortedSchemeHighlights],
  );
  const [animatedSavings, setAnimatedSavings] = useState(0);

  useEffect(() => {
    let frame = 0;
    const frames = 45;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / frames, 1);
      setAnimatedSavings(Math.round(targetSavings * progress));
      if (progress === 1) {
        window.clearInterval(timer);
      }
    }, 18);

    return () => window.clearInterval(timer);
  }, [targetSavings]);

  return (
    <div className="space-y-16">
      <section className="relative overflow-visible rounded-[2rem] border border-border bg-[radial-gradient(circle_at_15%_20%,rgba(74,124,89,0.2),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(122,156,137,0.18),transparent_28%),linear-gradient(180deg,#fdfdfb,#f7f7f2_52%,#eff2ec)] px-6 py-10 shadow-soft md:px-10 md:py-14">
        <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/35 blur-2xl" />
        <div className="absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <div className="space-y-6">
            <div className="animate-fade-up">
              <AussiesFirstHomeLogo compact />
            </div>

            <div className="space-y-5">
              <div className="animate-fade-up animation-delay-100 inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-strong">
                <Leaf className="h-4 w-4" />
                First Aussie Home
              </div>
              <h1 className="animate-fade-up animation-delay-200 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                Start the quiz to find the true cost of buying your first home.
              </h1>
              <p className="animate-fade-up animation-delay-300 max-w-2xl text-base text-foreground-soft md:text-lg">
                A calmer pathway through the grants, the deposit, and the cash you need to bring.
              </p>
              <div className="animate-fade-up animation-delay-400 flex flex-wrap items-center gap-3">
                <Link
                  href="/First-Home-Quiz"
                  data-testid="start-homeowner-pathway-quiz"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-[0_12px_28px_rgba(74,124,89,0.35)] transition hover:-translate-y-0.5 hover:bg-primary-strong"
                >
                  Start the quiz to find the true cost of buying your first home
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="animate-fade-up rounded-[1.4rem] border border-white/75 bg-gradient-to-br from-primary to-accent p-6 text-white shadow-[0_18px_40px_rgba(53,91,66,0.35)]">
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                <Sparkles className="h-4 w-4" />
                Potential pathway impact
              </div>
              <p className="text-4xl font-semibold">${animatedSavings.toLocaleString()}</p>
              <p className="mt-1 text-sm text-white/85">Broad estimate from scheme pathways shown below</p>
            </div>

            <div className="rounded-[1.25rem] border border-border bg-white/88 p-4 shadow-[0_10px_24px_rgba(33,47,37,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Reduce your upfront cost</p>
                <p className="text-xs text-foreground-soft">Educational estimate only</p>
              </div>
              <div className="relative space-y-3">
                <div className="absolute bottom-3 left-3 top-3 w-px bg-primary/25" />
                {sortedSchemeHighlights.map((scheme, index) => (
                  <div
                    key={scheme.title}
                    className="relative animate-fade-up pl-8"
                    style={{
                      animationDelay: `${120 + index * 70}ms`,
                      zIndex: sortedSchemeHighlights.length - index,
                    }}
                  >
                    <span className="absolute left-0 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <div className="rounded-xl border border-border bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <GlossaryPopover term={scheme.title} body={scheme.body}>
                          <span className="text-sm font-semibold text-foreground">{scheme.title}</span>
                        </GlossaryPopover>
                        <span className="text-sm font-semibold text-primary">+${scheme.amount.toLocaleString()}</span>
                      </div>
                      <Link href={`/learn/${scheme.slug}`} className="mt-1 inline-flex text-xs font-semibold text-primary hover:underline">
                        Read scheme blog
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="animate-fade-up space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">What You Could Discover</h2>
          <p className="mt-2 text-lg text-foreground-soft">
            Real opportunities that could accelerate your home ownership journey
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedSchemeHighlights.map((scheme) => (
            <article key={`discover-${scheme.title}`} className="rounded-[1.25rem] border border-border bg-white/88 p-5">
              <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${scheme.colorClass}`}>
                {scheme.metric}
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{scheme.title}</h3>
              <p className="mt-2 text-sm text-foreground-soft">{scheme.blurb}</p>
              <Link
                href={`/learn/${scheme.slug}`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Open scheme blog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="animate-fade-up rounded-[1.5rem] border border-border bg-white/88 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Trusted Official Information</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-foreground-soft">
            We map your pathway using official references and keep links visible throughout the app so you can verify details directly at the source.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {TRUSTED_SOURCES.map((source) => (
              <a
                key={source.label}
                href={source.href}
                target="_blank"
                rel="noreferrer"
                title={source.note}
                className="rounded-lg bg-surface-muted px-4 py-3 text-sm font-semibold text-foreground-soft transition hover:-translate-y-0.5 hover:bg-primary-soft hover:text-primary"
              >
                {source.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="animate-fade-up grid gap-4 md:grid-cols-3">
        <Link
          href="/First-Home-Quiz"
          className="rounded-[1.25rem] border border-border bg-white/85 p-6 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_12px_24px_rgba(33,47,37,0.08)]"
        >
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Target className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Find the total bill</p>
          <p className="mt-2 text-sm text-foreground-soft">
            Keep the total bill of buying a house front-and-centre while you compare pathways.
          </p>
        </Link>
        <Link
          href="/learn"
          className="rounded-[1.25rem] border border-border bg-white/85 p-6 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_12px_24px_rgba(33,47,37,0.08)]"
        >
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Stay with official sources</p>
          <p className="mt-2 text-sm text-foreground-soft">
            Safety links and disclosure details stay available throughout the flow.
          </p>
        </Link>
        <Link
          href="/first-home-dashboard"
          className="rounded-[1.25rem] border border-border bg-white/85 p-6 transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_12px_24px_rgba(33,47,37,0.08)]"
        >
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Share feedback from your dashboard</p>
          <p className="mt-2 text-sm text-foreground-soft">
            Your feedback survey now lives at the bottom of the dashboard so it stays attached to your account.
          </p>
        </Link>
      </section>
    </div>
  );
}
