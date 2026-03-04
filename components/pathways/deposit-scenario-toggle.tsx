"use client";

import type { PathwayScenarioOption } from "@/src/lib/types";

export function DepositScenarioToggle({
  scenarios,
  onSelect,
}: {
  scenarios: PathwayScenarioOption[];
  onSelect: (id: PathwayScenarioOption["id"]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {scenarios
        .filter((scenario) => scenario.available)
        .map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
              scenario.active
                ? "bg-primary text-white"
                : "bg-surface text-foreground ring-1 ring-border"
            }`}
            onClick={() => onSelect(scenario.id)}
          >
            {scenario.label}
          </button>
        ))}
    </div>
  );
}
