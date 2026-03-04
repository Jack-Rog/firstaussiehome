import { Card, CardText, CardTitle } from "@/components/ui/card";

export default function AdviceEoiPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Licensed advice (coming soon)</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Not available yet. This site does not provide personal financial advice.
        </p>
      </section>
      <Card className="space-y-4">
        <CardTitle>Future workflow</CardTitle>
        <CardText>
          A future lane may involve an AFSL partner, AI-assisted draft preparation, professional review and sign-off, and optional calls. Today, this page is an expression-of-interest placeholder only.
        </CardText>
        <form className="grid gap-3">
          <input className="rounded-2xl border border-border bg-white px-4 py-3" placeholder="Name" />
          <input className="rounded-2xl border border-border bg-white px-4 py-3" placeholder="Email" />
          <input
            className="rounded-2xl border border-border bg-white px-4 py-3"
            placeholder="What would you want help with first?"
          />
          <textarea
            className="min-h-32 rounded-3xl border border-border bg-white px-4 py-3"
            placeholder="Give us a short summary of your story or situation"
          />
          <input
            className="rounded-2xl border border-border bg-white px-4 py-3"
            placeholder="How many people do you know in the same boat?"
          />
          <button className="rounded-full bg-primary px-5 py-3 font-semibold text-white" type="button">
            Register interest
          </button>
        </form>
      </Card>
    </div>
  );
}
