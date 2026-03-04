"use client";

import { startTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import type { ReferenceLink } from "@/src/lib/references";
import type { SchemeScreeningResult } from "@/src/lib/types";

export function SchemesQuiz({
  references,
}: {
  references: Record<string, ReferenceLink>;
}) {
  const [result, setResult] = useState<SchemeScreeningResult | null>(null);
  const [form, setForm] = useState({
    firstHomeBuyer: true,
    buyingNewHome: false,
    australianCitizenOrResident: true,
    livingInNsw: true,
    buyingSoloOrJoint: "solo",
  });

  function submit() {
    startTransition(async () => {
      const response = await fetch("/api/quiz/schemes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      setResult((await response.json()) as SchemeScreeningResult);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="space-y-5">
        <CardTitle>Scheme awareness screening (NSW)</CardTitle>
        <CardText>
          This screening uses broad indicators only and returns “may be eligible” style language.
        </CardText>
        <div className="grid gap-3">
          {Object.entries(form).map(([key, value]) =>
            key === "buyingSoloOrJoint" ? (
              <label key={key} className="grid gap-2 text-sm">
                <span>Buying solo or joint?</span>
                <select
                  className="rounded-2xl border border-border bg-white px-4 py-3"
                  value={typeof value === "string" ? value : "solo"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      buyingSoloOrJoint: event.currentTarget.value,
                    }))
                  }
                >
                  <option value="solo">Solo</option>
                  <option value="joint">Joint</option>
                </select>
              </label>
            ) : (
              <label
                key={key}
                className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 text-sm"
              >
                <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [key]: event.currentTarget.checked,
                    }))
                  }
                />
              </label>
            ),
          )}
        </div>
        <Button type="button" onClick={submit}>
          Check broad indicators
        </Button>
      </Card>
      <Card className="space-y-4">
        <CardTitle>Result</CardTitle>
        {!result ? (
          <CardText>Your result will list broad indicators, assumptions, and official links.</CardText>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary-strong">{result.summary}</p>
            <p className="text-sm text-foreground-soft">
              {result.mayBeEligible ? "May be eligible" : "Needs more checking"}
            </p>
            <ul className="space-y-2 text-sm text-foreground-soft">
              {result.assumptions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <div className="space-y-2 text-sm">
              {result.officialLinks.map((key) => (
                <a
                  key={key}
                  href={references[key].href}
                  className="block font-semibold text-primary"
                  target="_blank"
                  rel="noreferrer"
                >
                  {references[key].label}
                </a>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
