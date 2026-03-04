"use client";

import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/src/lib/utils";
import type { CsvImportResult } from "@/src/lib/types";

const SAMPLE = `date,description,amount,category
2026-02-01,Salary,4500,income
2026-02-03,Rent,-1800,housing
2026-02-04,Woolworths,-160,groceries`;

export function CsvImportForm() {
  const [csvText, setCsvText] = useState(SAMPLE);
  const [fileName, setFileName] = useState("transactions-simple.csv");
  const [result, setResult] = useState<CsvImportResult | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
    setCsvText(await file.text());
  }

  function submit() {
    startTransition(async () => {
      const response = await fetch("/api/import/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName, csvText }),
      });
      setResult(await response.json());
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="space-y-4">
        <CardTitle>CSV bank statement import</CardTitle>
        <CardText>Upload a file or paste CSV text. MVP categorisation is rules-based and intentionally simple.</CardText>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
        <Textarea value={csvText} onChange={(event) => setCsvText(event.currentTarget.value)} />
        <Button type="button" onClick={submit}>
          Parse my CSV
        </Button>
      </Card>
      <Card className="space-y-4">
        <CardTitle>Import summary</CardTitle>
        {!result ? (
          <CardText>The parsed result will show a spending breakdown and an estimated savings capacity range.</CardText>
        ) : (
          <>
            <p className="text-sm text-foreground-soft">
              Estimated monthly capacity: {formatCurrency(result.totals.estimatedMonthlyCapacity)}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(result.categories).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-border bg-surface-muted px-3 py-2 text-sm">
                  <span className="font-medium">{key}</span>
                  <span className="block text-foreground-soft">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
