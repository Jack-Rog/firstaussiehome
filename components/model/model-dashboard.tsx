import { Card, CardText, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/src/lib/utils";
import type { BankImportRecord, SavedScenarioRecord, SubscriptionRecord } from "@/src/lib/types";

export function ModelDashboard({
  scenarios,
  latestImport,
  subscription,
}: {
  scenarios: SavedScenarioRecord[];
  latestImport: BankImportRecord | null;
  subscription: SubscriptionRecord;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card>
          <CardTitle>Subscription status</CardTitle>
          <CardText className="mt-2">Current access: {subscription.status}</CardText>
        </Card>
        <Card>
          <CardTitle>Latest CSV import</CardTitle>
          {latestImport ? (
            <CardText className="mt-2">
              {latestImport.fileName} · {latestImport.rowCount} rows · imported {formatDate(latestImport.createdAt)}
            </CardText>
          ) : (
            <CardText className="mt-2">No import yet.</CardText>
          )}
        </Card>
      </div>
      <Card className="space-y-4">
        <CardTitle>Saved scenarios</CardTitle>
        {scenarios.length === 0 ? (
          <CardText>No scenarios saved yet.</CardText>
        ) : (
          <div className="space-y-4">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="font-semibold">{scenario.name}</p>
                <p className="text-sm text-foreground-soft">Updated {formatDate(scenario.updatedAt)}</p>
                <p className="mt-2 text-sm text-foreground-soft">{scenario.report.snapshot[0]}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
