import { Card, CardText, CardTitle } from "@/components/ui/card";

const PRO_TOOLS_CHECKLIST = [
  "State-by-state stamp duty checker (capital vs regional)",
  "Borrowing power scenario modelling",
  "Deposit runway with savings automation ideas",
  "Repayment stress test under rate rises",
  "Buying timeline planner with milestones",
  "Scheme eligibility audit summary export",
];

const ADVICE_CHECKLIST = [
  "One-off licensed strategy review",
  "Deposit and debt restructure discussion",
  "Scheme selection confidence check",
  "Property purchase sequencing review",
  "Cash flow and buffer planning",
  "Referral to accredited professionals where needed",
];

export default function ToolsEoiPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8 md:px-6 md:py-10">
      <section className="animate-fade-up space-y-3 rounded-[1.4rem] border border-border bg-white/85 p-6 shadow-[0_12px_30px_rgba(33,47,37,0.08)]">
        <h1 className="text-4xl font-semibold tracking-tight">First Aussie Home Pro + Advice EOI</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          There is no paid integration right now. Both pro tooling and licensed advice are expression-of-interest only.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-fade-up animation-delay-100 space-y-4 bg-white/92">
          <CardTitle>Potential pro tools checklist</CardTitle>
          <CardText>Select anything you want prioritised.</CardText>
          <div className="space-y-2 text-sm">
            {PRO_TOOLS_CHECKLIST.map((item) => (
              <label key={item} className="flex items-start gap-2 rounded-lg border border-border bg-[#f9f8f6] px-3 py-2.5">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="animate-fade-up animation-delay-200 space-y-4 bg-white/92">
          <CardTitle>Potential professional advice checklist</CardTitle>
          <CardText>Tell us what kind of human advice support matters most.</CardText>
          <div className="space-y-2 text-sm">
            {ADVICE_CHECKLIST.map((item) => (
              <label key={item} className="flex items-start gap-2 rounded-lg border border-border bg-[#f9f8f6] px-3 py-2.5">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Card className="animate-fade-up animation-delay-300 space-y-4 bg-white/92">
        <CardTitle>Register your EOI</CardTitle>
        <CardText>We use this to prioritise what to build next for first-home buyers.</CardText>
        <form className="grid gap-3">
          <input className="rounded-xl border border-border bg-[#f9f8f6] px-4 py-3" placeholder="Name" />
          <input className="rounded-xl border border-border bg-[#f9f8f6] px-4 py-3" placeholder="Email" />
          <input
            className="rounded-xl border border-border bg-[#f9f8f6] px-4 py-3"
            placeholder="Why are you interested in pro tools or licensed advice?"
          />
          <textarea
            className="min-h-28 rounded-xl border border-border bg-[#f9f8f6] px-4 py-3"
            placeholder="What are your biggest concerns right now?"
          />
          <textarea
            className="min-h-32 rounded-xl border border-border bg-[#f9f8f6] px-4 py-3"
            placeholder="Share your story or context so we can prioritise correctly"
          />
          <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-strong" type="button">
            Join EOI list
          </button>
        </form>
      </Card>
    </div>
  );
}
