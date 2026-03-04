import { PricingGrid } from "@/components/pricing/pricing-grid";
import { isPaymentsDemoMode } from "@/src/lib/demo-mode";

export default function PricingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Clear tier path and pricing</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Tier 1 starts with the quiz and factual calculators, Tier 2 unlocks deeper modelling, and Tier 3 is a future advice expression-of-interest lane only.
        </p>
      </section>
      <PricingGrid paymentsDemo={isPaymentsDemoMode()} />
    </div>
  );
}
