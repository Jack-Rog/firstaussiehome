"use client";

import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DepositScenarioOutput } from "@/src/lib/types";
import { formatCurrency, formatPercent } from "@/src/lib/utils";

const INITIAL_INPUT = {
  targetPropertyPrice: 780000,
  currentSavings: 45000,
  annualSalary: 85000,
  privateDebt: 12000,
  hecsDebt: 18000,
  averageMonthlyExpenses: 2800,
  annualSavingsRate: 3,
};

type DepositResponse = DepositScenarioOutput & {
  disclaimer: string;
};

type DepositRunwayFormProps = {
  initialQuery?: {
    salary?: string;
    privateDebt?: string;
    hecsDebt?: string;
    savings?: string;
    expenses?: string;
    price?: string;
  };
};

function getInitialState(initialQuery?: DepositRunwayFormProps["initialQuery"]) {
  return {
    targetPropertyPrice: Number(initialQuery?.price) || INITIAL_INPUT.targetPropertyPrice,
    currentSavings: Number(initialQuery?.savings) || INITIAL_INPUT.currentSavings,
    annualSalary: Number(initialQuery?.salary) || INITIAL_INPUT.annualSalary,
    privateDebt: Number(initialQuery?.privateDebt) || INITIAL_INPUT.privateDebt,
    hecsDebt: Number(initialQuery?.hecsDebt) || INITIAL_INPUT.hecsDebt,
    averageMonthlyExpenses: Number(initialQuery?.expenses) || INITIAL_INPUT.averageMonthlyExpenses,
    annualSavingsRate: INITIAL_INPUT.annualSavingsRate,
  };
}

export function DepositRunwayForm({ initialQuery }: DepositRunwayFormProps) {
  const [form, setForm] = useState(() => getInitialState(initialQuery));
  const [result, setResult] = useState<DepositResponse | null>(null);

  useEffect(() => {
    setForm(getInitialState(initialQuery));
  }, [initialQuery]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const response = await fetch("/api/tools/deposit-runway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        return;
      }

      const next = (await response.json()) as DepositResponse;

      if (ignore) {
        return;
      }

      setResult(next);
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [form]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="space-y-5">
        <div className="space-y-2">
          <CardTitle>First-home numbers input</CardTitle>
          <CardText>
            Enter a simple snapshot and the tool will show broad first-home comparison points first. Assumption-based
            timelines stay below the factual cards.
          </CardText>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span>Annual salary</span>
            <Input
              type="number"
              value={form.annualSalary}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  annualSalary: Number(event.currentTarget.value),
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Private debt</span>
            <Input
              type="number"
              value={form.privateDebt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  privateDebt: Number(event.currentTarget.value),
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>HECS/HELP balance</span>
            <Input
              type="number"
              value={form.hecsDebt}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hecsDebt: Number(event.currentTarget.value),
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Current savings</span>
            <Input
              type="number"
              value={form.currentSavings}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  currentSavings: Number(event.currentTarget.value),
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Average monthly expenses</span>
            <Input
              type="number"
              value={form.averageMonthlyExpenses}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  averageMonthlyExpenses: Number(event.currentTarget.value),
                }))
              }
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span>Desired property price</span>
            <Input
              type="number"
              value={form.targetPropertyPrice}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  targetPropertyPrice: Number(event.currentTarget.value),
                }))
              }
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm">
          <span>Annual savings rate assumption {form.annualSavingsRate}%</span>
          <input
            aria-label="Annual savings rate"
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={form.annualSavingsRate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                annualSavingsRate: Number(event.currentTarget.value),
              }))
            }
          />
        </label>
      </Card>

      <Card className="space-y-6">
        <div className="space-y-2">
          <CardTitle>First-home numbers</CardTitle>
          <CardText>
            These figures stay descriptive. They are comparison points only and do not assess a lender, grant, or
            personal advice outcome.
          </CardText>
        </div>

        {!result ? (
          <CardText>Loading first-home numbers...</CardText>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Stamp duty</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(result.facts.indicativeStampDuty)}</p>
                <p className="mt-2 text-sm text-foreground-soft">Indicative NSW transfer duty before first-home relief.</p>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Indicative saving</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(result.facts.indicativeStampDutySaving)}</p>
                <p className="mt-2 text-sm text-foreground-soft">
                  Indicative NSW duty difference if the broad first-home rules still fit.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">5% reference deposit</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(result.facts.firstHomeGuaranteeMinimumDeposit)}</p>
                <p className="mt-2 text-sm text-foreground-soft">The 5% minimum deposit reference used in the Home Guarantee concept.</p>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Current LVR</p>
                <p className="mt-2 text-2xl font-semibold">{formatPercent(result.facts.currentLoanToValueRatio)}</p>
                <p className="mt-2 text-sm text-foreground-soft">
                  Based on the current savings entered against the target property price.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Projected DTI</p>
                <p className="mt-2 text-2xl font-semibold">{result.facts.projectedDebtToIncomeRatio.toFixed(1)}x</p>
                <p className="mt-2 text-sm text-foreground-soft">
                  Total debt divided by gross annual income, including the target home loan amount.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Debt servicing</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(result.facts.indicativeDebtServicing)}</p>
                <p className="mt-2 text-sm text-foreground-soft">Indicative monthly servicing for the modelled home loan and private debt.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-border bg-white p-4">
                <p className="text-sm font-semibold">Current deposit share</p>
                <p className="mt-2 text-lg font-semibold">{formatPercent(result.facts.currentDepositPercent)}</p>
              </div>
              <div className="rounded-3xl border border-border bg-white p-4">
                <p className="text-sm font-semibold">Indicative home-loan repayment</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(result.facts.indicativeHomeLoanRepayment)}</p>
              </div>
              <div className="rounded-3xl border border-border bg-white p-4">
                <p className="text-sm font-semibold">Estimated post-cost monthly buffer</p>
                <p className="mt-2 text-lg font-semibold">{formatCurrency(result.facts.estimatedMonthlyBuffer)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {result.infoNotes.map((note) => (
                <details key={note.id} className="rounded-3xl border border-border bg-white p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-primary">
                    <span className="flex items-center gap-2">
                      <CircleHelp className="h-4 w-4" />
                      {note.label}
                    </span>
                    <span>Learn more</span>
                  </summary>
                  <p className="mt-3 text-sm text-foreground-soft">{note.body}</p>
                </details>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Deposit target comparison</p>
              <div className="grid gap-3 md:grid-cols-3">
                {result.scenarioRows.map((row) => (
                  <div key={row.depositPercent} className="rounded-3xl border border-border bg-surface-muted p-4">
                    <p className="font-semibold">{row.depositPercent}% deposit target</p>
                    <p className="mt-2 text-sm text-foreground-soft">{formatCurrency(row.targetAmount)}</p>
                    <p className="mt-2 text-sm text-foreground-soft">
                      About {row.monthsToTarget} months ({row.yearsToTarget} years) if the same monthly gap keeps repeating.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Assumptions</p>
              <ul className="space-y-2 text-sm text-foreground-soft">
                {result.assumptions.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border bg-white p-4">
              <p className="text-sm font-semibold">Review date</p>
              <p className="mt-2 text-sm text-foreground-soft">{result.reviewDate}</p>
              <p className="mt-3 text-xs leading-6 text-foreground-soft">{result.disclaimer}</p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
