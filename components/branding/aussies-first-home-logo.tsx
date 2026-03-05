import { Home } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function AussiesFirstHomeLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-[0_10px_24px_rgba(74,124,89,0.34)]">
        <Home className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact ? (
        <div>
          <p className="text-base font-semibold tracking-tight text-primary">First Aussie Home</p>
          <p className="text-xs text-foreground-soft">First Aussie Home</p>
        </div>
      ) : null}
    </div>
  );
}
