"use client";

import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/src/lib/utils";
import type { BudgetSummary } from "@/src/lib/types";

export function BudgetStarterForm() {
  const [form, setForm] = useState({
    monthlyIncome: 6200,
    fixedCosts: 2400,
    variableCosts: 1600,
    irregularAnnualCosts: 3600,
    savingsGoal: 1800,
  });
  const [result, setResult] = useState<(BudgetSummary & { disclaimer: string }) | null>(null);

  function submit() {
    startTransition(async () => {
      const response = await fetch("/api/tools/budget-starter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      setResult(await response.json());
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <CardTitle>Budget starter</CardTitle>
        <CardText>Capture a simple monthly picture and convert annual irregular costs into a steady provision.</CardText>
        {Object.entries(form).map(([key, value]) => (
          <label key={key} className="grid gap-2 text-sm">
            <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
            <Input
              type="number"
              value={value}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [key]: Number(event.currentTarget.value),
                }))
              }
            />
          </label>
        ))}
        <Button type="button" onClick={submit}>
          Build my budget view
        </Button>
      </Card>
      <Card className="space-y-4">
        <CardTitle>Checklist view</CardTitle>
        {!result ? (
          <CardText>Use the tool to see monthly totals and a checklist summary.</CardText>
        ) : (
          <>
            <p className="text-sm text-foreground-soft">
              Monthly surplus estimate: {formatCurrency(result.monthlyTotals.surplus)}
            </p>
            <ul className="space-y-2 text-sm text-foreground-soft">
              {result.exportChecklist.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <details className="rounded-2xl border border-border bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-primary">Irregular expenses checklist</summary>
              <ul className="mt-3 space-y-2 text-sm text-foreground-soft">
                {result.irregularChecklist.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </details>
          </>
        )}
      </Card>
    </div>
  );
}
