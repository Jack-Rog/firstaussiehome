"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ExternalLink,
  Home,
  Landmark,
  PiggyBank,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";
import { useDisclosure } from "@/components/compliance/disclosure-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  buildHomeownerPathwayOutput,
  CURRENT_MARKET_OWNER_OCCUPIER_RATE,
  DEFAULT_HOMEOWNER_PATHWAY_INPUT,
  DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
} from "@/src/lib/analysis/homeowner-pathway-analysis";
import {
  HOMEOWNER_DASHBOARD_STORAGE_KEY,
  type HomeownerDashboardSnapshot,
} from "@/src/lib/homeowner-dashboard-storage";
import { REFERENCE_LINKS } from "@/src/lib/references";
import type { HomeownerPathwayInput, HomeownerPathwaySelections, PathwayScenarioOption } from "@/src/lib/types";
import {
  annualiseAmount,
  formatCurrency,
  formatCurrencyInput,
  fromAnnualAmount,
  fromMonthlyAmount,
  monthlyiseAmount,
  parseMoneyInput,
  type Frequency,
} from "@/src/lib/utils";

type DisplayDraft = {
  age: string;
  annualSalary: string;
  privateDebt: string;
  hecsDebt: string;
  currentSavings: string;
  averageMonthlyExpenses: string;
  targetPropertyPrice: string;
};

type DashboardSection = "scenario" | "deposit" | "cost" | "next";

const HOME_STATE_OPTIONS: Array<{
  value: NonNullable<HomeownerPathwayInput["homeState"]>;
  label: string;
}> = [
  { value: "nsw", label: "NSW" },
  { value: "vic", label: "VIC" },
  { value: "qld", label: "QLD" },
  { value: "wa", label: "WA" },
  { value: "sa", label: "SA" },
  { value: "tas", label: "TAS" },
  { value: "act", label: "ACT" },
  { value: "nt", label: "NT" },
];

function resolveHomeState(partial?: Partial<HomeownerPathwayInput>) {
  if (partial?.homeState) {
    return partial.homeState;
  }

  if (partial?.livingInNsw === false) {
    return "vic" as const;
  }

  return "nsw" as const;
}

function toDisplayDraft(
  input: HomeownerPathwayInput,
  incomeFrequency: Frequency,
  expenseFrequency: Frequency,
): DisplayDraft {
  return {
    age: String(input.age),
    annualSalary: formatCurrencyInput(fromAnnualAmount(input.annualSalary, incomeFrequency)),
    privateDebt: formatCurrencyInput(input.privateDebt),
    hecsDebt: formatCurrencyInput(input.hecsDebt),
    currentSavings: formatCurrencyInput(input.currentSavings),
    averageMonthlyExpenses: formatCurrencyInput(fromMonthlyAmount(input.averageMonthlyExpenses, expenseFrequency)),
    targetPropertyPrice: formatCurrencyInput(input.targetPropertyPrice),
  };
}

function getInitialDashboardState(initialInput?: Partial<HomeownerPathwayInput>) {
  const baseHomeState = resolveHomeState(initialInput);
  const baseInput = {
    ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
    ...initialInput,
    homeState: baseHomeState,
    livingInNsw: baseHomeState === "nsw",
  };
  const baseSelections: HomeownerPathwaySelections = {
    ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
    includeGuaranteeComparison: true,
    includeFhssConcept: true,
    activeDepositScenario: "guarantee-5",
    expandedPathway: "deposit",
  };

  if (typeof window === "undefined" || initialInput) {
    return {
      input: baseInput,
      selections: baseSelections,
      incomeFrequency: "annually" as Frequency,
      expenseFrequency: "monthly" as Frequency,
      accountName: "there",
    };
  }

  const raw = window.localStorage.getItem(HOMEOWNER_DASHBOARD_STORAGE_KEY);
  if (!raw) {
    return {
      input: baseInput,
      selections: baseSelections,
      incomeFrequency: "annually" as Frequency,
      expenseFrequency: "monthly" as Frequency,
      accountName: "there",
    };
  }

  try {
    const saved = JSON.parse(raw) as HomeownerDashboardSnapshot;
    const savedHomeState = resolveHomeState(saved.input);

    return {
      input: {
        ...baseInput,
        ...saved.input,
        homeState: savedHomeState,
        livingInNsw: savedHomeState === "nsw",
      },
      selections: {
        ...baseSelections,
        ...saved.selections,
        includeGuaranteeComparison: true,
        includeFhssConcept: true,
      },
      incomeFrequency: saved.incomeFrequency,
      expenseFrequency: saved.expenseFrequency,
      accountName: saved.account.name || "there",
    };
  } catch {
    window.localStorage.removeItem(HOMEOWNER_DASHBOARD_STORAGE_KEY);
    return {
      input: baseInput,
      selections: baseSelections,
      incomeFrequency: "annually" as Frequency,
      expenseFrequency: "monthly" as Frequency,
      accountName: "there",
    };
  }
}

function compactBooleanClass(active: boolean) {
  return active
    ? "border-[#2f6a35]/30 bg-[#dff2e1] text-[#1f4d25]"
    : "border-[#b85b5b]/25 bg-[#f9e3e3] text-[#8a2f2f]";
}

function scenarioButtonClass(scenario: PathwayScenarioOption, selected: boolean) {
  if (!scenario.available) {
    return "cursor-not-allowed border-border bg-[#ebe7de] text-foreground-soft opacity-80";
  }

  if (selected) {
    return "border-primary bg-primary text-white shadow-soft";
  }

  return "border-border bg-white text-foreground";
}

function schemePillClass(state: "active" | "available" | "inactive" | "watch") {
  if (state === "active") {
    return "border-[#2f6a35]/30 bg-[#dff2e1] text-[#1f4d25]";
  }

  if (state === "available") {
    return "border-[#5e8f63]/20 bg-[#edf7ee] text-[#2d5a31]";
  }

  if (state === "watch") {
    return "border-[#d2bda2] bg-[#fbf4e8] text-[#7b5a33]";
  }

  return "border-[#b85b5b]/20 bg-[#f7eded] text-[#8a2f2f]";
}

function amortizedMonthlyRepayment(principal: number, annualRate: number, termYears: number) {
  if (principal <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const periods = termYears * 12;

  if (monthlyRate === 0) {
    return principal / periods;
  }

  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
}

function updateInputFromDisplay(
  current: HomeownerPathwayInput,
  key: keyof DisplayDraft,
  raw: string,
  incomeFrequency: Frequency,
  expenseFrequency: Frequency,
) {
  if (key === "age") {
    return {
      ...current,
      age: Number(raw.replace(/[^0-9]/g, "") || "0"),
    };
  }

  const parsed = parseMoneyInput(raw);

  if (key === "annualSalary") {
    return {
      ...current,
      annualSalary: annualiseAmount(parsed, incomeFrequency),
    };
  }

  if (key === "averageMonthlyExpenses") {
    return {
      ...current,
      averageMonthlyExpenses: monthlyiseAmount(parsed, expenseFrequency),
    };
  }

  return {
    ...current,
    [key]: parsed,
  };
}

function requirementLabelForScenario(scenario: PathwayScenarioOption) {
  if (scenario.id === "guarantee-5") {
    return "Needs First Home Guarantee";
  }

  if (scenario.id === "shared-equity-2") {
    return "Needs Help to Buy";
  }

  return "No scheme needed";
}

function SectionCard({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="bg-white/92 p-4 md:p-5">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={onToggle}
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-foreground-soft">{subtitle}</p> : null}
        </div>
        <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {isOpen ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}

export function FirstHomeDashboard({
  initialInput,
}: {
  initialInput?: Partial<HomeownerPathwayInput>;
}) {
  const [initialState] = useState(() => getInitialDashboardState(initialInput));
  const { setDisclosure } = useDisclosure();
  const [input, setInput] = useState<HomeownerPathwayInput>(initialState.input);
  const [selections, setSelections] = useState<HomeownerPathwaySelections>(initialState.selections);
  const [incomeFrequency, setIncomeFrequency] = useState<Frequency>(initialState.incomeFrequency);
  const [expenseFrequency, setExpenseFrequency] = useState<Frequency>(initialState.expenseFrequency);
  const [accountName] = useState(initialState.accountName);
  const [display, setDisplay] = useState<DisplayDraft>(
    toDisplayDraft(initialState.input, initialState.incomeFrequency, initialState.expenseFrequency),
  );
  const [openSections, setOpenSections] = useState<Record<DashboardSection, boolean>>({
    scenario: true,
    deposit: true,
    cost: true,
    next: true,
  });
  const [schemePanelOpen, setSchemePanelOpen] = useState(true);
  const [setupCostsOpen, setSetupCostsOpen] = useState(false);

  const withSchemes = useMemo(
    () =>
      buildHomeownerPathwayOutput(input, {
        ...selections,
        includeGuaranteeComparison: true,
        includeFhssConcept: true,
      }),
    [input, selections],
  );
  const withoutSchemes = useMemo(
    () =>
      buildHomeownerPathwayOutput(input, {
        ...selections,
        includeGuaranteeComparison: false,
        includeFhssConcept: false,
        activeDepositScenario: "baseline-20",
      }),
    [input, selections],
  );

  useEffect(() => {
    setDisclosure({
      sources: withSchemes.sources,
      assumptions: withSchemes.assumptions,
      reviewDate: withSchemes.reviewDate,
    });
  }, [setDisclosure, withSchemes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const snapshot: HomeownerDashboardSnapshot = {
      input,
      selections: {
        ...selections,
        includeGuaranteeComparison: true,
        includeFhssConcept: true,
      },
      account: {
        name: accountName,
        email: "saved@aussiesfirsthome.local",
        story: "",
      },
      incomeFrequency,
      expenseFrequency,
      sentAt: new Date().toISOString(),
    };

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(HOMEOWNER_DASHBOARD_STORAGE_KEY, JSON.stringify(snapshot));
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [accountName, expenseFrequency, incomeFrequency, input, selections]);

  const depositPathway = withSchemes.pathways.find((pathway) => pathway.id === "deposit");
  const upfrontCostsPathway = withSchemes.pathways.find((pathway) => pathway.id === "upfront-costs");
  const currentScenario =
    depositPathway?.scenarioOptions?.find((scenario) => scenario.id === selections.activeDepositScenario && scenario.available) ??
    depositPathway?.scenarioOptions?.find((scenario) => scenario.available) ??
    depositPathway?.scenarioOptions?.[0];
  const currentCash = withSchemes.cashOutlayOverlay.totalBuyerCashOutlay;
  const baselineCash = withoutSchemes.cashOutlayOverlay.totalBuyerCashOutlay;
  const cashDifference = Math.max(baselineCash - currentCash, 0);
  const currentLvr =
    input.targetPropertyPrice > 0 && currentScenario
      ? (currentScenario.mortgageAmount / input.targetPropertyPrice) * 100
      : 0;
  const lvrRatePenalty = currentLvr > 95 ? 0.6 : currentLvr > 80 ? 0.25 : 0;
  const displayedRate = CURRENT_MARKET_OWNER_OCCUPIER_RATE + lvrRatePenalty;
  const marketMonthlyRepayment = currentScenario
    ? amortizedMonthlyRepayment(currentScenario.mortgageAmount, displayedRate, 30)
    : 0;
  const timeToSaveYears = currentScenario ? (currentScenario.timeToSaveMonths / 12).toFixed(1) : "0.0";
  const currentRows = [
    { label: "Home price", currentValue: withSchemes.cashOutlayOverlay.purchasePrice, baselineValue: withoutSchemes.cashOutlayOverlay.purchasePrice },
    { label: "Bank loan", currentValue: withSchemes.cashOutlayOverlay.financedAmount, baselineValue: withoutSchemes.cashOutlayOverlay.financedAmount },
    { label: "Deposit", currentValue: withSchemes.cashOutlayOverlay.depositAmount, baselineValue: withoutSchemes.cashOutlayOverlay.depositAmount },
    { label: "Transfer duty", currentValue: withSchemes.cashOutlayOverlay.stampDuty, baselineValue: withoutSchemes.cashOutlayOverlay.stampDuty },
    { label: "Grouped setup costs", currentValue: withSchemes.cashOutlayOverlay.otherUpfrontCosts, baselineValue: withoutSchemes.cashOutlayOverlay.otherUpfrontCosts },
  ];
  const setupCostDetails =
    upfrontCostsPathway?.metrics.filter((metric) => metric.id !== "upfront-total") ?? [];

  function toggleSection(section: DashboardSection) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function updateDisplay(key: keyof DisplayDraft, raw: string) {
    const formatted =
      key === "age" ? raw.replace(/[^0-9]/g, "") : raw.trim().length === 0 ? "" : formatCurrencyInput(parseMoneyInput(raw));

    setDisplay((current) => ({
      ...current,
      [key]: formatted,
    }));
    setInput((current) => updateInputFromDisplay(current, key, formatted, incomeFrequency, expenseFrequency));
  }

  function updateFrequency(kind: "income" | "expense", next: Frequency) {
    if (kind === "income") {
      setIncomeFrequency(next);
      setDisplay((current) => ({
        ...current,
        annualSalary:
          current.annualSalary.trim().length === 0
            ? ""
            : formatCurrencyInput(fromAnnualAmount(input.annualSalary, next)),
      }));
      return;
    }

    setExpenseFrequency(next);
    setDisplay((current) => ({
      ...current,
      averageMonthlyExpenses:
        current.averageMonthlyExpenses.trim().length === 0
          ? ""
          : formatCurrencyInput(fromMonthlyAmount(input.averageMonthlyExpenses, next)),
    }));
  }

  const booleanControls = [
    {
      label: "First home",
      active: input.firstHomeBuyer,
      icon: Home,
      onToggle: () =>
        setInput((current) => ({
          ...current,
          firstHomeBuyer: !current.firstHomeBuyer,
          existingProperty: current.firstHomeBuyer ? current.existingProperty : false,
        })),
    },
    {
      label: "No other property",
      active: !input.existingProperty,
      icon: Landmark,
      onToggle: () =>
        setInput((current) => ({
          ...current,
          existingProperty: !current.existingProperty,
          firstHomeBuyer: current.existingProperty ? true : false,
        })),
    },
    {
      label: "Existing home",
      active: !input.buyingNewHome,
      icon: Home,
      onToggle: () => setInput((current) => ({ ...current, buyingNewHome: !current.buyingNewHome })),
    },
    {
      label: "Resident",
      active: input.australianCitizenOrResident,
      icon: UserRound,
      onToggle: () =>
        setInput((current) => ({
          ...current,
          australianCitizenOrResident: !current.australianCitizenOrResident,
        })),
    },
    {
      label: "No dependants",
      active: !input.dependants,
      icon: UserRound,
      onToggle: () => setInput((current) => ({ ...current, dependants: !current.dependants })),
    },
    {
      label: "PAYG only",
      active: input.paygOnly,
      icon: Wallet,
      onToggle: () => setInput((current) => ({ ...current, paygOnly: !current.paygOnly })),
    },
    {
      label: "No business / trust",
      active: !input.businessIncome,
      icon: PiggyBank,
      onToggle: () => setInput((current) => ({ ...current, businessIncome: !current.businessIncome })),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="space-y-6 pb-20 xl:pb-0">
      <section className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,#f7f4ea,#eef5e8)] p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Welcome back, {accountName}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Your first-home dashboard</h1>
        <p className="mt-2 text-sm text-foreground-soft">Each change below updates the out-of-pocket cash straight away.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {withSchemes.comparisonRibbon.map((item) => (
            <span
              key={item.id}
              className="inline-flex rounded-full border border-border bg-white/85 px-3 py-1.5 text-xs font-semibold text-foreground"
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      </section>

      <SectionCard
        title="Your responses"
        subtitle="Compact toggles and numbers keep the scenario easy to adjust on mobile."
        isOpen={openSections.scenario}
        onToggle={() => toggleSection("scenario")}
      >
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {booleanControls.map((control) => {
              const Icon = control.icon;

              return (
                <button
                  key={control.label}
                  type="button"
                  className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-left ${compactBooleanClass(
                    control.active,
                  )}`}
                  onClick={control.onToggle}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4" />
                    {control.label}
                  </span>
                  {control.active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="grid gap-2">
              <span className="text-sm font-semibold">State / territory</span>
              <div className="grid grid-cols-4 gap-2">
                {HOME_STATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-xl px-2 py-2 text-xs font-semibold ${
                      input.homeState === option.value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                    }`}
                    onClick={() =>
                      setInput((current) => ({
                        ...current,
                        homeState: option.value,
                        livingInNsw: option.value === "nsw",
                      }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-semibold">Buying area</span>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["state-capital", "State capital"],
                  ["regional", "Regional"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                      input.buyingArea === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                    }`}
                    onClick={() =>
                      setInput((current) => ({
                        ...current,
                        buyingArea: value,
                      }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              <span>Age</span>
              <Input
                className="h-10 text-base"
                value={display.age}
                onChange={(event) => updateDisplay("age", event.currentTarget.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">After-tax income</span>
                  <div className="flex gap-1">
                    {(["weekly", "monthly", "annually"] as const).map((frequency) => (
                      <button
                        key={`income-${frequency}`}
                        type="button"
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          incomeFrequency === frequency ? "bg-primary text-white" : "bg-white ring-1 ring-border"
                        }`}
                        onClick={() => updateFrequency("income", frequency)}
                      >
                        {frequency}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  className="mt-3 h-10 text-base"
                  value={display.annualSalary}
                  onChange={(event) => updateDisplay("annualSalary", event.currentTarget.value)}
                />
              </div>

              <div className="rounded-2xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Expected expenses</span>
                  <div className="flex gap-1">
                    {(["weekly", "monthly", "annually"] as const).map((frequency) => (
                      <button
                        key={`expense-${frequency}`}
                        type="button"
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          expenseFrequency === frequency ? "bg-primary text-white" : "bg-white ring-1 ring-border"
                        }`}
                        onClick={() => updateFrequency("expense", frequency)}
                      >
                        {frequency}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  className="mt-3 h-10 text-base"
                  value={display.averageMonthlyExpenses}
                  onChange={(event) => updateDisplay("averageMonthlyExpenses", event.currentTarget.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="grid gap-2 text-sm font-semibold">
                <span>Current savings</span>
                <Input
                  className="h-10 text-base"
                  value={display.currentSavings}
                  onChange={(event) => updateDisplay("currentSavings", event.currentTarget.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span>Private debt</span>
                <Input
                  className="h-10 text-base"
                  value={display.privateDebt}
                  onChange={(event) => updateDisplay("privateDebt", event.currentTarget.value)}
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                <span>HECS / HELP</span>
                <Input
                  className="h-10 text-base"
                  value={display.hecsDebt}
                  onChange={(event) => updateDisplay("hecsDebt", event.currentTarget.value)}
                />
              </label>
            </div>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            <span>Target property price</span>
            <Input
              className="h-10 text-base"
              value={display.targetPropertyPrice}
              onChange={(event) => updateDisplay("targetPropertyPrice", event.currentTarget.value)}
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Choose your deposit path"
        subtitle="Pick one route. Each option shows which scheme it relies on and whether LMI can apply."
        isOpen={openSections.deposit}
        onToggle={() => toggleSection("deposit")}
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(depositPathway?.scenarioOptions ?? []).map((scenario) => {
              const selected = currentScenario?.id === scenario.id;

              return (
                <button
                  key={scenario.id}
                  type="button"
                  disabled={!scenario.available}
                  className={`rounded-3xl border p-4 text-left transition ${scenarioButtonClass(scenario, selected)}`}
                  onClick={() =>
                    setSelections((current) => ({
                      ...current,
                      activeDepositScenario: scenario.id,
                    }))
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-semibold">{scenario.depositPercent}%</p>
                    {selected ? <CheckCircle2 className="h-5 w-5" /> : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold">{formatCurrency(scenario.depositAmount)}</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">
                    {requirementLabelForScenario(scenario)}
                  </p>
                  <p className="mt-2 text-xs leading-5 opacity-90">
                    {scenario.statusNote}
                    {scenario.requiresLmi ? " LMI can apply." : ""}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div className="rounded-3xl border border-border bg-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">Time to save</p>
              <p className="mt-2 text-lg font-semibold">
                {currentScenario ? `${timeToSaveYears} years` : "Unavailable"}
              </p>
              <p className="mt-2 text-xs leading-5 text-foreground-soft">
                Assumes no inflation, raises, or changes to savings, debt, or expenses.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">Mortgage</p>
              <div className="mt-2 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-soft">Expected tenor</span>
                  <span className="font-semibold">30 years</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-soft">Market average estimate</span>
                  <span className="font-semibold">{displayedRate.toFixed(2)}% p.a.</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-soft">Higher-LVR adjustment</span>
                  <span className="font-semibold">
                    {lvrRatePenalty > 0 ? `+${lvrRatePenalty.toFixed(2)}% p.a.` : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-soft">P&I repayment</span>
                  <span className="font-semibold">{formatCurrency(marketMonthlyRepayment)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-foreground-soft">Payoff pace if flat</span>
                  <span className="font-semibold">
                    {currentScenario ? `${currentScenario.estimatedPayoffYears} years` : "Unavailable"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Cost of your First Home"
        subtitle="The left column is the current scheme-aware route. The grey column is the no-scheme comparison."
        isOpen={openSections.cost}
        onToggle={() => toggleSection("cost")}
      >
        <div data-testid="cost-of-first-home" className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] bg-[linear-gradient(135deg,#f0f7eb,#f7f2e7)] p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Funds required from you</p>
              <p data-testid="current-cash-outlay" className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
                {formatCurrency(currentCash)}
              </p>
            </div>
            <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-strong">
              {formatCurrency(cashDifference)} less cash with the current setup
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-border">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] bg-[#eef5e8] text-xs font-semibold uppercase tracking-[0.16em] text-primary-strong">
              <div className="px-4 py-3">Line item</div>
              <div className="px-4 py-3">Using schemes</div>
              <div className="bg-[#efede7] px-4 py-3 text-foreground-soft">No-scheme</div>
            </div>

            {currentRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-border text-sm"
              >
                <div className="px-4 py-3 font-medium text-foreground">{row.label}</div>
                <div className="px-4 py-3 font-semibold text-foreground">{formatCurrency(row.currentValue)}</div>
                <div className="bg-[#f6f4ee] px-4 py-3 font-semibold text-foreground-soft">{formatCurrency(row.baselineValue)}</div>
              </div>
            ))}

            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-border text-sm">
              <div className="bg-primary px-4 py-4 font-semibold text-white">Funds required from you</div>
              <div className="bg-primary px-4 py-4 text-lg font-semibold text-white">{formatCurrency(currentCash)}</div>
              <div
                data-testid="baseline-cash-outlay"
                className="bg-[#dcd8cf] px-4 py-4 text-lg font-semibold text-foreground"
              >
                {formatCurrency(baselineCash)}
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-white/88 p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              onClick={() => setSetupCostsOpen((current) => !current)}
            >
              <div>
                <p className="text-lg font-semibold tracking-tight">Grouped setup costs</p>
                <p className="text-sm text-foreground-soft">Scaled from the settlement-style costs you shared.</p>
              </div>
              {setupCostsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {setupCostsOpen ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {setupCostDetails.map((metric) => (
                  <div key={metric.id} className="rounded-2xl bg-surface px-3 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-foreground-soft">{metric.label}</span>
                      <span className="font-semibold">{metric.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-border bg-surface p-4 text-sm text-foreground-soft">
            The bank is providing {formatCurrency(withSchemes.cashOutlayOverlay.financedAmount)}. The buyer cash total only counts the deposit, transfer duty, and grouped setup costs.
          </div>

          {currentScenario && currentScenario.timeToSaveMonths > 12 ? (
            <div className="rounded-[1.75rem] border border-[#d2bda2] bg-[#fbf4e8] p-5">
              <div className="flex items-start gap-3">
                <CircleAlert className="mt-0.5 h-5 w-5 text-[#7b5a33]" />
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-[#5c4426]">Longer saving runway</p>
                  <p className="text-sm text-[#6b5230]">
                    This time to save is over 12 months, so the Super Saver Scheme could be worth comparing because it can move tax by a few thousand dollars for some buyers.
                  </p>
                  <a
                    href={REFERENCE_LINKS.FIRSTHOME_FHSS.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c4426] underline underline-offset-4"
                  >
                    Open the official tool in a new tab
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <p className="text-xs text-[#6b5230]">Your dashboard stays open here.</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="What do you want next?"
        isOpen={openSections.next}
        onToggle={() => toggleSection("next")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/eoi/tools"
            className="rounded-[1.75rem] border border-border bg-[#f2f7ee] p-5 transition hover:border-primary/30"
          >
            <p className="text-xl font-semibold tracking-tight">Find more tools for you</p>
            <p className="mt-2 text-sm text-foreground-soft">
              Join the list for deeper calculators, comparison tools, and early-release access.
            </p>
          </Link>
          <Link
            href="/eoi/advice"
            className="rounded-[1.75rem] border border-border bg-[#f7f1ed] p-5 transition hover:border-[#7a4a43]/25"
          >
            <p className="text-xl font-semibold tracking-tight">Receive accredited financial advice</p>
            <p className="mt-2 text-sm text-foreground-soft">
              Register interest for the future licensed advice pathway with human sign-off.
            </p>
          </Link>
        </div>
      </SectionCard>

      </div>

      <aside className="xl:sticky xl:top-24 xl:h-fit">
        <Card className="bg-white/95 p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Scheme tracker</h2>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground"
              onClick={() => setSchemePanelOpen((current) => !current)}
              aria-label="Toggle scheme tracker"
            >
              {schemePanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          {schemePanelOpen ? (
            <div className="mt-4 space-y-3">
              {withSchemes.schemeStatuses.map((scheme) => (
                <div
                  key={scheme.id}
                  className={`rounded-2xl border p-3 ${schemePillClass(scheme.state)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{scheme.label}</p>
                      <p className="mt-1 text-xs leading-5">{scheme.detail}</p>
                    </div>
                    {scheme.state === "active" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : scheme.state === "watch" || scheme.state === "available" ? (
                      <CircleAlert className="h-4 w-4 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 opacity-70" />
                    )}
                  </div>
                  {scheme.href ? (
                    <a
                      href={scheme.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4"
                    >
                      Learn more
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-foreground-soft">
              Expand this rail to see which relief and guarantee pathways are active.
            </p>
          )}
        </Card>
      </aside>
    </div>
  );
}
