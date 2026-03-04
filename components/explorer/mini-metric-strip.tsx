"use client";

import type { FirstHomeExplorerOutput } from "@/src/lib/types";

export function MiniMetricStrip({
  summary,
}: {
  summary: FirstHomeExplorerOutput["summary"];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {summary.map((item) => (
        <div
          key={item.label}
          data-testid={`summary-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="rounded-3xl border border-border bg-white p-4 shadow-soft"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">{item.label}</p>
          <p className="mt-2 text-lg font-semibold">{item.value}</p>
          <p className="mt-2 text-xs text-foreground-soft">{item.context}</p>
        </div>
      ))}
    </div>
  );
}
