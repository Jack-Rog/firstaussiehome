import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import type { LearnArticleCard } from "@/src/lib/types";

export function LearnArticleCardItem({ article }: { article: LearnArticleCard }) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Badge>{article.category.replace("-", " ")}</Badge>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-soft">
          {article.readingTime}
        </span>
      </div>
      <CardTitle>{article.title}</CardTitle>
      <CardText>{article.summary}</CardText>
      <div className="mt-auto flex flex-wrap gap-2 text-xs text-foreground-soft">
        {article.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-border px-3 py-1">
            #{tag}
          </span>
        ))}
      </div>
      <Link href={`/learn/${article.slug}`} className="font-semibold text-primary">
        Continue learning
      </Link>
    </Card>
  );
}
