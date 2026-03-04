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
  prompt: string;
  placeholder: string;
  frequencyKey?: "income" | "expense";
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

const QUANTITATIVE_QUESTIONS: QuantitativeQuestion[] = [
  { id: "age", prompt: "How old are you?", placeholder: "69" },
  { id: "annualSalary", prompt: "What is your after-tax income?", placeholder: "$4.20", frequencyKey: "income" },
  { id: "privateDebt", prompt: "How much private debt do you have?", placeholder: "$13.37" },
  { id: "hecsDebt", prompt: "How much HECS / HELP debt do you have?", placeholder: "$42" },
  { id: "currentSavings", prompt: "How much do you already have saved?", placeholder: "$123" },
  {
    id: "averageMonthlyExpenses",
    prompt: "What are your expected expenses (you can ignore rent!)?",
    placeholder: "$808",
    frequencyKey: "expense",
  },
  { id: "targetPropertyPrice", prompt: "What price are you aiming to buy at?", placeholder: "$999,999" },
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

export function FirstHomeQuizFlow() {
  const router = useRouter();
  const { setDisclosure } = useDisclosure();
  const [stage, setStage] = useState<Stage>("qualitative");
  const [qualitativeGroupIndex, setQualitativeGroupIndex] = useState(0);
  const [quantitativeIndex, setQuantitativeIndex] = useState(0);
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
      if (typeof saved.quantitativeIndex === "number") {
        setQuantitativeIndex(saved.quantitativeIndex);
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
          quantitativeIndex,
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
    quantitativeIndex,
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
  const activeQuantitativeQuestion = QUANTITATIVE_QUESTIONS[quantitativeIndex];
  const canAdvanceQuantitative = activeQuantitativeQuestion
    ? quantitativeDisplay[activeQuantitativeQuestion.id].trim().length > 0
    : false;

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

    if (quantitativeIndex < QUANTITATIVE_QUESTIONS.length - 1) {
      setQuantitativeIndex((current) => current + 1);
      return;
    }

    setStage("account");
  }

  function goBackQuantitative() {
    if (quantitativeIndex > 0) {
      setQuantitativeIndex((current) => current - 1);
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
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,#f8f4ea,#eef4e9)] p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              {stage === "qualitative" ? activeGroup.title : stage === "quantitative" ? "Your numbers" : "Final details"}
            </p>
            <p className="mt-1 text-sm text-foreground-soft">
              {stage === "qualitative"
                ? `Batch ${qualitativeGroupIndex + 1} of ${QUALITATIVE_GROUPS.length}`
                : stage === "quantitative"
                  ? `Question ${quantitativeIndex + 1} of ${QUANTITATIVE_QUESTIONS.length}`
                  : "One last step before the dashboard"}
            </p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`h-2.5 w-8 rounded-full ${
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
                <Card key={question.id} className="space-y-4 bg-white/90 p-5">
                  <p className="text-xl font-semibold tracking-tight">{question.prompt}</p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={`quiz-${question.id}-${option.value}`}
                        className={`rounded-2xl px-5 py-4 text-sm font-semibold ${
                          answer === option.value
                            ? "bg-primary text-white"
                            : "bg-surface text-foreground ring-1 ring-border"
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
              <Card key={question.id} className="space-y-4 bg-white/90 p-5">
                <p className="text-xl font-semibold tracking-tight">{question.prompt}</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    data-testid={`quiz-${question.id}-yes`}
                    className={`rounded-2xl px-5 py-3 text-sm font-semibold ${
                      answer === true ? "bg-primary text-white" : "bg-[#f0f5ec] text-foreground ring-1 ring-border"
                    }`}
                    onClick={() => answerBoolean(question, true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    data-testid={`quiz-${question.id}-no`}
                    className={`rounded-2xl px-5 py-3 text-sm font-semibold ${
                      answer === false ? "bg-[#7a4a43] text-white" : "bg-[#f7f1ed] text-foreground ring-1 ring-border"
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

      {stage === "quantitative" && activeQuantitativeQuestion ? (
        <Card className="space-y-6 bg-white/90 p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              Question {quantitativeIndex + 1}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">{activeQuantitativeQuestion.prompt}</h2>
          </div>

          {activeQuantitativeQuestion.frequencyKey ? (
            <div className="flex flex-wrap gap-2">
              {(["weekly", "monthly", "annually"] as const).map((frequency) => {
                const currentFrequency =
                  activeQuantitativeQuestion.frequencyKey === "income" ? incomeFrequency : expenseFrequency;

                return (
                  <button
                    key={frequency}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      currentFrequency === frequency
                        ? "bg-primary text-white"
                        : "bg-surface text-foreground ring-1 ring-border"
                    }`}
                    onClick={() => updateFrequency(activeQuantitativeQuestion.frequencyKey!, frequency)}
                  >
                    {frequency}
                  </button>
                );
              })}
            </div>
          ) : null}

          <Input
            data-testid={`quiz-${activeQuantitativeQuestion.id}`}
            type="text"
            inputMode="numeric"
            placeholder={activeQuantitativeQuestion.placeholder}
            className="h-14 text-2xl placeholder:text-[#9aa097]"
            value={quantitativeDisplay[activeQuantitativeQuestion.id]}
            onChange={(event) => updateQuantitativeValue(activeQuantitativeQuestion.id, event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                goNextQuantitative();
              }
            }}
          />

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
        <Card className="space-y-6 bg-white/90 p-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              <Sparkles className="h-4 w-4" />
              Send your summary
            </div>
            <h2 className="text-3xl font-semibold tracking-tight">Your dashboard is ready.</h2>
            <p className="text-sm text-foreground-soft">
              Add your name, email, and a quick story. A placeholder version is fine if you prefer, but I would still like a broad outline so I can understand how to help with your first-home purchase.
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
              className="min-h-28 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none ring-0 placeholder:text-[#9aa097] focus:border-primary"
              placeholder="A broad or placeholder version is okay. For example: first job, steady PAYG income, trying to work out what I can buy."
              value={accountStory}
              onChange={(event) => setAccountStory(event.currentTarget.value)}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-3">
            {preview.heroSummary.map((item) => (
              <div key={item.label} className="rounded-3xl bg-[#f2f7ee] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">{item.label}</p>
                <p className="mt-2 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStage("quantitative");
                setQuantitativeIndex(QUANTITATIVE_QUESTIONS.length - 1);
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
