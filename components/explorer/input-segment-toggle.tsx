"use client";

type InputSegmentToggleProps = {
  activeSegment: "situation" | "numbers";
  onChange: (segment: "situation" | "numbers") => void;
};

export function InputSegmentToggle({
  activeSegment,
  onChange,
}: InputSegmentToggleProps) {
  return (
    <div className="flex rounded-full border border-border bg-surface p-1">
      {(["situation", "numbers"] as const).map((segment) => {
        const isActive = activeSegment === segment;

        return (
          <button
            key={segment}
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              isActive ? "bg-primary text-white" : "text-foreground-soft"
            }`}
            onClick={() => onChange(segment)}
          >
            {segment === "situation" ? "Situation" : "Numbers"}
          </button>
        );
      })}
    </div>
  );
}
