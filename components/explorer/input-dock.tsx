"use client";

import { InputSegmentToggle } from "@/components/explorer/input-segment-toggle";
import { Input } from "@/components/ui/input";
import type { FirstHomeExplorerInput } from "@/src/lib/types";

type InputDockProps = {
  input: FirstHomeExplorerInput;
  activeSegment: "situation" | "numbers";
  onSegmentChange: (segment: "situation" | "numbers") => void;
  onChange: <Key extends keyof FirstHomeExplorerInput>(key: Key, value: FirstHomeExplorerInput[Key]) => void;
};

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-3xl border border-border bg-white px-4 py-3 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
    </label>
  );
}

export function InputDock({
  input,
  activeSegment,
  onSegmentChange,
  onChange,
}: InputDockProps) {
  return (
    <div className="sticky top-24 space-y-4">
      <div className="rounded-[1.75rem] border border-border bg-white p-4 shadow-soft">
        <div className="grid gap-4">
          <InputSegmentToggle activeSegment={activeSegment} onChange={onSegmentChange} />

          {activeSegment === "situation" ? (
            <div className="grid gap-3">
              <ToggleRow
                label="First home buyer"
                checked={input.firstHomeBuyer}
                onChange={(value) => {
                  onChange("firstHomeBuyer", value);
                  onChange("existingProperty", !value);
                }}
              />
              <ToggleRow label="Buying in NSW first" checked={input.livingInNsw} onChange={(value) => onChange("livingInNsw", value)} />
              <ToggleRow label="New build" checked={input.buyingNewHome} onChange={(value) => onChange("buyingNewHome", value)} />
              <ToggleRow
                label="Citizen or permanent resident"
                checked={input.australianCitizenOrResident}
                onChange={(value) => onChange("australianCitizenOrResident", value)}
              />
              <label className="grid gap-2 text-sm">
                <span>Buying solo or joint</span>
                <select
                  className="rounded-3xl border border-border bg-white px-4 py-3"
                  value={input.buyingSoloOrJoint}
                  onChange={(event) => onChange("buyingSoloOrJoint", event.currentTarget.value as "solo" | "joint")}
                >
                  <option value="solo">Solo</option>
                  <option value="joint">Joint</option>
                </select>
              </label>
              <ToggleRow label="PAYG only" checked={input.paygOnly} onChange={(value) => onChange("paygOnly", value)} />
              <ToggleRow label="Dependants" checked={input.dependants} onChange={(value) => onChange("dependants", value)} />
              <ToggleRow
                label="Business income"
                checked={input.businessIncome}
                onChange={(value) => onChange("businessIncome", value)}
              />
              <ToggleRow
                label="Existing property ownership"
                checked={input.existingProperty}
                onChange={(value) => {
                  onChange("existingProperty", value);
                  onChange("firstHomeBuyer", !value);
                }}
              />
            </div>
          ) : null}

          {activeSegment === "numbers" ? (
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm">
                <span>Annual salary</span>
                <Input
                  type="number"
                  value={input.annualSalary}
                  onChange={(event) => onChange("annualSalary", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Private debt</span>
                <Input
                  type="number"
                  value={input.privateDebt}
                  onChange={(event) => onChange("privateDebt", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>HECS/HELP balance</span>
                <Input
                  type="number"
                  value={input.hecsDebt}
                  onChange={(event) => onChange("hecsDebt", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Current savings</span>
                <Input
                  type="number"
                  value={input.currentSavings}
                  onChange={(event) => onChange("currentSavings", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Average monthly expenses</span>
                <Input
                  type="number"
                  value={input.averageMonthlyExpenses}
                  onChange={(event) => onChange("averageMonthlyExpenses", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Desired property price</span>
                <Input
                  type="number"
                  value={input.targetPropertyPrice}
                  onChange={(event) => onChange("targetPropertyPrice", Number(event.currentTarget.value))}
                />
              </label>
              <details className="rounded-3xl border border-border bg-surface px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold">Advanced</summary>
                <label className="mt-3 grid gap-2 text-sm">
                  <span>Annual savings-rate assumption</span>
                  <input
                    aria-label="Annual savings-rate assumption"
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={input.annualSavingsRate}
                    onChange={(event) => onChange("annualSavingsRate", Number(event.currentTarget.value))}
                  />
                  <span className="text-xs text-foreground-soft">{input.annualSavingsRate.toFixed(1)}%</span>
                </label>
              </details>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
