"use client";

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function GlossaryPopover({
  term,
  body,
  className,
  children,
}: {
  term: string;
  body: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <details className={cn("relative inline-block", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-1 text-primary underline underline-offset-4">
        <span>{children ?? term}</span>
        <CircleHelp className="h-3.5 w-3.5" />
      </summary>
      <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-3xl border border-border bg-white p-4 text-xs leading-6 text-foreground-soft shadow-soft">
        <p className="font-semibold text-foreground">{term}</p>
        <p className="mt-2">{body}</p>
      </div>
    </details>
  );
}
