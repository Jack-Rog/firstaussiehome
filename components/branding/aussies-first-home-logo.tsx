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
      <span className="relative flex h-12 w-12 items-center justify-center rounded-[1.6rem] bg-[radial-gradient(circle_at_30%_30%,#9fd0a1,_#406b43_72%)] shadow-soft">
        <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
          <path
            d="M11 31c4-6 9-9 14-9 4 0 8 2 12 6"
            fill="none"
            stroke="#f8f5ee"
            strokeLinecap="round"
            strokeWidth="3.5"
          />
          <circle cx="13" cy="31" r="3.2" fill="#f8f5ee" />
          <circle cx="24" cy="24" r="3.2" fill="#f8f5ee" />
          <circle cx="35" cy="29" r="3.2" fill="#f8f5ee" />
          <path
            d="M27 12c4 0 7 2 8 6-4 1-8-1-10-4"
            fill="none"
            stroke="#d7ebd6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        </svg>
      </span>
      {!compact ? (
        <div>
          <p className="text-base font-semibold tracking-tight text-foreground">Aussies First Home</p>
          <p className="text-xs text-foreground-soft">A calmer way to see what buying your first home can cost.</p>
        </div>
      ) : null}
    </div>
  );
}
