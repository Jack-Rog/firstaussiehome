import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 w-full rounded-3xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
