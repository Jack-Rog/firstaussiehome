import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { Card, CardText, CardTitle } from "@/components/ui/card";

const TIER_FEATURES = {
  free: [
    "Free quiz",
    "Broad scheme checks",
    "Factual first-home calculators",
    "Guided learning",
  ],
  account: [
    "Account-backed dashboard",
    "Saved quiz and survey history",
    "Password recovery by email",
    "Future modelling tied to your account",
    "One place to reopen your progress",
  ],
};

export function PricingGrid({ paymentsDemo }: { paymentsDemo: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="animate-fade-up space-y-5 border-primary/20 bg-white/92">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">
          <Sparkles className="h-3.5 w-3.5" />
          Start here
        </div>
        <CardTitle>Tier 1</CardTitle>
        <CardText>Free quiz, broad scheme checks, factual first-home calculators, and guided learning.</CardText>
        <p className="text-4xl font-semibold">Free</p>
        <ul className="space-y-2 text-sm text-foreground-soft">
          {TIER_FEATURES.free.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="animate-fade-up animation-delay-100 space-y-5 border-primary/35 bg-gradient-to-br from-primary to-accent text-white shadow-[0_16px_34px_rgba(53,91,66,0.35)]">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
          <Zap className="h-3.5 w-3.5" />
          Optional next step
        </div>
        <CardTitle className="text-white">Account-backed dashboard</CardTitle>
        <CardText className="text-white/85">
          Create an account once so the quiz, dashboard, and research survey stay linked together when you return.
        </CardText>
        <p className="text-4xl font-semibold">Included</p>
        <ul className="space-y-2 text-sm text-white/85">
          {TIER_FEATURES.account.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 text-white" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link href="/first-home-dashboard" className="w-full rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-primary transition hover:bg-white/90">
          Open dashboard
        </Link>
        {paymentsDemo ? (
          <p className="text-xs text-white/80">Payments are disabled in dev. The core dashboard flow remains available.</p>
        ) : (
          <p className="text-xs text-white/80">No paid integration currently. The main value is saving and reopening your account-backed results.</p>
        )}
      </Card>
    </div>
  );
}
