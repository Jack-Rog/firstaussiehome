"use client";

import type { ExplorerSource } from "@/src/lib/types";

type DisclosureMode = "links" | "assumptions" | "reviewed" | null;

type DisclosureTrayProps = {
  mode: DisclosureMode;
  sources: ExplorerSource[];
  assumptions: string[];
  reviewDate: string;
  onClose: () => void;
};

export function DisclosureTray({
  mode,
  sources,
  assumptions,
  reviewDate,
  onClose,
}: DisclosureTrayProps) {
  if (!mode) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close disclosure tray"
        className="fixed inset-0 z-30 bg-black/35"
        onClick={onClose}
      />
      <div className="fixed inset-x-3 bottom-16 z-40 mx-auto flex max-h-[calc(100dvh-6.25rem)] w-auto max-w-4xl flex-col rounded-[1.25rem] border border-border bg-white p-5 shadow-2xl md:max-h-[80vh]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-primary-strong">
            {mode === "links" ? "Official links" : mode === "assumptions" ? "Assumptions" : "Reviewed"}
          </p>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-foreground-soft">
            Close
          </button>
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {mode === "links" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {sources.map((source) => (
                <div key={`${source.label}-${source.note}`} className="rounded-[1rem] border border-border bg-surface p-4">
                  {source.href ? (
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-primary"
                    >
                      {source.label}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold">{source.label}</p>
                  )}
                  <p className="mt-2 text-xs leading-6 text-foreground-soft">{source.note}</p>
                </div>
              ))}
            </div>
          ) : null}

          {mode === "assumptions" ? (
            <div className="grid gap-3">
              {assumptions.map((assumption) => (
                <div key={assumption} className="rounded-[1rem] border border-border bg-surface p-4 text-sm text-foreground-soft">
                  {assumption}
                </div>
              ))}
            </div>
          ) : null}

          {mode === "reviewed" ? (
            <div className="rounded-[1rem] border border-border bg-surface p-4">
              <p className="text-sm text-foreground-soft">
                Current source review date: <span className="font-semibold text-foreground">{reviewDate}</span>
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
