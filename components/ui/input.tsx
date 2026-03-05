import type { InputHTMLAttributes } from "react";
import { cn } from "@/src/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border bg-[#f9f8f6] px-4 py-2.5 text-sm text-foreground shadow-[0_2px_10px_rgba(30,41,34,0.06)] focus:border-primary focus:bg-white focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
