"use client";

import { useState } from "react";
import { DisclosureTray } from "@/components/compliance/disclosure-tray";
import type { ExplorerSource } from "@/src/lib/types";

type DisclosureMode = "links" | "assumptions" | "reviewed" | null;

type StickyDisclosureRailProps = {
  sources: ExplorerSource[];
  assumptions: string[];
  reviewDate: string;
};

export function StickyDisclosureRail({
  sources,
  assumptions,
  reviewDate,
}: StickyDisclosureRailProps) {
  const [mode, setMode] = useState<DisclosureMode>(null);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6">
          <p className="font-semibold text-primary-strong">Factual education and modelling only</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-surface-muted px-3 py-2 font-semibold text-foreground ring-1 ring-border transition hover:bg-primary-soft"
              onClick={() => setMode("links")}
            >
              Official links
            </button>
            <button
              type="button"
              className="rounded-full bg-surface-muted px-3 py-2 font-semibold text-foreground ring-1 ring-border transition hover:bg-primary-soft"
              onClick={() => setMode("assumptions")}
            >
              Assumptions
            </button>
            <button
              type="button"
              className="rounded-full bg-surface-muted px-3 py-2 font-semibold text-foreground ring-1 ring-border transition hover:bg-primary-soft"
              onClick={() => setMode("reviewed")}
            >
              Reviewed {reviewDate}
            </button>
          </div>
        </div>
      </div>
      <DisclosureTray
        mode={mode}
        sources={sources}
        assumptions={assumptions}
        reviewDate={reviewDate}
        onClose={() => setMode(null)}
      />
    </>
  );
}
