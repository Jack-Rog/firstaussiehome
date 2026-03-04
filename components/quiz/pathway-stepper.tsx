"use client";

const STEPS = [
  { id: 1, label: "Qualitative" },
  { id: 2, label: "Numbers" },
  { id: 3, label: "Pathways" },
] as const;

export function PathwayStepper({
  currentStep,
  unlockedStep,
  onSelectStep,
}: {
  currentStep: 1 | 2 | 3;
  unlockedStep: 1 | 2 | 3;
  onSelectStep: (step: 1 | 2 | 3) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {STEPS.map((step) => {
        const isCurrent = currentStep === step.id;
        const isUnlocked = unlockedStep >= step.id;

        return (
          <button
            key={step.id}
            type="button"
            className={`inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isCurrent
                ? "bg-primary text-white"
                : isUnlocked
                  ? "bg-surface text-foreground ring-1 ring-border"
                  : "bg-surface-muted text-foreground-soft"
            }`}
            onClick={() => {
              if (isUnlocked) {
                onSelectStep(step.id);
              }
            }}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                isCurrent ? "bg-white/20 text-white" : "bg-white text-primary-strong"
              }`}
            >
              {step.id}
            </span>
            {step.label}
          </button>
        );
      })}
    </div>
  );
}
