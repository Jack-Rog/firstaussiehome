import Link from "next/link";
import { ProgressBar } from "@/components/ui/progress";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import type { LearningPath, ProgressEntryRecord } from "@/src/lib/types";

export function LearningPathList({
  paths,
  progress,
}: {
  paths: LearningPath[];
  progress: ProgressEntryRecord[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {paths.map((path) => {
        const entry = progress.find((item) => item.kind === "path" && item.key === path.id);
        const completedItems = Number(entry?.value.completedItems ?? 0);
        const totalItems = Number(entry?.value.totalItems ?? path.slugs.length);
        const percentage = Math.round((completedItems / Math.max(1, totalItems)) * 100);

        return (
          <Card key={path.id} className="flex flex-col gap-4">
            <CardTitle>{path.title}</CardTitle>
            <CardText>{path.description}</CardText>
            <ProgressBar value={percentage} />
            <p className="text-sm text-foreground-soft">
              {completedItems}/{totalItems} checkpoints recorded
            </p>
            <ul className="space-y-2 text-sm text-foreground-soft">
              {path.checkpoints.map((checkpoint) => (
                <li key={checkpoint}>- {checkpoint}</li>
              ))}
            </ul>
            <Link href={`/learn?path=${path.id}`} className="mt-auto font-semibold text-primary">
              Continue learning
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
