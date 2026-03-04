import { Card, CardText, CardTitle } from "@/components/ui/card";

export function PricingGrid({ paymentsDemo }: { paymentsDemo: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="space-y-4 border-primary/20 bg-primary/5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Start here</p>
        <CardTitle>Tier 1</CardTitle>
        <CardText>Free quiz, broad scheme checks, factual first-home calculators, and guided learning.</CardText>
        <p className="text-3xl font-semibold">Free</p>
      </Card>
      <Card className="space-y-4 border-primary bg-primary-strong text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Next if needed</p>
        <CardTitle className="text-white">Tier 2 Pro</CardTitle>
        <CardText className="text-white/80">
          CSV import, deeper scenario modelling, and readiness reporting after the Tier 1 facts are clear. Modelling only.
        </CardText>
        <p className="text-3xl font-semibold">$19/mo</p>
        <form action="/api/stripe/checkout" method="POST">
          <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-primary-strong">
            {paymentsDemo ? "Enable Pro demo access" : "Start Pro"}
          </button>
        </form>
        {paymentsDemo ? <p className="text-xs text-white/70">Payments disabled in dev</p> : null}
      </Card>
      <Card className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Future lane</p>
        <CardTitle>Tier 3</CardTitle>
        <CardText>Licensed advice (coming soon). Expression of interest only at launch.</CardText>
        <p className="text-3xl font-semibold">EOI</p>
      </Card>
    </div>
  );
}
