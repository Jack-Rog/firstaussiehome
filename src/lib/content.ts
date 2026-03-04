import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { z } from "zod";
import type { LearnArticleCard, LearnFrontmatter, LearningPathId } from "@/src/lib/types";

const CONTENT_ROOT = path.join(process.cwd(), "content", "learn");

const frontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  summary: z.string(),
  category: z.enum([
    "money-foundations",
    "budgeting",
    "tax",
    "super",
    "investing",
    "first-home",
    "schemes",
    "help",
  ]),
  tags: z.array(z.string()),
  pathIds: z.array(
    z.enum([
      "week-1-money-reset",
      "first-home-roadmap-nsw",
      "tax-for-first-job",
      "super-basics",
      "investing-basics",
    ]),
  ),
  officialLinks: z.array(
    z.enum([
      "MONEYSMART_HOME",
      "MONEYSMART_BUDGET",
      "MONEYSMART_SUPER",
      "MONEYSMART_INVESTING",
      "ATO_HECS",
      "ATO_PAYG",
      "ATO_TAX_RETURN",
      "SERVICE_NSW_FHBAS",
      "REVENUE_NSW_FHOG",
      "FIRSTHOME_HOME_GUARANTEE",
      "FIRSTHOME_FHSS",
      "ASIC_FINANCIAL_ADVISERS_REGISTER",
      "ASIC_MONEYSMART_SCAMS",
      "AFCA_HOME",
      "NSW_GOV_SHARED_EQUITY",
      "TODO_HELP_TO_BUY",
    ]),
  ),
  lastReviewed: z.string(),
  tierLabel: z.literal("Learn & Model"),
});

async function walkMdxFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return walkMdxFiles(resolved);
      }

      return resolved.endsWith(".mdx") ? [resolved] : [];
    }),
  );

  return files.flat();
}

async function readArticleCard(filePath: string): Promise<LearnArticleCard> {
  const source = await fs.readFile(filePath, "utf8");
  const parsed = matter(source);
  const frontmatter = frontmatterSchema.parse(parsed.data) satisfies LearnFrontmatter;
  const words = parsed.content.split(/\s+/).filter(Boolean).length;
  const readingTime = `${Math.max(1, Math.ceil(words / 180))} min read`;

  return {
    ...frontmatter,
    readingTime,
  };
}

export async function getAllLearnArticles() {
  const files = await walkMdxFiles(CONTENT_ROOT);
  const articles = await Promise.all(files.map(readArticleCard));
  return articles.sort((left, right) => left.title.localeCompare(right.title));
}

export async function getLearnArticleBySlug(slug: string) {
  const files = await walkMdxFiles(CONTENT_ROOT);

  for (const filePath of files) {
    const source = await fs.readFile(filePath, "utf8");
    const preview = matter(source);

    if (preview.data.slug !== slug) {
      continue;
    }

    const { content, frontmatter } = await compileMDX<LearnFrontmatter>({
      source,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    });

    const parsed = frontmatterSchema.parse(frontmatter);
    return {
      content,
      frontmatter: parsed,
    };
  }

  return null;
}

export async function getLearnFilters() {
  const articles = await getAllLearnArticles();
  const tags = [...new Set(articles.flatMap((article) => article.tags))].sort();
  const categories = [...new Set(articles.map((article) => article.category))];
  return { tags, categories };
}

export async function searchLearnArticles(filters: {
  q?: string;
  tag?: string;
  path?: LearningPathId;
}) {
  const articles = await getAllLearnArticles();
  const query = filters.q?.trim().toLowerCase();

  return articles.filter((article) => {
    const matchesQuery =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.tags.some((tag) => tag.toLowerCase().includes(query));
    const matchesTag = !filters.tag || article.tags.includes(filters.tag);
    const matchesPath = !filters.path || article.pathIds.includes(filters.path);
    return matchesQuery && matchesTag && matchesPath;
  });
}
