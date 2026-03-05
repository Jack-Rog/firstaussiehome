import { FirstHomeQuizFlow } from "@/components/quiz/first-home-quiz-flow";

export default function FirstHomeQuizPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8 md:px-6 md:py-10">
      <section className="animate-fade-up space-y-3 rounded-[1.4rem] border border-border bg-white/80 p-6 shadow-[0_12px_30px_rgba(33,47,37,0.08)]">
        <span className="inline-flex w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
          First Home Quiz
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Let&apos;s build your buying path.</h1>
      </section>
      <div className="animate-fade-up animation-delay-100">
        <FirstHomeQuizFlow />
      </div>
    </div>
  );
}
