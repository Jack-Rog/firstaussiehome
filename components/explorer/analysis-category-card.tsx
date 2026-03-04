"use client";

import { ChevronDown } from "lucide-react";
import type { ExplorerCategory } from "@/src/lib/types";

type AnalysisCategoryCardProps = {
  category: ExplorerCategory;
  expanded: boolean;
  onToggle: () => void;
};

function toneClass(tone: ExplorerCategory["headlineStatus"]) {
  if (tone === "positive") {
    return "text-primary-strong";
  }

  if (tone === "watch") {
    return "text-amber-700";
  }

  if (tone === "caution") {
    return "text-rose-700";
  }

  return "text-foreground";
}

export function AnalysisCategoryCard({
  category,
  expanded,
  onToggle,
}: AnalysisCategoryCardProps) {
  return (
    <section
      id={category.id}
      data-testid={`category-${category.id}`}
      className="rounded-[1.75rem] border border-border bg-white shadow-soft"
    >
      <button
        type="button"
        className="flex w-full items-center gap-4 p-5 text-left"
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{category.label}</p>
            {category.statusChips.slice(0, 2).map((chip, index) => (
              <span
                key={`${category.id}-preview-chip-${index}-${chip}`}
                className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground-soft"
              >
                {chip}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-foreground-soft">{category.subtitle}</p>
          <div className="mt-3 flex items-center gap-4">
            <p className={`text-xl font-semibold ${toneClass(category.headlineStatus)}`}>{category.headlineValue}</p>
            <div className="min-w-[7rem] flex-1">
              <div className="h-2 rounded-full bg-surface">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-200"
                  style={{ width: `${Math.max(8, Math.min(category.microVisual.value, 100))}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] font-medium text-foreground-soft">{category.microVisual.label}</p>
            </div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 transition ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded ? (
        <div className="border-t border-border px-5 py-5">
          <div className="grid gap-3 md:grid-cols-2">
            {category.expandedMetrics.map((metric) => (
              <div key={`${category.id}-${metric.label}`} className="rounded-3xl border border-border bg-surface p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">{metric.label}</p>
                <p className={`mt-2 text-sm font-semibold ${metric.tone ? toneClass(metric.tone) : ""}`}>{metric.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {category.statusChips.map((chip, index) => (
              <span
                key={`${category.id}-chip-${index}-${chip}`}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-strong"
              >
                {chip}
              </span>
            ))}
            {category.detailNotes.map((note, index) => (
              <span
                key={`${category.id}-detail-${index}-${note}`}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-foreground-soft ring-1 ring-border"
              >
                {note}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
