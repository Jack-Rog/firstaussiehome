import Link from "next/link";
import { Card, CardText, CardTitle } from "@/components/ui/card";

export function PaywallCard({ paymentsDemo }: { paymentsDemo: boolean }) {
  return (
    <Card className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Tier 2 next step</p>
      <CardTitle>Tier 2 modelling is currently EOI only</CardTitle>
      <CardText>
        Tier 1 handles the broad fit quiz and first-home fact cards. Tier 2 and licensed advice pathways are both
        expression-of-interest only right now.
      </CardText>
      {paymentsDemo ? <p className="text-sm font-semibold text-primary-strong">Payments are disabled in dev</p> : null}
      <Link
        href="/eoi/tools"
        className="inline-flex w-fit items-center rounded-full bg-primary px-5 py-3 font-semibold text-white"
      >
        Open Tools + Support Research
      </Link>
    </Card>
  );
}
