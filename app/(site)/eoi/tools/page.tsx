import { Card, CardText, CardTitle } from "@/components/ui/card";

export default function ToolsEoiPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">More tools, shaped by your story</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Tell us what you want to see next and you may be first in line for free early access.
        </p>
      </section>
      <Card className="space-y-4">
        <CardTitle>What would help most?</CardTitle>
        <CardText>
          This waitlist helps us prioritise the next tools for first-home buyers who want clearer numbers.
        </CardText>
        <form className="grid gap-3">
          <input className="rounded-2xl border border-border bg-white px-4 py-3" placeholder="Name" />
          <input className="rounded-2xl border border-border bg-white px-4 py-3" placeholder="Email" />
          <input
            className="rounded-2xl border border-border bg-white px-4 py-3"
            placeholder="What do you want to see next?"
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
            Join the waitlist
          </button>
        </form>
      </Card>
    </div>
  );
}
