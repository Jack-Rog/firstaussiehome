"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatCurrencyInput } from "@/src/lib/utils";

type NumericDraft = {
  currentSavings: string;
  targetPropertyPrice: string;
  actHouseholdIncome: string;
};

const FIELD_CONFIG: Array<{
  key: keyof NumericDraft;
  label: string;
  placeholder: string;
}> = [
  { key: "currentSavings", label: "Current savings", placeholder: "$45,000" },
  { key: "targetPropertyPrice", label: "Desired property price", placeholder: "$780,000" },
  {
    key: "actHouseholdIncome",
    label: "ACT household income (if buying in ACT)",
    placeholder: "$120,000",
  },
];
const TARGET_PRICE_SLIDER_MIN = 200000;
const TARGET_PRICE_SLIDER_MAX = 2500000;
const TARGET_PRICE_SLIDER_STEP = 5000;

export function PathwayQuantitativeStep({
  values,
  onChange,
  onBlur,
  onContinue,
}: {
  values: NumericDraft;
  onChange: (key: keyof NumericDraft, value: string) => void;
  onBlur: (key: keyof NumericDraft) => void;
  onContinue: () => void;
}) {
  const visibleFields = FIELD_CONFIG;
  const canContinue = visibleFields.every((field) => values[field.key].trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {visibleFields.map((field) => (
          <Card key={field.key} className="bg-white/90 p-5">
            <label className="grid gap-2 text-sm font-semibold">
              <span>{field.label}</span>
              <Input
                data-testid={`quant-${field.key}`}
                type="text"
                inputMode="numeric"
                placeholder={field.placeholder}
                className="placeholder:text-[#889087]"
                value={values[field.key]}
                onChange={(event) => onChange(field.key, event.currentTarget.value)}
                onBlur={() => onBlur(field.key)}
              />
              {field.key === "targetPropertyPrice" ? (
                <div className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-soft">
                    <span>{formatCurrency(TARGET_PRICE_SLIDER_MIN)}</span>
                    <span>Slide to compare duty outcomes</span>
                    <span>{formatCurrency(TARGET_PRICE_SLIDER_MAX)}</span>
                  </div>
                  <input
                    data-testid="quant-targetPropertyPrice-slider"
                    type="range"
                    min={TARGET_PRICE_SLIDER_MIN}
                    max={TARGET_PRICE_SLIDER_MAX}
                    step={TARGET_PRICE_SLIDER_STEP}
                    value={Math.min(
                      TARGET_PRICE_SLIDER_MAX,
                      Math.max(
                        TARGET_PRICE_SLIDER_MIN,
                        Number(values.targetPropertyPrice.replace(/[^0-9]/g, "") || TARGET_PRICE_SLIDER_MIN),
                      ),
                    )}
                    onChange={(event) => onChange(field.key, formatCurrencyInput(Number(event.currentTarget.value)))}
                    className="mt-3 w-full accent-primary"
                  />
                </div>
              ) : null}
            </label>
          </Card>
        ))}
      </div>

      <Button data-testid="quant-continue" type="button" onClick={onContinue} disabled={!canContinue}>
        Continue
      </Button>
    </div>
  );
}
