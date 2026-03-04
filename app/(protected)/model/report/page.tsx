import { Card, CardText, CardTitle } from "@/components/ui/card";
import { PaywallCard } from "@/components/model/paywall-card";
import { Button } from "@/components/ui/button";
import { getFeatureFlags } from "@/src/lib/feature-flags";
import { isPaymentsDemoMode } from "@/src/lib/demo-mode";
import { getActiveUserId, hasProAccess } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";

export default async function ModelReportPage() {
  const proAccess = await hasProAccess();

  if (!proAccess) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <PaywallCard paymentsDemo={isPaymentsDemoMode()} />
      </div>
    );
  }

  const flags = getFeatureFlags();
  const userId = await getActiveUserId();
  const repository = getRepository();
  const scenario = (await repository.listSavedScenarios(userId))[0];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Readiness report</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          This on-screen report summarises assumptions, scenarios, scheme awareness indicators, and missing information.
        </p>
      </section>
      <Card className="space-y-4">
        <CardTitle>{scenario?.name ?? "No report saved yet"}</CardTitle>
        {scenario ? (
          <>
            {scenario.report.snapshot.map((item) => (
              <CardText key={item}>{item}</CardText>
            ))}
            <div className="grid gap-3 md:grid-cols-2">
              {scenario.report.scenarioRanges.map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </>
        ) : (
          <CardText>Use the dashboard to generate a scenario first.</CardText>
        )}
        <Button type="button" variant="secondary" disabled={!flags.enableMonth1ReportExports}>
          PDF export (Month 1)
        </Button>
      </Card>
    </div>
  );
}
