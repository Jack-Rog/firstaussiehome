import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LearnArticleCardItem } from "@/components/learn/article-card";
import { Badge } from "@/components/ui/badge";
import { getReferenceLinks } from "@/src/lib/references";
import { searchLearnArticles, getLearnFilters } from "@/src/lib/content";

type LearnPageProps = {
  searchParams?: Promise<{
    q?: string;
    tag?: string;
    path?: string;
  }>;
};

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
    title: "Stamp Duty Exemption",
    slug: "nsw-fhbas-concept",
    summary: "NSW duty-relief placeholder blog and direct official references.",
  },
  {
    title: "First Home Owner Grant",
    slug: "nsw-fhog-concept",
    summary: "Placeholder grant blog page to expand into state-specific guides.",
  },
];

const safetyLinks = getReferenceLinks([
  "ASIC_FINANCIAL_ADVISERS_REGISTER",
  "ASIC_MONEYSMART_SCAMS",
  "AFCA_HOME",
]);

const BLOG_PROMPT_TEMPLATE = `You are helping me write a First Aussie Home scheme blog.

Ask me the following before drafting:
1) Which scheme and state is this blog for?
2) Is this for state capital buyers, regional buyers, or both?
3) Target reader level: beginner, intermediate, or advanced?
4) Tone preference: neutral guide, practical coach, or policy explainer?
5) Preferred length: short (700 words), medium (1,200 words), or long (2,000+ words)?
6) What must the reader do after reading this (clear CTA)?
7) Which sections are highest priority (eligibility, numbers, risks, timeline, checklist)?
8) What legal/compliance caveats must be visible?
9) Which official sources must be cited?
10) Any local examples or scenarios to include?
11) What should be avoided (jargon, strong claims, technical depth, etc.)?

Then draft:
- H1 title
- 1 paragraph summary
- Key takeaways
- Eligibility section
- Capital vs regional implications
- Step-by-step action plan
- Risk / caveat section
- Official links section
- FAQ
- Placeholder section for future updates

Keep it factual and educational only, no personal advice.`;

export default async function LearnHubPage({ searchParams }: LearnPageProps) {
  const filters = (await searchParams) ?? {};
  const articles = await searchLearnArticles({
    q: filters.q,
    tag: filters.tag,
    path: filters.path as never,
  });
  const available = await getLearnFilters();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-8 md:px-6 md:py-10">
      <section className="animate-fade-up space-y-4 rounded-[1.4rem] border border-border bg-white/88 p-6 shadow-[0_12px_30px_rgba(33,47,37,0.08)]">
        <Badge>Learn & Model</Badge>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">First Aussie Home learning hub</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Start with the major first-home schemes first. We will expand each one into a full blog series; for now, each page contains placeholder long-form structure and official links.
        </p>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Most important first-home scheme blogs</h2>
          <p className="mt-2 text-foreground-soft">
            These are linked throughout the app from the landing pathway and dashboard scheme tracker.
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

      <section className="space-y-4 rounded-[1.3rem] border border-border bg-white/92 p-6">
        <h2 className="text-2xl font-semibold tracking-tight">Scheme blog prompt generator</h2>
        <p className="text-sm text-foreground-soft">
          Reuse this prompt for each major scheme blog. Save generated drafts directly in the repo so they can be reviewed and moved into `content/learn/schemes`.
        </p>
        <textarea className="min-h-80 w-full rounded-xl border border-border bg-[#f9f8f6] p-4 text-sm" defaultValue={BLOG_PROMPT_TEMPLATE} />
        <div className="rounded-xl border border-border bg-surface p-4 text-sm text-foreground-soft">
          <p className="font-semibold text-foreground">Repo upload location</p>
          <p className="mt-1">Place draft blog files in:</p>
          <code className="mt-2 block rounded-md bg-white px-3 py-2 text-xs">
            content/learn/uploads/
          </code>
          <p className="mt-2">Use the template:</p>
          <code className="mt-1 block rounded-md bg-white px-3 py-2 text-xs">
            content/learn/uploads/_scheme-blog-template.md
          </code>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Browse by topic</h2>
        <div className="flex flex-wrap gap-2">
          {available.tags.slice(0, 10).map((tag) => (
            <Link
              key={tag}
              href={`/learn?tag=${tag}`}
              className={`rounded-full px-3 py-2 text-sm ${
                filters.tag === tag ? "bg-primary text-white" : "bg-white ring-1 ring-border"
              }`}
            >
              #{tag}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <LearnArticleCardItem key={article.slug} article={article} />
        ))}
      </section>
    </div>
  );
}
