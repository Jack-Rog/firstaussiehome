import { Card, CardText, CardTitle } from "@/components/ui/card";
import { getActiveUserId } from "@/src/lib/route-guards";
import { listProgress } from "@/src/server/services/progress-service";

export default async function ProgressPage() {
  const userId = await getActiveUserId();
  const progress = await listProgress(userId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Card className="space-y-4">
        <CardTitle>Saved progress</CardTitle>
        {progress.length === 0 ? (
          <CardText>No saved progress yet.</CardText>
        ) : (
          <div className="space-y-3">
            {progress.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border bg-surface-muted px-4 py-3">
                <p className="font-semibold">{entry.kind}: {entry.key}</p>
                <p className="text-sm text-foreground-soft">Completed: {entry.completed ? "Yes" : "No"}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
