"use client";

import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type HecsToolOutput = {
  reviewDate: string;
  annualIncome: number;
  currentBand: { threshold: number; rate: number };
  annualIllustrativeRepayment: number;
  chart: Array<{ label: string; rate: number }>;
  assumptions: string[];
  disclaimer: string;
};

export function HecsHelpVisual() {
  const [annualIncome, setAnnualIncome] = useState(78000);
  const [result, setResult] = useState<HecsToolOutput | null>(null);

  function submit() {
    startTransition(async () => {
      const response = await fetch("/api/tools/hecs-help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ annualIncome }),
      });
      setResult(await response.json());
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="space-y-4">
        <CardTitle>HELP cashflow explainer</CardTitle>
        <CardText>This visual is an educational reference only and does not model withholding instructions.</CardText>
        <label className="grid gap-2 text-sm">
          <span>Annual income</span>
          <Input
            type="number"
            value={annualIncome}
            onChange={(event) => setAnnualIncome(Number(event.currentTarget.value))}
          />
        </label>
        <Button type="button" onClick={submit}>
          Update the visual
        </Button>
      </Card>
      <Card className="space-y-4">
        <CardTitle>Illustrative output</CardTitle>
        {!result ? (
          <CardText>Use the input to see the current illustrative threshold band.</CardText>
        ) : (
          <>
            <p className="text-sm text-foreground-soft">Review date: {result.reviewDate}</p>
            <p className="text-sm text-foreground-soft">
              Current illustrative band: {result.currentBand.rate}% from ${result.currentBand.threshold.toLocaleString("en-AU")}
            </p>
            <div className="space-y-2">
              {result.chart.map((point) => (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-foreground-soft">
                    <span>{point.label}</span>
                    <span>{point.rate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${point.rate * 12}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <details className="rounded-2xl border border-border bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold text-primary">Learn more</summary>
              <p className="mt-3 text-sm text-foreground-soft">{result.disclaimer}</p>
            </details>
          </>
        )}
      </Card>
    </div>
  );
}
