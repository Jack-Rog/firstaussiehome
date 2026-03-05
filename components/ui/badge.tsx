import type { HTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong",
        className,
      )}
      {...props}
    />
  );
}
