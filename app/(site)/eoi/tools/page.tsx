import { ResearchIntakeForm } from "@/components/research/research-intake-form";
import { CardText, CardTitle } from "@/components/ui/card";

export default function ToolsEoiPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-8 md:px-6 md:py-10">
      <section className="animate-fade-up space-y-3 rounded-[1.4rem] border border-border bg-white/85 p-6 shadow-[0_12px_30px_rgba(33,47,37,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Tools + Support Research</p>
        <h1 className="text-4xl font-semibold tracking-tight">Help shape future tools and support</h1>
        <CardText className="max-w-3xl text-lg">
          Tell us what you are trying to solve. We use this to decide what to build next and whether low-cost human support is worth offering.
        </CardText>
      </section>

      <ResearchIntakeForm
        surface="eoi"
        title="Tell us what still feels hardest"
        intro="Give us the real problem, what you have already tried, and whether you would be open to a short follow-up chat."
      />

      <section className="animate-fade-up rounded-[1.25rem] border border-border bg-[#f7f8f4] p-5">
        <CardTitle>What happens next</CardTitle>
        <CardText className="mt-2">
          We read every response, look for repeated pain patterns, and use interview opt-ins to decide whether the next product should be software, human support, or both.
        </CardText>
      </section>
    </div>
  );
}
