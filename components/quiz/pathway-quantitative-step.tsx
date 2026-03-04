"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type NumericDraft = {
  age: string;
  annualSalary: string;
  privateDebt: string;
  hecsDebt: string;
  currentSavings: string;
  averageMonthlyExpenses: string;
  targetPropertyPrice: string;
};

const FIELD_CONFIG: Array<{
  key: keyof NumericDraft;
  label: string;
  placeholder: string;
}> = [
  { key: "age", label: "Age", placeholder: "27" },
  { key: "annualSalary", label: "Annual salary", placeholder: "$85,000" },
  { key: "privateDebt", label: "Private debt", placeholder: "$12,000" },
  { key: "hecsDebt", label: "HECS / HELP", placeholder: "$18,000" },
  { key: "currentSavings", label: "Current savings", placeholder: "$45,000" },
  { key: "averageMonthlyExpenses", label: "Monthly expenses", placeholder: "$2,800" },
  { key: "targetPropertyPrice", label: "Desired property price", placeholder: "$780,000" },
];

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
  const canContinue = Object.values(values).every((value) => value.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {FIELD_CONFIG.map((field) => (
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
