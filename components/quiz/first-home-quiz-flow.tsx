"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useDisclosure } from "@/components/compliance/disclosure-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildHomeownerPathwayOutput,
  DEFAULT_HOMEOWNER_PATHWAY_INPUT,
  DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
} from "@/src/lib/analysis/homeowner-pathway-analysis";
import {
  HOMEOWNER_DASHBOARD_STORAGE_KEY,
  type HomeownerDashboardSnapshot,
} from "@/src/lib/homeowner-dashboard-storage";
import type { HomeownerPathwayInput, HomeownerPathwaySelections } from "@/src/lib/types";
import {
  annualiseAmount,
  type Frequency,
  formatCurrencyInput,
  monthlyiseAmount,
  parseMoneyInput,
} from "@/src/lib/utils";

type Stage = "qualitative" | "quantitative" | "account";

type QualitativeQuestionId =
  | "firstHomeBuyer"
  | "withoutOtherProperty"
  | "homeState"
  | "australianCitizenOrResident"
  | "withoutDependants"
  | "paygOnly"
  | "withoutBusinessTrustIncome"
  | "buyingArea"
  | "existingHome";

type QuantitativeQuestionId =
  | "age"
  | "annualSalary"
  | "privateDebt"
  | "hecsDebt"
  | "currentSavings"
  | "averageMonthlyExpenses"
  | "targetPropertyPrice";

type BooleanQuestion = {
  type: "boolean";
  id: Exclude<QualitativeQuestionId, "buyingArea">;
  prompt: string;
  applyYes: (current: HomeownerPathwayInput) => HomeownerPathwayInput;
  applyNo: (current: HomeownerPathwayInput) => HomeownerPathwayInput;
};

type ChoiceQuestion = {
  type: "choice";
  id: "homeState" | "buyingArea";
  prompt: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  applyChoice: (current: HomeownerPathwayInput, next: string) => HomeownerPathwayInput;
};

type QualitativeQuestion = BooleanQuestion | ChoiceQuestion;

type QuantitativeQuestion = {
  id: QuantitativeQuestionId;
  label: string;
  placeholder: string;
  frequencyKey?: "income" | "expense";
};

type QuantitativeBatch = {
  title: string;
  fields: QuantitativeQuestion[];
};

const QUIZ_STORAGE_KEY = "aussiesfirsthome:first-home-quiz";

const QUALITATIVE_GROUPS: Array<{
  title: string;
  questions: QualitativeQuestion[];
}> = [
  {
    title: "A bit about you",
    questions: [
      {
        type: "boolean",
        id: "firstHomeBuyer",
        prompt: "Is this your first home?",
        applyYes: (current) => ({ ...current, firstHomeBuyer: true, existingProperty: false }),
        applyNo: (current) => ({ ...current, firstHomeBuyer: false }),
      },
      {
        type: "boolean",
        id: "withoutOtherProperty",
        prompt: "Are you buying without any other properties?",
        applyYes: (current) => ({ ...current, existingProperty: false, firstHomeBuyer: true }),
        applyNo: (current) => ({ ...current, existingProperty: true, firstHomeBuyer: false }),
      },
      {
        type: "choice",
        id: "homeState",
        prompt: "Which state or territory are you buying in?",
        options: [
          { value: "nsw", label: "NSW" },
          { value: "vic", label: "VIC" },
          { value: "qld", label: "QLD" },
          { value: "wa", label: "WA" },
          { value: "sa", label: "SA" },
          { value: "tas", label: "TAS" },
          { value: "act", label: "ACT" },
          { value: "nt", label: "NT" },
        ],
        applyChoice: (current, next) => ({
          ...current,
          homeState: next as HomeownerPathwayInput["homeState"],
          livingInNsw: next === "nsw",
        }),
      },
      {
        type: "choice",
        id: "buyingArea",
        prompt: "Is the property in a state capital or outside one?",
        options: [
          { value: "state-capital", label: "State capital" },
          { value: "regional", label: "Regional / non-capital" },
        ],
        applyChoice: (current, next) => ({
          ...current,
          buyingArea: next as HomeownerPathwayInput["buyingArea"],
        }),
      },
    ],
  },
  {
    title: "The basics",
    questions: [
      {
        type: "boolean",
        id: "australianCitizenOrResident",
        prompt: "Are you an Australian citizen or permanent resident?",
        applyYes: (current) => ({ ...current, australianCitizenOrResident: true }),
        applyNo: (current) => ({ ...current, australianCitizenOrResident: false }),
      },
      {
        type: "boolean",
        id: "withoutDependants",
        prompt: "Are you buying without dependants?",
        applyYes: (current) => ({ ...current, dependants: false }),
        applyNo: (current) => ({ ...current, dependants: true }),
      },
    ],
  },
  {
    title: "Income shape",
    questions: [
      {
        type: "boolean",
        id: "paygOnly",
        prompt: "Is your income PAYG income only?",
        applyYes: (current) => ({ ...current, paygOnly: true }),
        applyNo: (current) => ({ ...current, paygOnly: false }),
      },
      {
        type: "boolean",
        id: "withoutBusinessTrustIncome",
        prompt: "Are you buying without business or trust income?",
        applyYes: (current) => ({ ...current, businessIncome: false }),
        applyNo: (current) => ({ ...current, businessIncome: true }),
      },
      {
        type: "boolean",
        id: "existingHome",
        prompt: "Are you buying an existing home?",
        applyYes: (current) => ({ ...current, buyingNewHome: false }),
        applyNo: (current) => ({ ...current, buyingNewHome: true }),
      },
    ],
  },
];

const QUANTITATIVE_BATCHES: QuantitativeBatch[] = [
  {
    title: "Batch 1: Age, income, and expenses",
    fields: [
      { id: "age", label: "How old are you?", placeholder: "Age" },
      { id: "annualSalary", label: "What is your before-tax income?", placeholder: "$60,000", frequencyKey: "income" },
      {
        id: "averageMonthlyExpenses",
        label: "What are your expected expenses?",
        placeholder: "Weekly/Monthly/Annual Expenses",
        frequencyKey: "expense",
      },
    ],
  },
  {
    title: "Batch 2: Savings and current debt",
    fields: [
      { id: "currentSavings", label: "How much do you already have saved?", placeholder: "$10,000" },
      { id: "privateDebt", label: "How much private debt do you have?", placeholder: "$10,000" },
      { id: "hecsDebt", label: "How much HECS / HELP debt do you have?", placeholder: "$10,000" },
    ],
  },
  {
    title: "Batch 3: Target property",
    fields: [{ id: "targetPropertyPrice", label: "What price are you aiming to buy at?", placeholder: "$1,000,000" }],
  },
];

function buildDefaultSelections(input: HomeownerPathwayInput): HomeownerPathwaySelections {
  const preview = buildHomeownerPathwayOutput(input, {
    ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
    includeGuaranteeComparison: true,
    includeFhssConcept: true,
    activeDepositScenario: "baseline-20",
  });
  const helpToBuy = preview.schemeStatuses.find((status) => status.id === "help-to-buy");
  const guarantee = preview.schemeStatuses.find((status) => status.id === "guarantee");

  return {
    ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
    includeGuaranteeComparison: true,
    includeFhssConcept: true,
    activeDepositScenario:
      helpToBuy?.state === "available" || helpToBuy?.state === "active"
        ? "shared-equity-2"
        : guarantee?.state === "available" || guarantee?.state === "active"
          ? "guarantee-5"
          : "baseline-20",
    expandedPathway: "deposit",
  };
}

function applyDisplayValue(
  current: HomeownerPathwayInput,
  field: QuantitativeQuestionId,
  displayValue: string,
  incomeFrequency: Frequency,
  expenseFrequency: Frequency,
) {
  if (field === "age") {
    return {
      ...current,
      age: Number(displayValue.replace(/[^0-9]/g, "") || "0"),
    };
  }

  const parsed = parseMoneyInput(displayValue);

  if (field === "annualSalary") {
    return {
      ...current,
      annualSalary: annualiseAmount(parsed, incomeFrequency),
    };
  }

  if (field === "averageMonthlyExpenses") {
    return {
      ...current,
      averageMonthlyExpenses: monthlyiseAmount(parsed, expenseFrequency),
    };
  }

  return {
    ...current,
    [field]: parsed,
  };
}

function formatLiveValue(field: QuantitativeQuestionId, raw: string) {
  if (field === "age") {
    return raw.replace(/[^0-9]/g, "");
  }

  const parsed = parseMoneyInput(raw);
  return raw.trim().length === 0 ? "" : formatCurrencyInput(parsed);
}

function expensePlaceholderForFrequency(frequency: Frequency) {
  if (frequency === "weekly") {
    return "Weekly Expenses";
  }

  if (frequency === "annually") {
    return "Annual Expenses";
  }

  return "Monthly Expenses";
}

export function FirstHomeQuizFlow() {
  const router = useRouter();
  const { setDisclosure } = useDisclosure();
  const [stage, setStage] = useState<Stage>("qualitative");
  const [qualitativeGroupIndex, setQualitativeGroupIndex] = useState(0);
  const [quantitativeBatchIndex, setQuantitativeBatchIndex] = useState(0);
  const [input, setInput] = useState<HomeownerPathwayInput>({
    ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
    livingInNsw: true,
  });
  const [qualitativeAnswers, setQualitativeAnswers] = useState<Partial<Record<QualitativeQuestionId, boolean | string>>>({});
  const [incomeFrequency, setIncomeFrequency] = useState<Frequency>("annually");
  const [expenseFrequency, setExpenseFrequency] = useState<Frequency>("monthly");
  const [quantitativeDisplay, setQuantitativeDisplay] = useState<Record<QuantitativeQuestionId, string>>({
    age: "",
    annualSalary: "",
    privateDebt: "",
    hecsDebt: "",
    currentSavings: "",
    averageMonthlyExpenses: "",
    targetPropertyPrice: "",
  });
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountStory, setAccountStory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewSelections = useMemo(() => buildDefaultSelections(input), [input]);
  const preview = useMemo(() => buildHomeownerPathwayOutput(input, previewSelections), [input, previewSelections]);

  useEffect(() => {
    setDisclosure({
      sources: preview.sources,
      assumptions: preview.assumptions,
      reviewDate: preview.reviewDate,
    });
  }, [preview, setDisclosure]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const saved = JSON.parse(raw) as {
        stage?: Stage;
        qualitativeGroupIndex?: number;
        quantitativeBatchIndex?: number;
        quantitativeIndex?: number;
        input?: HomeownerPathwayInput;
        qualitativeAnswers?: Partial<Record<QualitativeQuestionId, boolean | string>>;
        incomeFrequency?: Frequency;
        expenseFrequency?: Frequency;
        quantitativeDisplay?: Record<QuantitativeQuestionId, string>;
        accountName?: string;
        accountEmail?: string;
        accountStory?: string;
      };

      if (saved.stage) {
        setStage(saved.stage);
      }
      if (typeof saved.qualitativeGroupIndex === "number") {
        setQualitativeGroupIndex(saved.qualitativeGroupIndex);
      }
      if (typeof saved.quantitativeBatchIndex === "number") {
        setQuantitativeBatchIndex(saved.quantitativeBatchIndex);
      } else if (typeof saved.quantitativeIndex === "number") {
        if (saved.quantitativeIndex <= 2) {
          setQuantitativeBatchIndex(0);
        } else if (saved.quantitativeIndex <= 5) {
          setQuantitativeBatchIndex(1);
        } else {
          setQuantitativeBatchIndex(2);
        }
      }
      if (saved.input) {
        const savedHomeState = saved.input.homeState ?? (saved.input.livingInNsw === false ? "vic" : "nsw");
        setInput({
          ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
          ...saved.input,
          homeState: savedHomeState,
          livingInNsw: savedHomeState === "nsw",
        });
      }
      if (saved.qualitativeAnswers) {
        setQualitativeAnswers(saved.qualitativeAnswers);
      }
      if (saved.incomeFrequency) {
        setIncomeFrequency(saved.incomeFrequency);
      }
      if (saved.expenseFrequency) {
        setExpenseFrequency(saved.expenseFrequency);
      }
      if (saved.quantitativeDisplay) {
        setQuantitativeDisplay(saved.quantitativeDisplay);
      }
      if (saved.accountName) {
        setAccountName(saved.accountName);
      }
      if (saved.accountEmail) {
        setAccountEmail(saved.accountEmail);
      }
      if (saved.accountStory) {
        setAccountStory(saved.accountStory);
      }
    } catch {
      window.localStorage.removeItem(QUIZ_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        QUIZ_STORAGE_KEY,
        JSON.stringify({
          stage,
          qualitativeGroupIndex,
          quantitativeBatchIndex,
          input,
          qualitativeAnswers,
          incomeFrequency,
          expenseFrequency,
          quantitativeDisplay,
          accountName,
          accountEmail,
          accountStory,
        }),
      );
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    stage,
    qualitativeGroupIndex,
    quantitativeBatchIndex,
    input,
    qualitativeAnswers,
    incomeFrequency,
    expenseFrequency,
    quantitativeDisplay,
    accountName,
    accountEmail,
    accountStory,
  ]);

  const activeGroup = QUALITATIVE_GROUPS[qualitativeGroupIndex] ?? QUALITATIVE_GROUPS[0];
  const canAdvanceQualitative = activeGroup.questions.every((question) => question.id in qualitativeAnswers);
  const activeQuantitativeBatch = QUANTITATIVE_BATCHES[quantitativeBatchIndex];
  const canAdvanceQuantitative =
    activeQuantitativeBatch?.fields.every(
      (field) => quantitativeDisplay[field.id].trim().length > 0,
    ) ?? false;

  function answerBoolean(question: BooleanQuestion, answer: boolean) {
    setInput((current) => (answer ? question.applyYes(current) : question.applyNo(current)));
    setQualitativeAnswers((current) => ({
      ...current,
      [question.id]: answer,
    }));
  }

  function answerChoice(question: ChoiceQuestion, answer: string) {
    setInput((current) => question.applyChoice(current, answer));
    setQualitativeAnswers((current) => ({
      ...current,
      [question.id]: answer,
    }));
  }

  function goNextQualitative() {
    if (!canAdvanceQualitative) {
      return;
    }

    if (qualitativeGroupIndex < QUALITATIVE_GROUPS.length - 1) {
      setQualitativeGroupIndex((current) => current + 1);
      return;
    }

    setQuantitativeBatchIndex(0);
    setStage("quantitative");
  }

  function goBackQualitative() {
    if (qualitativeGroupIndex > 0) {
      setQualitativeGroupIndex((current) => current - 1);
    }
  }

  function updateQuantitativeValue(field: QuantitativeQuestionId, raw: string) {
    const formatted = formatLiveValue(field, raw);
    setQuantitativeDisplay((current) => ({
      ...current,
      [field]: formatted,
    }));
    setInput((current) => applyDisplayValue(current, field, formatted, incomeFrequency, expenseFrequency));
  }

  function updateFrequency(kind: "income" | "expense", next: Frequency) {
    if (kind === "income") {
      setIncomeFrequency(next);
      setQuantitativeDisplay((current) => ({
        ...current,
        annualSalary:
          current.annualSalary.trim().length === 0
            ? ""
            : formatCurrencyInput(
                next === "annually"
                  ? input.annualSalary
                  : next === "monthly"
                    ? input.annualSalary / 12
                    : input.annualSalary / 52,
              ),
      }));
      return;
    }

    setExpenseFrequency(next);
    setQuantitativeDisplay((current) => ({
      ...current,
      averageMonthlyExpenses:
        current.averageMonthlyExpenses.trim().length === 0
          ? ""
          : formatCurrencyInput(
              next === "monthly"
                ? input.averageMonthlyExpenses
                : next === "annually"
                  ? input.averageMonthlyExpenses * 12
                  : (input.averageMonthlyExpenses * 12) / 52,
            ),
    }));
  }

  function goNextQuantitative() {
    if (!canAdvanceQuantitative) {
      return;
    }

    if (quantitativeBatchIndex < QUANTITATIVE_BATCHES.length - 1) {
      setQuantitativeBatchIndex((current) => current + 1);
      return;
    }

    setStage("account");
  }

  function goBackQuantitative() {
    if (quantitativeBatchIndex > 0) {
      setQuantitativeBatchIndex((current) => current - 1);
      return;
    }

    setStage("qualitative");
    setQualitativeGroupIndex(QUALITATIVE_GROUPS.length - 1);
  }

  async function createAccountAndContinue() {
    if (!accountName.trim() || !accountEmail.trim() || !accountStory.trim()) {
      return;
    }

    setIsSubmitting(true);

    const dashboardSelections = buildDefaultSelections(input);
    const withSchemes = buildHomeownerPathwayOutput(input, dashboardSelections);
    const withoutSchemes = buildHomeownerPathwayOutput(input, {
      ...dashboardSelections,
      includeGuaranteeComparison: false,
      includeFhssConcept: false,
      activeDepositScenario: "baseline-20",
    });

    const snapshot: HomeownerDashboardSnapshot = {
      input,
      selections: dashboardSelections,
      account: {
        name: accountName.trim(),
        email: accountEmail.trim(),
        story: accountStory.trim(),
      },
      incomeFrequency,
      expenseFrequency,
      sentAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(HOMEOWNER_DASHBOARD_STORAGE_KEY, JSON.stringify(snapshot));
      window.localStorage.removeItem(QUIZ_STORAGE_KEY);
    }

    try {
      await fetch("/api/homeowner-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: snapshot.account,
          input,
          withSchemes,
          withoutSchemes,
        }),
      });
    } finally {
      setIsSubmitting(false);
      router.push("/first-home-dashboard");
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#ffffff,#f4f6f1)] p-5 shadow-[0_14px_34px_rgba(33,47,37,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              {stage === "qualitative" ? activeGroup.title : stage === "quantitative" ? "Your numbers" : "Final details"}
            </p>
            <p className="mt-1 text-sm text-foreground-soft">
              {stage === "qualitative"
                ? `Batch ${qualitativeGroupIndex + 1} of ${QUALITATIVE_GROUPS.length}`
                : stage === "quantitative"
                  ? `Batch ${quantitativeBatchIndex + 1} of ${QUANTITATIVE_BATCHES.length}`
                  : "One last step before the dashboard"}
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`h-2.5 w-8 rounded-full transition-colors ${
                  (stage === "qualitative" && dot <= 1) ||
                  (stage === "quantitative" && dot <= 2) ||
                  (stage === "account" && dot <= 3)
                    ? "bg-primary"
                    : "bg-primary/15"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {stage === "qualitative" ? (
        <section className="space-y-4">
          {activeGroup.questions.map((question) => {
            const answer = qualitativeAnswers[question.id];

            if (question.type === "choice") {
              return (
                <Card key={question.id} className="animate-fade-up space-y-4 bg-white p-6">
                  <p className="text-xl font-semibold tracking-tight">{question.prompt}</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={`quiz-${question.id}-${option.value}`}
                        className={`rounded-xl px-5 py-4 text-sm font-semibold transition-all ${
                          answer === option.value
                            ? "bg-primary text-white shadow-[0_8px_20px_rgba(74,124,89,0.3)]"
                            : "bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted"
                        }`}
                        onClick={() => answerChoice(question, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Card>
              );
            }

            return (
              <Card key={question.id} className="animate-fade-up space-y-4 bg-white p-6">
                <p className="text-xl font-semibold tracking-tight">{question.prompt}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    data-testid={`quiz-${question.id}-yes`}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                      answer === true
                        ? "bg-primary text-white shadow-[0_8px_20px_rgba(74,124,89,0.3)]"
                        : "bg-[#f0f5ec] text-foreground ring-1 ring-border hover:bg-[#e8efe2]"
                    }`}
                    onClick={() => answerBoolean(question, true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    data-testid={`quiz-${question.id}-no`}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                      answer === false ? "bg-[#7a4a43] text-white" : "bg-[#f7f1ed] text-foreground ring-1 ring-border hover:bg-[#efe7e0]"
                    }`}
                    onClick={() => answerBoolean(question, false)}
                  >
                    No
                  </button>
                </div>
              </Card>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goBackQualitative} disabled={qualitativeGroupIndex === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button data-testid="qual-batch-continue" type="button" onClick={goNextQualitative} disabled={!canAdvanceQualitative}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "quantitative" && activeQuantitativeBatch ? (
        <Card className="animate-fade-up space-y-6 bg-white p-6 md:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              Batch {quantitativeBatchIndex + 1}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">{activeQuantitativeBatch.title}</h2>
            <p className="text-sm text-foreground-soft">
              Broad tax caveat: we use a simple tax scenario for estimate-only modelling.
            </p>
          </div>

          <div className="grid gap-4">
            {activeQuantitativeBatch.fields.map((field) => (
              <label key={field.id} className="grid gap-2">
                <span className="text-sm font-semibold">{field.label}</span>
                {field.frequencyKey ? (
                  <div className="flex flex-wrap gap-2">
                    {(["weekly", "monthly", "annually"] as const).map((frequency) => {
                      const currentFrequency =
                        field.frequencyKey === "income" ? incomeFrequency : expenseFrequency;

                      return (
                        <button
                          key={`${field.id}-${frequency}`}
                          type="button"
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                            currentFrequency === frequency
                              ? "bg-primary text-white"
                              : "bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted"
                          }`}
                          onClick={() => updateFrequency(field.frequencyKey!, frequency)}
                        >
                          {frequency}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <Input
                  data-testid={`quiz-${field.id}`}
                  type="text"
                  inputMode="numeric"
                  placeholder={
                    field.id === "averageMonthlyExpenses"
                      ? expensePlaceholderForFrequency(expenseFrequency)
                      : field.placeholder
                  }
                  className="h-14 text-xl placeholder:text-[#9aa097]"
                  value={quantitativeDisplay[field.id]}
                  onChange={(event) => updateQuantitativeValue(field.id, event.currentTarget.value)}
                />
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goBackQuantitative}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button data-testid="quant-next" type="button" onClick={goNextQuantitative} disabled={!canAdvanceQuantitative}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : null}

      {stage === "account" ? (
        <Card className="animate-fade-up space-y-6 bg-white p-6 md:p-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              <Sparkles className="h-4 w-4" />
              Send your summary
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Your dashboard is ready.</h2>
            <p className="text-sm text-foreground-soft">
              We want to hear about your story. Thousands of young Aussies are struggling to buy their first home and we would love to hear how we can help.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              <span>Name</span>
              <Input value={accountName} onChange={(event) => setAccountName(event.currentTarget.value)} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              <span>Email</span>
              <Input
                type="email"
                value={accountEmail}
                onChange={(event) => setAccountEmail(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void createAccountAndContinue();
                  }
                }}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            <span>Your story</span>
            <textarea
              className="min-h-28 rounded-xl border border-border bg-[#f9f8f6] px-4 py-3 text-sm text-foreground outline-none ring-0 placeholder:text-[#9aa097] focus:border-primary focus:bg-white"
              placeholder="We want to hear about your story! Thousands of young Aussies are struggling to buy their first home and we would love to hear how we can help!"
              value={accountStory}
              onChange={(event) => setAccountStory(event.currentTarget.value)}
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStage("quantitative");
                setQuantitativeBatchIndex(QUANTITATIVE_BATCHES.length - 1);
              }}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              data-testid="create-free-account"
              type="button"
              onClick={() => void createAccountAndContinue()}
              disabled={isSubmitting || !accountName.trim() || !accountEmail.trim() || !accountStory.trim()}
            >
              {isSubmitting ? "Sending your summary..." : "Send my summary"}
            </Button>
          </div>
        </Card>
      ) : null}

      <p className="text-sm text-foreground-soft">
        Your answers stay in this browser until you finish or reset the quiz.
      </p>
    </div>
  );
}
