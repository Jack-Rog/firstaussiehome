"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { DepositScenarioToggle } from "@/components/pathways/deposit-scenario-toggle";
import { GlossaryPopover } from "@/components/ui/glossary-popover";
import { REFERENCE_LINKS } from "@/src/lib/references";
import type { HomeBuyingPathwayCard, HomeownerPathwaySelections } from "@/src/lib/types";
import { formatCurrency } from "@/src/lib/utils";

function eligibilityClasses(tone: HomeBuyingPathwayCard["eligibilityState"]["tone"]) {
  if (tone === "positive") {
    return "bg-primary/10 text-primary-strong";
  }

  if (tone === "negative") {
    return "bg-[#f6e4de] text-[#8e4a38]";
  }

  return "bg-[#e3e7e1] text-[#485548]";
}

function metricToneClass(tone?: "positive" | "neutral" | "warning") {
  if (tone === "positive") {
    return "text-primary-strong";
  }

  if (tone === "warning") {
    return "text-[#8e4a38]";
  }

  return "text-foreground";
}

export function HomeBuyingPathwayCardView({
  pathway,
  expanded,
  onToggle,
  onScenarioSelect,
  onToggleSelection,
}: {
  pathway: HomeBuyingPathwayCard;
  expanded: boolean;
  onToggle: () => void;
  onScenarioSelect: (id: HomeownerPathwaySelections["activeDepositScenario"]) => void;
  onToggleSelection: (key: "includeGuaranteeComparison" | "includeFhssConcept") => void;
}) {
  return (
    <section
      id={`pathway-${pathway.id}`}
      data-testid={`pathway-${pathway.id}`}
      className="rounded-[1.75rem] border border-border bg-white shadow-soft"
    >
      <button
        data-testid={`pathway-toggle-${pathway.id}`}
        type="button"
        className="flex w-full items-center gap-4 p-5 text-left"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{pathway.label}</p>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${eligibilityClasses(pathway.eligibilityState.tone)}`}>
              {pathway.eligibilityState.label}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <p className={`text-xl font-semibold ${metricToneClass(pathway.headlineStatus)}`}>{pathway.headlineValue}</p>
            <div className="min-w-[7rem] flex-1">
              <div className="h-2 rounded-full bg-surface-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${Math.max(8, Math.min(pathway.microVisual.value, 100))}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-medium text-foreground-soft">{pathway.microVisual.label}</p>
            </div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-border px-5 py-5">
          {pathway.scenarioOptions ? (
            <DepositScenarioToggle scenarios={pathway.scenarioOptions} onSelect={onScenarioSelect} />
          ) : null}

          {pathway.nestedToggles ? (
            <div className="flex flex-wrap gap-2">
              {pathway.nestedToggles.map((toggle, index) => (
                <button
                  key={`${pathway.id}-toggle-${toggle.id}-${index}`}
                  type="button"
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    toggle.active
                      ? "bg-primary/10 text-primary-strong"
                      : "bg-surface text-foreground-soft ring-1 ring-border"
                  }`}
                  onClick={() => onToggleSelection(toggle.id)}
                >
                  {toggle.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {pathway.metrics.map((metric, index) => (
              <div
                key={`${pathway.id}-metric-${metric.id}-${index}`}
                className="rounded-3xl border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">
                    {metric.label}
                  </p>
                  {metric.glossaryTerm ? (
                    <GlossaryPopover term={metric.glossaryTerm.term} body={metric.glossaryTerm.body} />
                  ) : null}
                  {metric.href ? (
                    <a
                      href={metric.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
                    >
                      Link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
                <p className={`mt-2 text-sm font-semibold ${metricToneClass(metric.tone)}`}>{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {pathway.statusChips.map((chip, index) => (
              <span
                key={`${pathway.id}-chip-${index}-${chip}`}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground-soft ring-1 ring-border"
              >
                {chip}
              </span>
            ))}
            {pathway.officialLinks.map((key, index) => (
              <a
                key={`${pathway.id}-link-${index}-${key}`}
                href={REFERENCE_LINKS[key].href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-strong"
              >
                {REFERENCE_LINKS[key].label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>

          {pathway.id === "deposit" && pathway.scenarioOptions ? (
            <div className="rounded-3xl border border-border bg-[#f5f7f1] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">Selected deposit path</p>
              {pathway.scenarioOptions
                .filter((scenario) => scenario.active)
                .map((scenario) => (
                  <div key={`${pathway.id}-selected-${scenario.id}`} className="mt-3 grid gap-2 text-sm font-semibold md:grid-cols-4">
                    <span>{formatCurrency(scenario.depositAmount)}</span>
                    <span>{formatCurrency(scenario.mortgageAmount)}</span>
                    <span>{scenario.timeToSaveMonths} months</span>
                    <span>{scenario.estimatedPayoffYears} years</span>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
