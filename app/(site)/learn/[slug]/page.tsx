import { notFound } from "next/navigation";
import { getLearnArticleBySlug } from "@/src/lib/content";
import { getReferenceLinks } from "@/src/lib/references";

type LearnArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return [];
}

export default async function LearnArticlePage({ params }: LearnArticlePageProps) {
  const { slug } = await params;
  const article = await getLearnArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const links = getReferenceLinks(article.frontmatter.officialLinks);

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8 md:px-6 md:py-10">
      <header className="space-y-4 rounded-[1.25rem] border border-border bg-white/90 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {article.frontmatter.category.replace("-", " ")}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">{article.frontmatter.title}</h1>
        <p className="text-lg text-foreground-soft">{article.frontmatter.summary}</p>
      </header>
      <div className="rounded-[1.25rem] border border-border bg-white p-8 shadow-soft">
        <div className="prose max-w-none">{article.content}</div>
      </div>
      <section className="rounded-[1.25rem] border border-border bg-surface p-6">
        <h2 className="text-2xl font-semibold">Learn more</h2>
        <div className="mt-4 grid gap-3">
          {links.map((link) => (
            <a key={link.key} href={link.href} target="_blank" rel="noreferrer" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-primary shadow-soft">
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
