import { FirstHomeQuizFlow } from "@/components/quiz/first-home-quiz-flow";

export default function FirstHomeQuizPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <section className="space-y-3">
        <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
          First Home Quiz
        </span>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Let&apos;s build your buying path.</h1>
      </section>
      <FirstHomeQuizFlow />
    </div>
  );
}
