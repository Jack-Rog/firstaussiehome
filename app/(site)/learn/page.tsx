import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getReferenceLinks } from "@/src/lib/references";

const PRIORITY_SCHEMES = [
  {
    title: "First Home Guarantee",
    slug: "home-guarantee-concept",
    summary: "Broad concept notes, placeholder blog draft, and official links.",
  },
  {
    title: "Help to Buy Scheme",
    slug: "shared-equity-concept",
    summary: "Shared-equity overview with placeholder long-form blog content.",
  },
  {
    title: "First Home Super Saver Scheme",
    slug: "fhss-concept",
    summary: "FHSS explainer with placeholder blog format for future deep guides.",
  },
  {
    title: "First Home Stamp Duty Support",
    slug: "nsw-fhbas-concept",
    summary: "Consolidated duty-concession guide with state-specific sections.",
  },
  {
    title: "First Home Owner Grant",
    slug: "nsw-fhog-concept",
    summary: "Consolidated FHOG guide with state-specific sections.",
  },
];

const safetyLinks = getReferenceLinks([
  "ASIC_FINANCIAL_ADVISERS_REGISTER",
  "ASIC_MONEYSMART_SCAMS",
  "AFCA_HOME",
]);

export default function LearnHubPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-8 md:px-6 md:py-10">
      <section className="animate-fade-up space-y-4 rounded-[1.4rem] border border-border bg-white/88 p-6 shadow-[0_12px_30px_rgba(33,47,37,0.08)]">
        <Badge>Learn & Model</Badge>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">First Aussie Home learning hub</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Focused scheme library with only the five core first-home blogs. Each blog can include state-specific sections where needed.
        </p>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Core first-home scheme blogs</h2>
          <p className="mt-2 text-foreground-soft">
            These five guides are the only scheme blog references on this page.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PRIORITY_SCHEMES.map((scheme, index) => (
            <article
              key={scheme.slug}
              className="animate-fade-up rounded-[1.1rem] border border-border bg-white p-5"
              style={{ animationDelay: `${80 + index * 60}ms` }}
            >
              <h3 className="text-xl font-semibold tracking-tight">{scheme.title}</h3>
              <p className="mt-2 text-sm text-foreground-soft">{scheme.summary}</p>
              <Link href={`/learn/${scheme.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Open blog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="safety" className="space-y-4 rounded-[1.3rem] border border-border bg-white/92 p-6">
        <h2 className="text-2xl font-semibold tracking-tight">Safety essentials</h2>
        <p className="text-sm text-foreground-soft">
          Check legitimacy, understand adviser roles, and keep official escalation links close before you act.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {safetyLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-primary hover:bg-primary-soft"
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
