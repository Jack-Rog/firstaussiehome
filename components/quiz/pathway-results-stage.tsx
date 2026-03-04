"use client";

import type { ReactNode } from "react";
import { HomeBuyingPathwayCardView } from "@/components/pathways/home-buying-pathway-card";
import { GlossaryPopover } from "@/components/ui/glossary-popover";
import type { HomeownerPathwayOutput, HomeownerPathwaySelections } from "@/src/lib/types";

function ribbonToneClass(value: string) {
  if (value.includes("upper") || value.includes("MAY")) {
    return "bg-primary/10 text-primary-strong";
  }

  if (value.includes("lower")) {
    return "bg-[#f0ece5] text-foreground";
  }

  return "bg-surface text-foreground-soft ring-1 ring-border";
}

export function PathwayResultsStage({
  output,
  selections,
  editor,
  onExpand,
  onScenarioSelect,
  onToggleSelection,
  onToggleCashOverlay,
}: {
  output: HomeownerPathwayOutput;
  selections: HomeownerPathwaySelections;
  editor: ReactNode;
  onExpand: (id: HomeownerPathwaySelections["expandedPathway"]) => void;
  onScenarioSelect: (id: HomeownerPathwaySelections["activeDepositScenario"]) => void;
  onToggleSelection: (key: "includeGuaranteeComparison" | "includeFhssConcept") => void;
  onToggleCashOverlay: () => void;
}) {
  return (
    <div className="space-y-5">
      <div data-testid="pathway-hero-summary" className="grid gap-3 md:grid-cols-3">
        {output.heroSummary.map((item) => (
          <div key={item.label} className="rounded-3xl border border-border bg-white p-4 shadow-soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">{item.label}</p>
            <p className="mt-2 text-lg font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div data-testid="comparison-ribbon" className="flex flex-wrap gap-2">
        {output.comparisonRibbon.map((item) => (
          <span
            key={item.id}
            className={`inline-flex flex-wrap items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${ribbonToneClass(item.value)}`}
          >
            <span>{item.label}</span>
            {item.glossaryTerm ? (
              <GlossaryPopover term={item.glossaryTerm.term} body={item.glossaryTerm.body}>
                {item.value}
              </GlossaryPopover>
            ) : (
              <span>{item.value}</span>
            )}
          </span>
        ))}
      </div>

      {editor}

      <div className="space-y-4">
        {output.pathways.map((pathway) => (
          <HomeBuyingPathwayCardView
            key={pathway.id}
            pathway={pathway}
            expanded={selections.expandedPathway === pathway.id}
            onToggle={() => onExpand(pathway.id)}
            onScenarioSelect={onScenarioSelect}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>

      <button
        data-testid="cash-outlay-toggle"
        type="button"
        className="fixed bottom-24 right-4 z-10 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft"
        onClick={onToggleCashOverlay}
      >
        {selections.showCashOverlay ? "Hide cash outlay" : "See cash outlay"}
      </button>
    </div>
  );
}
