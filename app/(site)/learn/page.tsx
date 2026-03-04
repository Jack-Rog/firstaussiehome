import Link from "next/link";
import { LearnArticleCardItem } from "@/components/learn/article-card";
import { Badge } from "@/components/ui/badge";
import { searchLearnArticles, getLearnFilters } from "@/src/lib/content";

type LearnPageProps = {
  searchParams?: Promise<{
    q?: string;
    tag?: string;
    path?: string;
  }>;
};

export default async function LearnHubPage({ searchParams }: LearnPageProps) {
  const filters = (await searchParams) ?? {};
  const articles = await searchLearnArticles({
    q: filters.q,
    tag: filters.tag,
    path: filters.path as never,
  });
  const available = await getLearnFilters();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="space-y-4">
        <Badge>Learn & Model</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Structured learning hub</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Explore guided content on money basics, first-home literacy, tax, super, and safety. Search and tag filters stay lightweight so the next step remains obvious.
        </p>
        <div className="flex flex-wrap gap-2">
          {available.tags.slice(0, 8).map((tag) => (
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
