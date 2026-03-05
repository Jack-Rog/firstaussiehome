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

const SCHEME_BLOG_SLUG_BY_ID: Record<string, string> = {
  "stamp-duty": "nsw-fhbas-concept",
  guarantee: "home-guarantee-concept",
  "help-to-buy": "shared-equity-concept",
  fhss: "fhss-concept",
};

const SETUP_COST_HINTS: Record<string, string> = {
  "upfront-professional":
    "Legal support for contract review, settlement preparation, and final transfer process.",
  "upfront-disbursements":
    "Third-party search and lodgement costs often charged during conveyancing.",
  "upfront-stamping":
    "Document stamping/processing costs linked to settlement paperwork.",
  "upfront-registration":
    "Land registry transfer and mortgage registration charges.",
  "upfront-pexa":
    "Electronic settlement platform fee for processing settlement.",
};

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
    ? "border-primary/30 bg-primary-soft text-primary-strong"
    : "border-danger/25 bg-[#f9ecef] text-[#922b41]";
}

function scenarioButtonClass(scenario: PathwayScenarioOption, selected: boolean) {
  if (!scenario.available) {
    return "cursor-not-allowed border-border bg-[#efede8] text-foreground-soft opacity-80";
  }

  if (selected) {
    return "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(74,124,89,0.32)]";
  }

  return "border-border bg-white text-foreground hover:border-primary/35";
}

function schemePillClass(state: "active" | "available" | "inactive" | "watch") {
  if (state === "active") {
    return "border-primary/30 bg-primary-soft text-primary-strong";
  }

  if (state === "available") {
    return "border-accent/30 bg-accent-soft text-[#345443]";
  }

  if (state === "watch") {
    return "border-[#d2bda2] bg-[#fbf4e8] text-[#6b5230]";
  }

  return "border-danger/25 bg-[#f8edf0] text-[#8a2f2f]";
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

function frequencyLabel(frequency: Frequency) {
  if (frequency === "annually") {
    return "annual";
  }

  return frequency;
}

function signedCurrency(value: number, sign: "+" | "-" | "=") {
  if (sign === "=") {
    return formatCurrency(value);
  }

  return `${sign}${formatCurrency(value)}`;
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
    <Card className="animate-fade-up bg-white p-5 md:p-6">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={onToggle}
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-foreground-soft">{subtitle}</p> : null}
        </div>
        <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground">
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
  const [schemeDetailOpen, setSchemeDetailOpen] = useState<Partial<Record<string, boolean>>>({});
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
  const savingsGap = Math.max(currentCash - input.currentSavings, 0);
  const savingsSurplus = Math.max(input.currentSavings - currentCash, 0);
  const currentLvr =
    input.targetPropertyPrice > 0 && currentScenario
      ? (currentScenario.mortgageAmount / input.targetPropertyPrice) * 100
      : 0;
  const lvrRatePenalty = currentLvr > 95 ? 0.6 : currentLvr > 80 ? 0.25 : 0;
  const displayedRate = CURRENT_MARKET_OWNER_OCCUPIER_RATE + lvrRatePenalty;
  const marketMonthlyRepayment = currentScenario
    ? amortizedMonthlyRepayment(currentScenario.mortgageAmount, displayedRate, 30)
    : 0;
  const marketRepaymentAtExpenseFrequency = fromMonthlyAmount(marketMonthlyRepayment, expenseFrequency);
  const timeToSaveYears = currentScenario ? (currentScenario.timeToSaveMonths / 12).toFixed(1) : "0.0";
  const currentRows = [
    {
      label: "Home price",
      sign: "+" as const,
      currentValue: withSchemes.cashOutlayOverlay.purchasePrice,
      baselineValue: withoutSchemes.cashOutlayOverlay.purchasePrice,
    },
    {
      label: "Bank funding",
      sign: "-" as const,
      currentValue: withSchemes.cashOutlayOverlay.financedAmount,
      baselineValue: withoutSchemes.cashOutlayOverlay.financedAmount,
    },
    {
      label: "Transfer duty",
      sign: "+" as const,
      currentValue: withSchemes.cashOutlayOverlay.stampDuty,
      baselineValue: withoutSchemes.cashOutlayOverlay.stampDuty,
    },
    {
      label: "Grouped setup costs",
      sign: "+" as const,
      currentValue: withSchemes.cashOutlayOverlay.otherUpfrontCosts,
      baselineValue: withoutSchemes.cashOutlayOverlay.otherUpfrontCosts,
    },
  ];
  const setupCostDetails = (upfrontCostsPathway?.metrics.filter((metric) => metric.id !== "upfront-total") ?? []).map(
    (metric) => ({
      ...metric,
      label:
        metric.id === "upfront-professional"
          ? "Solicitor/Conveyancer fees"
          : metric.label,
    }),
  );

  function toggleSection(section: DashboardSection) {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function toggleSchemeDetail(schemeId: string) {
    setSchemeDetailOpen((current) => ({
      ...current,
      [schemeId]: !current[schemeId],
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6 pb-20 xl:pb-0">
      <section className="animate-fade-up rounded-[1.4rem] border border-border bg-[radial-gradient(circle_at_90%_16%,rgba(122,156,137,0.22),transparent_38%),linear-gradient(180deg,#ffffff,#f3f6f1)] p-6 shadow-[0_16px_38px_rgba(33,47,37,0.11)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Welcome back, {accountName}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Your first-home dashboard</h1>
        <p className="mt-2 text-sm text-foreground-soft">Each change below updates the out-of-pocket cash straight away.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground">
            State: {input.homeState?.toUpperCase()}
          </span>
          <span className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground">
            Area: {input.buyingArea === "state-capital" ? "State capital" : "Regional / non-capital"}
          </span>
        </div>
      </section>

      <section className="animate-fade-up sticky top-[5.4rem] z-30 rounded-[1.25rem] border border-border bg-[linear-gradient(135deg,#edf5ef,#f5f2e9)] p-5 shadow-[0_14px_30px_rgba(33,47,37,0.14)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Cost of your First Home</p>
            <p className="mt-1 text-sm text-foreground-soft">Funds required from you</p>
            <p data-testid="current-cash-outlay" className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
              {formatCurrency(currentCash)}
            </p>
          </div>
          <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-strong">
            {formatCurrency(cashDifference)} less cash with the current setup
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground-soft">
          Savings line: you currently have {formatCurrency(input.currentSavings)}.{" "}
          {savingsGap > 0
            ? `${formatCurrency(savingsGap)} still required to reach this cash outlay.`
            : `${formatCurrency(savingsSurplus)} above this cash outlay.`}
        </p>
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
                  className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-left transition-colors ${compactBooleanClass(
                    control.active,
                  )}`}
                  onClick={control.onToggle}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Icon className="h-3.5 w-3.5" />
                    {control.label}
                  </span>
                  {control.active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
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
                    className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                      input.homeState === option.value ? "bg-primary text-white" : "bg-surface ring-1 ring-border hover:bg-surface-muted"
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
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      input.buyingArea === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border hover:bg-surface-muted"
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
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Before-tax income</span>
                  <div className="flex gap-1">
                    {(["weekly", "monthly", "annually"] as const).map((frequency) => (
                      <button
                        key={`income-${frequency}`}
                        type="button"
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                          incomeFrequency === frequency ? "bg-primary text-white" : "bg-white ring-1 ring-border hover:bg-surface-muted"
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
                <p className="mt-2 text-xs text-foreground-soft">
                  Broad tax caveat: dashboard projections use a simple resident tax scenario.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Expected expenses</span>
                  <div className="flex gap-1">
                    {(["weekly", "monthly", "annually"] as const).map((frequency) => (
                      <button
                        key={`expense-${frequency}`}
                        type="button"
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                          expenseFrequency === frequency ? "bg-primary text-white" : "bg-white ring-1 ring-border hover:bg-surface-muted"
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
                  className={`rounded-[1rem] border p-4 text-left transition ${scenarioButtonClass(scenario, selected)}`}
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
                  <p className="mt-2 text-xs font-semibold opacity-95">
                    {`Estimated repayment (${frequencyLabel(expenseFrequency)}): ${formatCurrency(
                      fromMonthlyAmount(
                        amortizedMonthlyRepayment(
                          scenario.mortgageAmount,
                          CURRENT_MARKET_OWNER_OCCUPIER_RATE +
                            ((input.targetPropertyPrice > 0
                              ? (scenario.mortgageAmount / input.targetPropertyPrice) * 100
                              : 0) > 95
                              ? 0.6
                              : (input.targetPropertyPrice > 0
                                    ? (scenario.mortgageAmount / input.targetPropertyPrice) * 100
                                    : 0) > 80
                                ? 0.25
                                : 0),
                          30,
                        ),
                        expenseFrequency,
                      ),
                    )}`}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div className="rounded-[1rem] border border-border bg-surface p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-strong">Time to save</p>
              <p className="mt-2 text-lg font-semibold">
                {currentScenario ? `${timeToSaveYears} years` : "Unavailable"}
              </p>
              <p className="mt-2 text-xs leading-5 text-foreground-soft">
                Assumes no inflation, raises, or changes to savings, debt, or expenses.
              </p>
            </div>
            <div className="rounded-[1rem] border border-border bg-surface p-4">
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
                  <span className="text-foreground-soft">{`P&I repayment (${frequencyLabel(expenseFrequency)})`}</span>
                  <span className="font-semibold">{formatCurrency(marketRepaymentAtExpenseFrequency)}</span>
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
        title="Cost breakdown details"
        subtitle="The left column is the current scheme-aware route. The grey column is the no-scheme comparison."
        isOpen={openSections.cost}
        onToggle={() => toggleSection("cost")}
      >
        <div data-testid="cost-of-first-home" className="space-y-5">
          <div className="overflow-hidden rounded-[1.25rem] border border-border">
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
                <div className="px-4 py-3 font-medium text-foreground">
                  <span className="mr-2 inline-flex min-w-[1.1rem] justify-center font-semibold text-primary-strong">
                    {row.sign}
                  </span>
                  {row.label}
                </div>
                <div className="px-4 py-3 font-semibold text-foreground">{signedCurrency(row.currentValue, row.sign)}</div>
                <div className="bg-[#f6f4ee] px-4 py-3 font-semibold text-foreground-soft">
                  {signedCurrency(row.baselineValue, row.sign)}
                </div>
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

          <p className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground-soft">
            Funds required from you = <span className="font-semibold">Home price - Bank funding + Transfer duty + Grouped setup costs</span>.
          </p>

          <div className="rounded-[1.25rem] border border-border bg-white/92 p-4">
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
              <div className="mt-4 space-y-2">
                {setupCostDetails.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5 text-sm">
                    <span className="text-foreground-soft">
                      <span className="cursor-help underline decoration-dotted" title={SETUP_COST_HINTS[metric.id] ?? "Settlement-related setup cost"}>
                        {metric.label}
                      </span>
                    </span>
                    <span className="font-semibold">{metric.value}</span>
                  </div>
                ))}
                <p className="pt-2 text-xs text-foreground-soft">
                  Disclaimer: these were my own settlement-style costs based on an $850k property. Email me to get in touch:{" "}
                  <a href="mailto:jacksonrogers2001@gmail.com" className="font-semibold text-primary underline underline-offset-2">
                    jacksonrogers2001@gmail.com
                  </a>
                  .
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1rem] border border-border bg-surface p-4 text-sm text-foreground-soft">
            The bank is providing {formatCurrency(withSchemes.cashOutlayOverlay.financedAmount)}. The buyer cash total only counts the deposit, transfer duty, and grouped setup costs.
          </div>

          {currentScenario && currentScenario.timeToSaveMonths > 12 ? (
            <div className="rounded-[1.25rem] border border-[#d2bda2] bg-[#fbf4e8] p-5">
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
                  <Link href="/learn/fhss-concept" className="inline-flex text-sm font-semibold text-[#5c4426] underline underline-offset-4">
                    Read the FHSS blog
                  </Link>
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
        <div className="grid gap-4">
          <Link
            href="/eoi/tools"
            className="rounded-[1.1rem] border border-border bg-[#f2f7ee] p-5 transition hover:border-primary/30"
          >
            <p className="text-xl font-semibold tracking-tight">Join the Pro + Advice EOI</p>
            <p className="mt-2 text-sm text-foreground-soft">
              One expression-of-interest form for deeper tools and future licensed advice support.
            </p>
          </Link>
        </div>
      </SectionCard>

      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
        <Card className="bg-white/95 p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Scheme tracker</h2>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground"
              onClick={() => setSchemePanelOpen((current) => !current)}
              aria-label="Toggle scheme tracker"
            >
              {schemePanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          {schemePanelOpen ? (
            <div className="mt-4 space-y-3">
              {withSchemes.schemeStatuses.map((scheme) => (
                <div key={scheme.id} className={`rounded-lg border p-2.5 ${schemePillClass(scheme.state)}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 text-left"
                    onClick={() => toggleSchemeDetail(scheme.id)}
                  >
                    <span className="text-xs font-semibold">{scheme.label}</span>
                    <span className="inline-flex items-center gap-1">
                      {scheme.state === "active" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : scheme.state === "watch" || scheme.state === "available" ? (
                        <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      )}
                      {schemeDetailOpen[scheme.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                  {schemeDetailOpen[scheme.id] ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-[11px] leading-5">{scheme.detail}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                        {scheme.href ? (
                          <a
                            href={scheme.href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 underline underline-offset-4"
                          >
                            Official link
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                        {SCHEME_BLOG_SLUG_BY_ID[scheme.id] ? (
                          <Link href={`/learn/${SCHEME_BLOG_SLUG_BY_ID[scheme.id]}`} className="underline underline-offset-4">
                            Scheme blog
                          </Link>
                        ) : null}
                      </div>
                    </div>
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

        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary to-accent p-0 text-white shadow-[0_16px_34px_rgba(53,91,66,0.35)]">
          <div className="space-y-4 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">EOI pathways</p>
            <h3 className="text-2xl font-semibold tracking-tight">Need deeper support?</h3>
            <p className="text-sm text-white/90">
              Pro tools and future licensed advice are combined into one EOI lane right now.
            </p>
            <div className="grid gap-2">
              <Link
                href="/eoi/tools"
                className="rounded-lg bg-white px-4 py-2 text-center text-sm font-semibold text-primary transition hover:bg-white/90"
              >
                Join Pro + Advice EOI
              </Link>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
