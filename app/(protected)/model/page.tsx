import Link from "next/link";
import { CsvImportForm } from "@/components/model/csv-import-form";
import { ModelDashboard } from "@/components/model/model-dashboard";
import { PaywallCard } from "@/components/model/paywall-card";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { isPaymentsDemoMode } from "@/src/lib/demo-mode";
import { getActiveUserId, hasProAccess } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";
import { updateSubscription } from "@/src/server/services/subscription-service";

type ModelPageProps = {
  searchParams?: Promise<{
    demo?: string;
  }>;
};

export default async function ModelPage({ searchParams }: ModelPageProps) {
  const userId = await getActiveUserId();
  const params = (await searchParams) ?? {};

  if (params.demo === "1" && isPaymentsDemoMode()) {
    await updateSubscription({
      userId,
      status: "demo",
      priceId: process.env.STRIPE_PRO_PRICE_ID ?? "price_demo",
    });
  }

  const proAccess = await hasProAccess();

  if (!proAccess) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <PaywallCard paymentsDemo={isPaymentsDemoMode()} />
      </div>
    );
  }

  const repository = getRepository();
  const [scenarios, latestImport, subscription] = await Promise.all([
    repository.listSavedScenarios(userId),
    repository.getLatestBankImport(userId),
    repository.getSubscription(userId),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Pro modelling dashboard</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Use CSV import, scenario sliders, and readiness reports to compare ranges and assumptions. This remains modelling only.
        </p>
      </section>
      <ModelDashboard scenarios={scenarios} latestImport={latestImport} subscription={subscription} />
      <Card className="space-y-4">
        <CardTitle>Next action</CardTitle>
        <CardText>Move into CSV import or generate a fresh report using the current assumptions.</CardText>
        <div className="flex flex-wrap gap-3">
          <Link href="/model/import" className="rounded-full bg-primary px-5 py-3 font-semibold text-white">
            Import transactions
          </Link>
          <Link href="/model/report" className="rounded-full bg-surface px-5 py-3 font-semibold text-foreground ring-1 ring-border">
            Generate report
          </Link>
        </div>
      </Card>
      <CsvImportForm />
    </div>
  );
}
