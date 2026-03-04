"use client";

import { startTransition, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Home, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { REFERENCE_LINKS } from "@/src/lib/references";
import type { OnboardingAnswers, OnboardingResult } from "@/src/lib/types";
import { formatCurrency } from "@/src/lib/utils";

const STEP_LABELS = [
  "1. Your numbers",
  "2. Broad scheme checks",
  "3. Track complexity",
] as const;

const INITIAL_FORM: OnboardingAnswers = {
  goals: ["buy-first-home"],
  payg: true,
  single: true,
  dependants: false,
  businessIncome: false,
  trusts: false,
  property: false,
  smallPortfolio: true,
  firstHomeBuyer: true,
  buyingNewHome: false,
  australianCitizenOrResident: true,
  livingInNsw: true,
  buyingSoloOrJoint: "solo",
  annualSalary: 85000,
  privateDebt: 12000,
  hecsDebt: 18000,
  currentSavings: 45000,
  averageMonthlyExpenses: 2800,
  desiredPropertyPrice: 780000,
};

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-border bg-white px-4 py-3 text-sm">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
    </label>
  );
}

export function OnboardingForm({ useAltResults }: { useAltResults: boolean }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<Key extends keyof OnboardingAnswers>(key: Key, value: OnboardingAnswers[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function goNext() {
    setStep((current) => Math.min(current + 1, STEP_LABELS.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  function submit() {
    setIsSubmitting(true);

    startTransition(async () => {
      const response = await fetch("/api/quiz/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setResult((await response.json()) as OnboardingResult);
      }

      setIsSubmitting(false);
    });
  }

  const primaryHref = useMemo(() => {
    if (!result) {
      return null;
    }

    if (result.nextPrimaryCta.href !== "/tools/deposit-runway") {
      return result.nextPrimaryCta.href;
    }

    const params = new URLSearchParams({
      salary: String(result.calculatorPrefill.annualSalary),
      privateDebt: String(result.calculatorPrefill.privateDebt),
      hecsDebt: String(result.calculatorPrefill.hecsDebt),
      savings: String(result.calculatorPrefill.currentSavings),
      expenses: String(result.calculatorPrefill.averageMonthlyExpenses),
      price: String(result.calculatorPrefill.targetPropertyPrice),
    });

    return `${result.nextPrimaryCta.href}?${params.toString()}`;
  }, [result]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <Card className="space-y-6">
        <div className="space-y-3">
          <CardTitle>Start with a short first-home pathway</CardTitle>
          <CardText>
            This walks from broad scheme checks into a simple numbers screen built for people in their first jobs.
            It stays within general information and modelling only.
          </CardText>
          <div className="grid gap-2 sm:grid-cols-3">
            {STEP_LABELS.map((label, index) => (
              <div
                key={label}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                  index === step
                    ? "border-primary bg-primary-strong text-white"
                    : index < step
                      ? "border-primary/30 bg-primary/10 text-primary-strong"
                      : "border-border bg-surface-muted text-foreground-soft"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {step === 0 ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span>Annual salary</span>
                <Input
                  type="number"
                  value={form.annualSalary}
                  onChange={(event) => updateField("annualSalary", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Current savings</span>
                <Input
                  type="number"
                  value={form.currentSavings}
                  onChange={(event) => updateField("currentSavings", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Average monthly expenses</span>
                <Input
                  type="number"
                  value={form.averageMonthlyExpenses}
                  onChange={(event) => updateField("averageMonthlyExpenses", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Desired property price</span>
                <Input
                  type="number"
                  value={form.desiredPropertyPrice}
                  onChange={(event) => updateField("desiredPropertyPrice", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>Private debt</span>
                <Input
                  type="number"
                  value={form.privateDebt}
                  onChange={(event) => updateField("privateDebt", Number(event.currentTarget.value))}
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span>HECS/HELP balance</span>
                <Input
                  type="number"
                  value={form.hecsDebt}
                  onChange={(event) => updateField("hecsDebt", Number(event.currentTarget.value))}
                />
              </label>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm font-semibold text-primary-strong">What happens next</p>
              <p className="mt-2 text-sm text-foreground-soft">
                The next step checks broad NSW and federal first-home indicators, then the calculator turns your
                numbers into factual comparison points like deposit, LVR, duty, and DTI.
              </p>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="grid gap-3">
              <ToggleField
                label="I have not owned property before"
                checked={form.firstHomeBuyer}
                onChange={(checked) => {
                  updateField("firstHomeBuyer", checked);
                  updateField("property", !checked);
                }}
              />
              <ToggleField
                label="I am an Australian citizen or permanent resident"
                checked={form.australianCitizenOrResident}
                onChange={(checked) => updateField("australianCitizenOrResident", checked)}
              />
              <ToggleField
                label="I plan to buy in NSW first"
                checked={form.livingInNsw}
                onChange={(checked) => updateField("livingInNsw", checked)}
              />
              <ToggleField
                label="I am looking at a new build"
                checked={form.buyingNewHome}
                onChange={(checked) => updateField("buyingNewHome", checked)}
              />
              <label className="grid gap-2 text-sm">
                <span>Buying solo or joint?</span>
                <select
                  className="rounded-2xl border border-border bg-white px-4 py-3"
                  value={form.buyingSoloOrJoint}
                  onChange={(event) =>
                    updateField("buyingSoloOrJoint", event.currentTarget.value as OnboardingAnswers["buyingSoloOrJoint"])
                  }
                >
                  <option value="solo">Solo</option>
                  <option value="joint">Joint</option>
                </select>
              </label>
            </div>
            <div className="rounded-3xl border border-border bg-surface-muted p-5">
              <p className="text-sm font-semibold">This screen only gives a broad fit check</p>
              <p className="mt-2 text-sm text-foreground-soft">
                Any outcome here is still a “may be eligible” signal. The linked government pages remain the source
                of truth for price caps, occupancy rules, and updated criteria.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleField label="PAYG income only" checked={form.payg} onChange={(checked) => updateField("payg", checked)} />
              <ToggleField label="Single applicant" checked={form.single} onChange={(checked) => updateField("single", checked)} />
              <ToggleField
                label="No dependants"
                checked={!form.dependants}
                onChange={(checked) => updateField("dependants", !checked)}
              />
              <ToggleField
                label="No business income"
                checked={!form.businessIncome}
                onChange={(checked) => updateField("businessIncome", !checked)}
              />
              <ToggleField label="No trusts" checked={!form.trusts} onChange={(checked) => updateField("trusts", !checked)} />
              <ToggleField
                label="Small or no investment portfolio"
                checked={form.smallPortfolio}
                onChange={(checked) => updateField("smallPortfolio", checked)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-border bg-white p-4">
                <Wallet className="text-primary" />
                <p className="mt-3 text-sm font-semibold">Tier 1 now</p>
                <p className="mt-2 text-sm text-foreground-soft">Broad scheme fit and first-home facts.</p>
              </div>
              <div className="rounded-3xl border border-border bg-white p-4">
                <Home className="text-primary" />
                <p className="mt-3 text-sm font-semibold">Tier 2 next</p>
                <p className="mt-2 text-sm text-foreground-soft">Deeper modelling if you want CSV-based cashflow.</p>
              </div>
              <div className="rounded-3xl border border-border bg-white p-4">
                <ShieldCheck className="text-primary" />
                <p className="mt-3 text-sm font-semibold">Tier 3 later</p>
                <p className="mt-2 text-sm text-foreground-soft">Licensed advice is a future lane only.</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={goBack}>
              <ChevronLeft size={16} />
              Back
            </Button>
          ) : null}

          {step < STEP_LABELS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Next
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? "Working..." : "Check my broad fit"}
            </Button>
          )}
        </div>
      </Card>

      <Card className={useAltResults ? "bg-primary-strong text-white" : ""}>
        <CardTitle className={useAltResults ? "text-white" : ""}>Your pathway result</CardTitle>
        {!result ? (
          <div className="space-y-4">
            <CardText className={useAltResults ? "text-white/80" : ""}>
              You will see a broad scheme fit signal, the official links to verify it, and the clearest next step for
              the tier sequence.
            </CardText>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className={`text-sm font-semibold ${useAltResults ? "text-white" : "text-primary-strong"}`}>
                Built for first-job buyers
              </p>
              <p className={`mt-2 text-sm ${useAltResults ? "text-white/80" : "text-foreground-soft"}`}>
                Example starting point: {formatCurrency(form.currentSavings)} saved toward a{" "}
                {formatCurrency(form.desiredPropertyPrice)} target on a {formatCurrency(form.annualSalary)} salary.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    result.mayBeEligible
                      ? useAltResults
                        ? "bg-white/15 text-white"
                        : "bg-primary/10 text-primary-strong"
                      : useAltResults
                        ? "bg-white/15 text-white"
                        : "bg-surface-muted text-foreground-soft"
                  }`}
                >
                  {result.mayBeEligible ? "May be eligible" : "Broader check needed"}
                </span>
                {result.needsManualCheck ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      useAltResults ? "bg-white/15 text-white" : "bg-surface-muted text-foreground-soft"
                    }`}
                  >
                    Manual check still needed
                  </span>
                ) : null}
              </div>
              <p className={`mt-3 text-sm ${useAltResults ? "text-white/90" : "text-foreground-soft"}`}>
                {result.schemeSummary}
              </p>
            </div>

            <div className="space-y-2">
              <p className={`text-sm font-semibold ${useAltResults ? "text-white" : ""}`}>Official checks</p>
              <div className="space-y-2">
                {result.officialLinks.map((key) => (
                  <a
                    key={key}
                    href={REFERENCE_LINKS[key].href}
                    target="_blank"
                    rel="noreferrer"
                    className={`block text-sm font-semibold ${useAltResults ? "text-white" : "text-primary"}`}
                  >
                    {REFERENCE_LINKS[key].label}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className={`text-sm font-semibold ${useAltResults ? "text-white" : ""}`}>What to keep in mind</p>
              <ul className={`space-y-2 text-sm ${useAltResults ? "text-white/90" : "text-foreground-soft"}`}>
                {result.readinessChecklist.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {result.tierJourney.map((item) => (
                <div
                  key={item.tier}
                  className={`rounded-3xl border p-4 ${
                    useAltResults ? "border-white/10 bg-white/5" : "border-border bg-surface-muted"
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${useAltResults ? "text-white/70" : "text-primary-strong"}`}>
                    {item.tier} {item.status === "now" ? "Now" : item.status === "next" ? "Next" : "Later"}
                  </p>
                  <p className={`mt-2 text-sm font-semibold ${useAltResults ? "text-white" : ""}`}>{item.title}</p>
                  <p className={`mt-2 text-sm ${useAltResults ? "text-white/80" : "text-foreground-soft"}`}>{item.summary}</p>
                </div>
              ))}
            </div>

            {primaryHref ? (
              <Link
                href={primaryHref}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold ${
                  useAltResults ? "bg-white text-primary-strong" : "bg-primary text-white"
                }`}
              >
                {result.nextPrimaryCta.label}
                <ArrowRight size={16} />
              </Link>
            ) : null}

            <p className={`text-xs leading-6 ${useAltResults ? "text-white/70" : "text-foreground-soft"}`}>
              {result.disclaimer}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
