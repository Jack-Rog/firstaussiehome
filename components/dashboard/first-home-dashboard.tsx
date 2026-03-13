"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ExternalLink,
  Home,
  UserRound,
  XCircle,
} from "lucide-react";
import { useDisclosure } from "@/components/compliance/disclosure-context";
import { ResearchIntakeForm } from "@/components/research/research-intake-form";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getSavedDutyTier2FieldIds,
} from "@/src/lib/analysis/homeowner-duty-intake";
import {
  buildHomeownerPathwayOutput,
  CURRENT_MARKET_OWNER_OCCUPIER_RATE,
  DEFAULT_HOMEOWNER_PATHWAY_INPUT,
  DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
  PURCHASE_COST_BANDS,
} from "@/src/lib/analysis/homeowner-pathway-analysis";
import {
  HOMEOWNER_DASHBOARD_STORAGE_KEY,
  parseHomeownerDashboardSnapshot,
  type HomeownerDashboardSnapshot,
} from "@/src/lib/homeowner-dashboard-storage";
import {
  PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY,
  type FirstHomeQuizPersistedState,
} from "@/src/lib/first-home-quiz";
import { deriveResearchContextFromHomeownerInput } from "@/src/lib/research";
import { getAnonymousId, getSessionId, trackResearchEvent } from "@/src/lib/research-client";
import { REFERENCE_LINKS } from "@/src/lib/references";
import type { HomeownerPathwayInput, HomeownerPathwaySelections } from "@/src/lib/types";
import {
  formatCurrency,
  formatCurrencyInput,
  fromMonthlyAmount,
  parseMoneyInput,
  type Frequency,
} from "@/src/lib/utils";

type DisplayDraft = {
  currentSavings: string;
  targetPropertyPrice: string;
  actHouseholdIncome: string;
  dependentChildrenCount: string;
};

type DashboardSection = "scenario" | "cost";
type ResponseTab = "basic" | "advanced";

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

const PROPERTY_TYPE_OPTIONS: Array<{
  value: NonNullable<HomeownerPathwayInput["propertyTypeDetailed"]>;
  label: string;
}> = [
  { value: "established-home", label: "Established" },
  { value: "new-home", label: "New" },
  { value: "vacant-land", label: "Vacant land" },
  { value: "off-the-plan-home", label: "Off-the-plan" },
  { value: "house-and-land-package", label: "House-and-land" },
];

const ADVANCED_FIELD_LABELS: Record<string, string> = {
  buyerEntityType: "Buyer entity type",
  jointEligibilityAligned: "Joint profile alignment",
  foreignOwnershipMode: "Foreign ownership split",
  waRegion: "WA region",
  qldConcessionPath: "Queensland path",
  saReliefPath: "South Australia relief path",
  dependentChildrenCount: "Dependant children",
  ntHouseAndLandEligiblePath: "NT targeted exemption path",
};

const SCHEME_BLOG_SLUG_BY_ID: Record<string, string> = {
  "stamp-duty": "nsw-fhbas-concept",
  guarantee: "home-guarantee-concept",
  "help-to-buy": "shared-equity-concept",
  fhss: "fhss-concept",
};

const SETUP_COST_HINTS: Record<string, string> = {
  "upfront-professional":
    "Typical conveyancer or solicitor fee for contract review, settlement preparation, and final transfer work.",
  "upfront-disbursements":
    "Typical searches, certificates, and third-party checks often charged during conveyancing.",
  "upfront-stamping":
    "Typical verification, identity, and settlement admin charges that often sit outside the main legal fee.",
  "upfront-registration":
    "NSW-guided transfer and mortgage registration charges.",
  "upfront-pexa":
    "NSW-guided PEXA transfer and mortgage workspace charges.",
};
const PROPERTY_PRICE_SLIDER_MIN = 0;
const PROPERTY_PRICE_SLIDER_MAX = 2000000;
const PROPERTY_PRICE_SLIDER_STEP = 5000;

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
): DisplayDraft {
  return {
    currentSavings: formatCurrencyInput(input.currentSavings),
    targetPropertyPrice: formatCurrencyInput(input.targetPropertyPrice),
    actHouseholdIncome: formatCurrencyInput(input.actHouseholdIncome),
    dependentChildrenCount:
      input.dependentChildrenCount === undefined ? "" : String(input.dependentChildrenCount),
  };
}

function selectLatestSnapshot(
  localSnapshot: HomeownerDashboardSnapshot | null,
  initialSnapshot?: HomeownerDashboardSnapshot | null,
) {
  if (!localSnapshot) {
    return initialSnapshot ?? null;
  }

  if (!initialSnapshot) {
    return localSnapshot;
  }

  return new Date(localSnapshot.sentAt).getTime() >= new Date(initialSnapshot.sentAt).getTime()
    ? localSnapshot
    : initialSnapshot;
}

function getInitialDashboardState(
  initialInput?: Partial<HomeownerPathwayInput>,
  initialSnapshot?: HomeownerDashboardSnapshot | null,
) {
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

  const snapshot = initialSnapshot;
  const snapshotHomeState = snapshot ? resolveHomeState(snapshot.input) : null;

  return {
    input:
      snapshot && snapshotHomeState
        ? {
            ...baseInput,
            ...snapshot.input,
            homeState: snapshotHomeState,
            livingInNsw: snapshotHomeState === "nsw",
          }
        : baseInput,
    selections: snapshot ? { ...baseSelections, ...snapshot.selections } : baseSelections,
    incomeFrequency: snapshot?.incomeFrequency ?? ("annually" as Frequency),
    expenseFrequency: snapshot?.expenseFrequency ?? ("monthly" as Frequency),
  };
}

function readSavedDashboardState(initialSnapshot?: HomeownerDashboardSnapshot | null) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(HOMEOWNER_DASHBOARD_STORAGE_KEY);
  let localSnapshot: HomeownerDashboardSnapshot | null = null;

  if (raw) {
    try {
      localSnapshot = parseHomeownerDashboardSnapshot(JSON.parse(raw));
    } catch {
      window.localStorage.removeItem(HOMEOWNER_DASHBOARD_STORAGE_KEY);
    }
  }

  const saved = selectLatestSnapshot(localSnapshot, initialSnapshot);
  if (!saved) {
    return null;
  }

  const baseState = getInitialDashboardState(undefined, initialSnapshot);
  const savedHomeState = resolveHomeState(saved.input);
  return {
    input: {
      ...baseState.input,
      ...saved.input,
      homeState: savedHomeState,
      livingInNsw: savedHomeState === "nsw",
    },
    selections: {
      ...baseState.selections,
      ...saved.selections,
      includeGuaranteeComparison: true,
      includeFhssConcept: true,
    },
    incomeFrequency: saved.incomeFrequency,
    expenseFrequency: saved.expenseFrequency,
  };
}

function compactBooleanClass(active: boolean) {
  return active
    ? "border-primary/30 bg-primary-soft text-primary-strong"
    : "border-danger/25 bg-[#f9ecef] text-[#922b41]";
}

function schemePillClass(state: "active" | "available" | "inactive" | "watch" | "neutral") {
  if (state === "active") {
    return "border-primary/30 bg-primary-soft text-primary-strong";
  }

  if (state === "available") {
    return "border-accent/30 bg-white text-[#345443]";
  }

  if (state === "watch") {
    return "border-[#d2bda2] bg-[#fbf4e8] text-[#6b5230]";
  }

  if (state === "neutral") {
    return "border-border bg-[#f1f0ec] text-foreground-soft";
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
) {
  if (key === "dependentChildrenCount") {
    const count = raw.trim().length === 0 ? undefined : Number(raw.replace(/[^\d]/g, ""));

    return {
      ...current,
      dependentChildrenCount: count,
      dependants: (count ?? 0) > 0,
    };
  }

  const parsed = parseMoneyInput(raw);

  return {
    ...current,
    [key]: parsed,
  };
}

function requirementLabelForScenario(scenario: { id: string }) {
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
        className="flex w-full items-start justify-between gap-4 rounded-[1rem] border border-border bg-[linear-gradient(180deg,#fcfcfa,#f3f4ef)] px-4 py-3 text-left transition hover:border-primary/35 hover:bg-[linear-gradient(180deg,#ffffff,#edf4ec)]"
        onClick={onToggle}
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-foreground-soft">{subtitle}</p> : null}
        </div>
        <span className="mt-1 inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground shadow-[0_4px_12px_rgba(33,47,37,0.08)]">
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {isOpen ? <div className="mt-5">{children}</div> : null}
    </Card>
  );
}

export function FirstHomeDashboard({
  initialInput,
  initialSnapshot,
}: {
  initialInput?: Partial<HomeownerPathwayInput>;
  initialSnapshot?: HomeownerDashboardSnapshot | null;
}) {
  const [initialState] = useState(() => getInitialDashboardState(initialInput, initialSnapshot));
  const savedDashboardStateLoaded = useRef(false);
  const { setDisclosure } = useDisclosure();
  const [input, setInput] = useState<HomeownerPathwayInput>(initialState.input);
  const [selections, setSelections] = useState<HomeownerPathwaySelections>(initialState.selections);
  const [incomeFrequency] = useState<Frequency>(initialState.incomeFrequency);
  const [expenseFrequency] = useState<Frequency>(initialState.expenseFrequency);
  const [display, setDisplay] = useState<DisplayDraft>(
    toDisplayDraft(initialState.input),
  );
  const [responseTab, setResponseTab] = useState<ResponseTab>("basic");
  const [openSections, setOpenSections] = useState<Record<DashboardSection, boolean>>({
    scenario: true,
    cost: true,
  });
  const [schemePanelOpen, setSchemePanelOpen] = useState(true);
  const [schemeDetailOpen, setSchemeDetailOpen] = useState<Partial<Record<string, boolean>>>({});
  const [mobileSchemePopupId, setMobileSchemePopupId] = useState<string | null>(null);
  const [setupCostsOpen, setSetupCostsOpen] = useState(false);
  const [bannerCollapsed, setBannerCollapsed] = useState(false);
  const pendingQuizSyncStarted = useRef(false);
  const currentSnapshot = useMemo(
    () => ({
      input,
      selections: {
        ...selections,
        includeGuaranteeComparison: true,
        includeFhssConcept: true,
      },
      incomeFrequency,
      expenseFrequency,
      sentAt: new Date().toISOString(),
    }),
    [expenseFrequency, incomeFrequency, input, selections],
  );

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
  const dutyIntake = withSchemes.dutyIntake;
  const savedAdvancedFieldIds = useMemo(() => getSavedDutyTier2FieldIds(input), [input]);
  const advancedFieldIds = useMemo(
    () => [...new Set([...dutyIntake.visibleTier2Fields, ...savedAdvancedFieldIds])],
    [dutyIntake.visibleTier2Fields, savedAdvancedFieldIds],
  );
  const showAdvancedTab = dutyIntake.needsTier2 || savedAdvancedFieldIds.length > 0;
  const dutyOutputsUncertain = dutyIntake.uncertaintyActive;
  const activeResponseTab: ResponseTab = showAdvancedTab ? responseTab : "basic";

  useEffect(() => {
    if (savedDashboardStateLoaded.current || initialInput) {
      return;
    }

    savedDashboardStateLoaded.current = true;
    const savedState = readSavedDashboardState(initialSnapshot);
    if (!savedState) {
      return;
    }

    setInput(savedState.input);
    setSelections(savedState.selections);
    setDisplay(toDisplayDraft(savedState.input));
  }, [initialInput, initialSnapshot]);

  useEffect(() => {
    setDisclosure({
      sources: withSchemes.sources,
      assumptions: withSchemes.assumptions,
      reviewDate: withSchemes.reviewDate,
    });
  }, [setDisclosure, withSchemes]);

  useEffect(() => {
    void trackResearchEvent({
      surface: "dashboard",
      eventName: "dashboard_viewed",
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(HOMEOWNER_DASHBOARD_STORAGE_KEY, JSON.stringify(currentSnapshot));
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [currentSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined" || pendingQuizSyncStarted.current) {
      return;
    }

    const rawPending = window.localStorage.getItem(PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY);
    if (!rawPending) {
      return;
    }

    pendingQuizSyncStarted.current = true;

    let pendingSubmission: FirstHomeQuizPersistedState | null = null;
    try {
      pendingSubmission = JSON.parse(rawPending) as FirstHomeQuizPersistedState;
    } catch {
      window.localStorage.removeItem(PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY);
      return;
    }

    void fetch("/api/quiz/first-home", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anonymousId: getAnonymousId(),
        sessionId: getSessionId(),
        stage: pendingSubmission.stage,
        input: pendingSubmission.input,
        tier1Answers: pendingSubmission.tier1Answers,
        display: pendingSubmission.display,
      }),
    }).then((response) => {
      if (response.ok) {
        window.localStorage.removeItem(PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY);
      } else {
        pendingQuizSyncStarted.current = false;
      }
    }).catch(() => {
      pendingQuizSyncStarted.current = false;
    });
  }, []);

  const depositPathway = withSchemes.pathways.find((pathway) => pathway.id === "deposit");
  const upfrontCostsPathway = withSchemes.pathways.find((pathway) => pathway.id === "upfront-costs");
  const currentScenario =
    depositPathway?.scenarioOptions?.find((scenario) => scenario.id === selections.activeDepositScenario && scenario.available) ??
    depositPathway?.scenarioOptions?.find((scenario) => scenario.available) ??
    depositPathway?.scenarioOptions?.[0];
  const hasActiveScheme = withSchemes.schemeStatuses.some((scheme) => scheme.state === "active");
  const comparisonModel = hasActiveScheme ? withSchemes : withoutSchemes;
  const currentCash = comparisonModel.cashOutlayOverlay.totalBuyerCashOutlay;
  const baselineCash = withoutSchemes.cashOutlayOverlay.totalBuyerCashOutlay;
  const currentCashDisplay = dutyOutputsUncertain ? `${formatCurrency(currentCash)}*` : formatCurrency(currentCash);
  const baselineCashDisplay = dutyOutputsUncertain ? `${formatCurrency(baselineCash)}*` : formatCurrency(baselineCash);
  const currentLvr =
    input.targetPropertyPrice > 0 && currentScenario
      ? (currentScenario.mortgageAmount / input.targetPropertyPrice) * 100
      : 0;
  const targetPriceSliderValue = Math.min(
    PROPERTY_PRICE_SLIDER_MAX,
    Math.max(PROPERTY_PRICE_SLIDER_MIN, input.targetPropertyPrice || PROPERTY_PRICE_SLIDER_MIN),
  );
  const lvrRatePenalty = currentLvr > 95 ? 0.6 : currentLvr > 80 ? 0.25 : 0;
  const displayedRate = CURRENT_MARKET_OWNER_OCCUPIER_RATE + lvrRatePenalty;
  const marketMonthlyRepayment = currentScenario
    ? amortizedMonthlyRepayment(currentScenario.mortgageAmount, displayedRate, 30)
    : 0;
  const marketRepaymentAtExpenseFrequency = fromMonthlyAmount(marketMonthlyRepayment, expenseFrequency);
  const timeToSaveYears = currentScenario ? (currentScenario.timeToSaveMonths / 12).toFixed(1) : "0.0";
  const costRows = [
    {
      label: "Home price",
      sign: "+" as const,
      currentValue: comparisonModel.cashOutlayOverlay.purchasePrice,
      baselineValue: withoutSchemes.cashOutlayOverlay.purchasePrice,
    },
    {
      label: "Bank funding",
      sign: "-" as const,
      currentValue: comparisonModel.cashOutlayOverlay.financedAmount,
      baselineValue: withoutSchemes.cashOutlayOverlay.financedAmount,
    },
    {
      label: dutyOutputsUncertain ? "Stamp duty*" : "Stamp duty",
      sign: "+" as const,
      currentValue: comparisonModel.cashOutlayOverlay.stampDuty,
      baselineValue: withoutSchemes.cashOutlayOverlay.stampDuty,
      uncertain: dutyOutputsUncertain,
    },
  ];
  const setupCostDetails = (upfrontCostsPathway?.metrics.filter((metric) => metric.id !== "upfront-total") ?? []).map(
    (metric) => ({
      ...metric,
      label:
        metric.id === "upfront-professional"
          ? "Conveyancer / solicitor"
          : metric.id === "upfront-stamping"
            ? "Verification and admin"
          : metric.label,
    }),
  );
  const purchaseCostBandSummaries = PURCHASE_COST_BANDS.map((band) => ({
    label: band.label,
    total: band.professionalFees + band.disbursements + band.stampingFee + band.registrationFees + band.pexaFee,
  }));

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

  function stateDotClass(state: "active" | "available" | "inactive" | "watch" | "neutral") {
    if (state === "active") {
      return "bg-primary";
    }
    if (state === "available") {
      return "bg-[#4a8f59]";
    }
    if (state === "watch") {
      return "bg-[#b9812f]";
    }
    if (state === "neutral") {
      return "bg-[#969286]";
    }
    return "bg-[#b3394a]";
  }

  function updateDisplay(key: keyof DisplayDraft, raw: string) {
    const formatted =
      key === "dependentChildrenCount"
        ? raw.replace(/[^\d]/g, "")
        : raw.trim().length === 0
          ? ""
          : formatCurrencyInput(parseMoneyInput(raw));

    setDisplay((current) => ({
      ...current,
      [key]: formatted,
    }));
    setInput((current) => updateInputFromDisplay(current, key, formatted));
  }

  function updateTargetPriceFromSlider(raw: string) {
    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      return;
    }

    const clamped = Math.min(PROPERTY_PRICE_SLIDER_MAX, Math.max(PROPERTY_PRICE_SLIDER_MIN, parsed));

    setDisplay((current) => ({
      ...current,
      targetPropertyPrice: formatCurrencyInput(clamped),
    }));
    setInput((current) => ({
      ...current,
      targetPropertyPrice: clamped,
    }));
  }

  const basicBooleanControls = [
    {
      label: "First home",
      active: input.firstHomeBuyer,
      icon: Home,
      onToggle: () =>
        setInput((current) => ({
          ...current,
          firstHomeBuyer: !current.firstHomeBuyer,
          existingProperty: current.firstHomeBuyer,
        })),
    },
    {
      label: "Owner occupier",
      active: input.ownerOccupier ?? true,
      icon: Home,
      onToggle: () =>
        setInput((current) => ({
          ...current,
          ownerOccupier: !(current.ownerOccupier ?? true),
        })),
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
      label: "Domestic persons",
      active: !(input.foreignBuyer ?? false),
      icon: UserRound,
      onToggle: () =>
        setInput((current) => {
          const nextForeignBuyer = !(current.foreignBuyer ?? false);

          return {
            ...current,
            foreignBuyer: nextForeignBuyer,
            foreignOwnershipMode: nextForeignBuyer ? current.foreignOwnershipMode : undefined,
          };
        }),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-20 xl:pb-0">
      <section className="animate-fade-up rounded-[1.4rem] border border-border bg-[radial-gradient(circle_at_90%_16%,rgba(122,156,137,0.22),transparent_38%),linear-gradient(180deg,#ffffff,#f3f6f1)] p-6 shadow-[0_16px_38px_rgba(33,47,37,0.11)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Your results are ready</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Your first-home dashboard</h1>
        <p className="mt-2 text-sm text-foreground-soft">Each change below updates the out-of-pocket cash straight away.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[#d7c497]/55 bg-[linear-gradient(135deg,rgba(250,242,219,0.96),rgba(244,230,188,0.9))] px-4 py-3 text-sm text-[#5c4722] shadow-[0_10px_26px_rgba(177,142,82,0.12)]">
          <p className="max-w-3xl">
            If this dashboard is useful and you want more tools like it, fill out the short survey at the bottom so we can prioritise what to build next.
          </p>
          <button
            type="button"
            className="inline-flex items-center rounded-full bg-[#7d611f] px-4 py-2 font-semibold text-white transition hover:bg-[#674f19]"
            onClick={() => {
              document.getElementById("dashboard-survey")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Fill in survey
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground">
            State: {input.homeState?.toUpperCase()}
          </span>
          <span className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground">
            Area: {input.buyingArea === "state-capital" ? "State capital" : "Regional / non-capital"}
          </span>
        </div>
      </section>

      <div className="sticky top-[5.1rem] z-30 space-y-2 md:top-[5.4rem] md:space-y-0">
      <div className="rounded-[1.35rem] border border-border bg-white/90 p-2 md:p-2.5 shadow-[0_10px_26px_rgba(33,47,37,0.1)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-baseline gap-2">
            <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-strong md:text-xs">
              Cost of your First Home
            </p>
            {bannerCollapsed ? (
              <p
                data-testid="collapsed-banner-cash-outlay"
                className={`min-w-0 truncate text-sm font-semibold tracking-normal md:text-base ${
                  dutyOutputsUncertain ? "text-foreground-soft" : "text-foreground"
                }`}
              >
                {currentCashDisplay}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-[0_4px_12px_rgba(33,47,37,0.08)] transition hover:border-primary/35 hover:bg-primary-soft"
          onClick={() => setBannerCollapsed((current) => !current)}
          aria-label={bannerCollapsed ? "Expand frozen banner" : "Collapse frozen banner"}
        >
          <span>{bannerCollapsed ? "Expand" : "Collapse"}</span>
          {bannerCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>
      {!bannerCollapsed ? (
      <div className="grid gap-2.5 md:gap-3 md:grid-cols-3 md:items-start">
        <div className="space-y-2.5 md:col-span-2">
          <section className="animate-fade-up rounded-[1rem] border border-border bg-[linear-gradient(135deg,#edf5ef,#f5f2e9)] p-2.5 md:p-3 shadow-[0_10px_24px_rgba(33,47,37,0.12)]">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  data-testid="current-cash-outlay"
                  className={`text-xl md:text-2xl font-semibold tracking-tight ${
                    dutyOutputsUncertain ? "text-foreground-soft" : "text-foreground"
                  }`}
                >
                  {currentCashDisplay}
                </p>
                <div
                  className={`rounded-full px-2 py-0.5 text-[9px] md:px-3 md:py-1 md:text-xs font-semibold ${
                    dutyOutputsUncertain ? "bg-[#f1f0ec] text-foreground-soft" : "bg-primary/10 text-primary-strong"
                  }`}
                >
                  {`vs. ${baselineCashDisplay} without eligible schemes`}
                </div>
              </div>
              {dutyOutputsUncertain ? (
                <p className="text-[11px] text-foreground-soft">
                  Duty outputs marked with * still rely on broad assumptions. {dutyIntake.reasons[0] ?? ""}
                </p>
              ) : null}
            </div>
            <label className="mt-1.5 grid gap-1 text-xs md:text-sm font-semibold">
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-1.5 md:px-2.5 md:py-2">
                <span className="whitespace-nowrap text-[11px] md:text-xs font-semibold text-foreground-soft">House Price:</span>
                <Input
                  className="h-7 w-[7.5rem] min-w-[7.5rem] text-xs md:h-8 md:w-[9rem] md:min-w-[9rem] md:text-sm"
                  value={display.targetPropertyPrice}
                  onChange={(event) => updateDisplay("targetPropertyPrice", event.currentTarget.value)}
                />
                <span className="text-foreground-soft">|</span>
                <input
                  data-testid="dashboard-target-price-slider"
                  type="range"
                  min={PROPERTY_PRICE_SLIDER_MIN}
                  max={PROPERTY_PRICE_SLIDER_MAX}
                  step={PROPERTY_PRICE_SLIDER_STEP}
                  value={targetPriceSliderValue}
                  onChange={(event) => updateTargetPriceFromSlider(event.currentTarget.value)}
                  className="w-full accent-primary"
                />
              </div>
            </label>
          </section>

          <section className="animate-fade-up rounded-[1rem] border border-border bg-white/95 p-2.5 shadow-[0_8px_20px_rgba(33,47,37,0.08)]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-strong md:text-xs">
                Choose your deposit path
              </p>
              <div className="hidden items-center gap-3 text-xs text-foreground-soft md:flex">
                <span>{`Deposit ${currentScenario ? formatCurrency(currentScenario.depositAmount) : "Unavailable"}`}</span>
                <span>{`Repayment ${formatCurrency(marketRepaymentAtExpenseFrequency)}`}</span>
                <span>{`Save ${timeToSaveYears}y`}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 overflow-x-auto md:hidden">
              <span className="shrink-0 text-[11px] font-semibold text-foreground-soft">Chosen Deposit:</span>
              {(depositPathway?.scenarioOptions ?? []).map((scenario) => {
                const selected = currentScenario?.id === scenario.id;

                return (
                  <button
                    key={`compact-mobile-${scenario.id}`}
                    type="button"
                    disabled={!scenario.available}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "bg-primary text-white"
                        : "bg-surface text-foreground ring-1 ring-border"
                    } ${!scenario.available ? "opacity-45" : ""}`}
                    onClick={() =>
                      setSelections((current) => ({
                        ...current,
                        activeDepositScenario: scenario.id,
                      }))
                    }
                  >
                    {scenario.depositPercent}%
                  </button>
                );
              })}
            </div>
            <div className="mt-2 hidden grid-cols-4 gap-2 md:grid">
              {(depositPathway?.scenarioOptions ?? []).map((scenario) => {
                const selected = currentScenario?.id === scenario.id;

                return (
                  <button
                    key={`compact-desktop-${scenario.id}`}
                    type="button"
                    disabled={!scenario.available}
                    className={`rounded-xl border px-3 py-2 text-left transition ${
                      selected
                        ? "border-primary bg-primary text-white shadow-[0_8px_18px_rgba(74,124,89,0.22)]"
                        : "border-border bg-surface text-foreground"
                    } ${!scenario.available ? "opacity-45" : ""}`}
                    onClick={() =>
                      setSelections((current) => ({
                        ...current,
                        activeDepositScenario: scenario.id,
                      }))
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{scenario.depositPercent}%</span>
                      {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </div>
                    <p className={`mt-1 text-[11px] ${selected ? "text-white/85" : "text-foreground-soft"}`}>
                      {requirementLabelForScenario(scenario)}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <Card className="animate-fade-up border border-border bg-white/95 p-2 shadow-soft md:hidden">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-soft">Scheme tracker</p>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {withSchemes.schemeStatuses.map((scheme) => (
              <button
                key={`mobile-${scheme.id}`}
                type="button"
                className={`relative rounded-lg border px-1 py-1.5 text-[10px] font-semibold leading-tight ${schemePillClass(scheme.state)}`}
                onClick={() => setMobileSchemePopupId(scheme.id)}
              >
                <span className="absolute right-1 top-0.5 text-[9px] font-semibold opacity-80">(i)</span>
                <span className="block pr-3 text-left">
                  {scheme.id === "stamp-duty"
                    ? "Stamp Duty"
                    : scheme.id === "guarantee"
                      ? "First Home Guarantee"
                      : scheme.id === "help-to-buy"
                        ? "Help to buy"
                        : "Super saver"}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card className="hidden h-fit bg-white/95 p-2.5 shadow-soft md:block">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight">Scheme tracker</h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground shadow-[0_4px_12px_rgba(33,47,37,0.08)] transition hover:border-primary/35 hover:bg-primary-soft"
              onClick={() => setSchemePanelOpen((current) => !current)}
              aria-label="Toggle scheme tracker"
            >
              <span>{schemePanelOpen ? "Collapse" : "Expand"}</span>
              {schemePanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          {schemePanelOpen ? (
            <div className="mt-3 space-y-2">
              {withSchemes.schemeStatuses.map((scheme) => (
                <div key={scheme.id} className={`rounded-lg border p-2 ${schemePillClass(scheme.state)}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 text-left"
                    onClick={() => toggleSchemeDetail(scheme.id)}
                  >
                    <span className="text-[11px] font-semibold leading-4">{scheme.label}</span>
                    <span className="inline-flex items-center gap-1">
                      {scheme.state === "active" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : scheme.state === "watch" || scheme.state === "available" || scheme.state === "neutral" ? (
                        <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      )}
                      {schemeDetailOpen[scheme.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                  {schemeDetailOpen[scheme.id] ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-[11px] leading-4">{scheme.detail}</p>
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
            <p className="mt-3 text-xs text-foreground-soft">
              Expand to view active relief and guarantee pathways.
            </p>
          )}
        </Card>
      </div>
      ) : null}
      </div>
      </div>
      <div className="order-2">
      <SectionCard
        title="Your responses"
        subtitle="Outputs are estimates only. Please refer to official links to verify your personal situation."
        isOpen={openSections.scenario}
        onToggle={() => toggleSection("scenario")}
      >
        <div className="space-y-4 md:space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeResponseTab === "basic" ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
              }`}
              onClick={() => setResponseTab("basic")}
            >
              Basic
            </button>
            {showAdvancedTab ? (
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activeResponseTab === "advanced" ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                }`}
                onClick={() => setResponseTab("advanced")}
              >
                Advanced
              </button>
            ) : null}
          </div>

          {activeResponseTab === "basic" ? (
            <div className="space-y-4">
              {showAdvancedTab && dutyIntake.needsTier2 ? (
                <div className="rounded-2xl border border-border bg-[#f1f0ec] p-4 text-sm text-foreground-soft">
                  Advanced duty questions are now relevant for this path. Open <span className="font-semibold">Advanced</span> to finish Tier 2.{" "}
                  {dutyIntake.reasons[0] ?? ""}
                </div>
              ) : null}

              <div className="grid gap-1.5 md:gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {basicBooleanControls.map((control) => {
                  const Icon = control.icon;

                  return (
                    <button
                      key={control.label}
                      type="button"
                      className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-left transition-colors md:px-2.5 md:py-2 ${compactBooleanClass(
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

              <div className="grid gap-2 md:gap-3 lg:grid-cols-2">
                <div className="grid gap-2">
                  <span className="text-sm font-semibold">State / territory</span>
                  <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                    {HOME_STATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors md:text-[11px] ${
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
                  <span className="text-sm font-semibold">Property type</span>
                  <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-2">
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors md:text-[11px] ${
                          (input.propertyTypeDetailed ?? "established-home") === option.value
                            ? "bg-primary text-white"
                            : "bg-surface ring-1 ring-border hover:bg-surface-muted"
                        }`}
                        onClick={() =>
                          setInput((current) => ({
                            ...current,
                            propertyTypeDetailed: option.value,
                            buyingNewHome:
                              option.value === "new-home" ||
                              option.value === "off-the-plan-home" ||
                              option.value === "house-and-land-package",
                          }))
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <span className="text-sm font-semibold">Buying setup</span>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    {([
                      ["solo", "Buying alone"],
                      ["joint", "Buying jointly"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors md:px-3 md:py-1.5 md:text-[11px] ${
                          input.buyingSoloOrJoint === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border hover:bg-surface-muted"
                        }`}
                        onClick={() =>
                          setInput((current) => ({
                            ...current,
                            buyingSoloOrJoint: value,
                          }))
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <span className="text-sm font-semibold">Buying area</span>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    {([
                      ["state-capital", "State capital"],
                      ["regional", "Regional / outside metro"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors md:px-3 md:py-1.5 md:text-[11px] ${
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

                <label className="grid gap-1.5 md:gap-2 text-sm font-semibold lg:max-w-sm">
                  <span>Current savings</span>
                  <Input
                    className="h-9 text-sm md:h-10 md:text-base"
                    value={display.currentSavings}
                    onChange={(event) => updateDisplay("currentSavings", event.currentTarget.value)}
                  />
                </label>
                <label className="grid gap-1.5 md:gap-2 text-sm font-semibold lg:max-w-sm">
                  <span>Household income (previous FY)</span>
                  <Input
                    className="h-9 text-sm md:h-10 md:text-base"
                    value={display.actHouseholdIncome}
                    onChange={(event) => updateDisplay("actHouseholdIncome", event.currentTarget.value)}
                  />
                </label>
                <label className="grid gap-1.5 md:gap-2 text-sm font-semibold lg:max-w-sm">
                  <span>Dependant children</span>
                  <Input
                    className="h-9 text-sm md:h-10 md:text-base"
                    value={display.dependentChildrenCount}
                    onChange={(event) => updateDisplay("dependentChildrenCount", event.currentTarget.value)}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {dutyIntake.hasTier3EdgeCase || !dutyIntake.tier2Complete ? (
                <div className="rounded-2xl border border-border bg-[#f1f0ec] p-4 text-sm text-foreground-soft">
                  {dutyIntake.hasTier3EdgeCase
                    ? "This path still uses broad duty assumptions even after Advanced is complete."
                    : "Complete the Advanced answers below to tighten the duty estimate."}
                </div>
              ) : null}

              {advancedFieldIds.length === 0 ? (
                <p className="text-sm text-foreground-soft">No Advanced duty answers are needed for the current scenario.</p>
              ) : (
                <div className="grid gap-3">
                  {advancedFieldIds.map((fieldId) => {
                    if (fieldId === "buyerEntityType") {
                      return (
                        <div key={fieldId} className="grid gap-2">
                          <span className="text-sm font-semibold">{ADVANCED_FIELD_LABELS[fieldId]}</span>
                          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
                            {([
                              ["individuals", "Individuals"],
                              ["trust", "Trust"],
                              ["company", "Company"],
                              ["smsf", "SMSF"],
                              ["corporate-trustee", "Corporate trustee"],
                            ] as const).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  input.buyerEntityType === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                                }`}
                                onClick={() =>
                                  setInput((current) => ({
                                    ...current,
                                    buyerEntityType: value,
                                  }))
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (fieldId === "jointEligibilityAligned") {
                      return (
                        <div key={fieldId} className="grid gap-2">
                          <span className="text-sm font-semibold">{ADVANCED_FIELD_LABELS[fieldId]}</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {([
                              [true, "Aligned"],
                              [false, "Mixed profiles"],
                            ] as const).map(([value, label]) => (
                              <button
                                key={label}
                                type="button"
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  input.jointEligibilityAligned === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                                }`}
                                onClick={() =>
                                  setInput((current) => ({
                                    ...current,
                                    jointEligibilityAligned: value,
                                  }))
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (fieldId === "foreignOwnershipMode") {
                      return (
                        <div key={fieldId} className="grid gap-2">
                          <span className="text-sm font-semibold">{ADVANCED_FIELD_LABELS[fieldId]}</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {([
                              ["full", "Full purchase"],
                              ["partial", "Partial only"],
                            ] as const).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  input.foreignOwnershipMode === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                                }`}
                                onClick={() =>
                                  setInput((current) => ({
                                    ...current,
                                    foreignOwnershipMode: value,
                                  }))
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (fieldId === "waRegion") {
                      return (
                        <div key={fieldId} className="grid gap-2">
                          <span className="text-sm font-semibold">{ADVANCED_FIELD_LABELS[fieldId]}</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {([
                              ["perth-peel", "Perth / Peel"],
                              ["outside-perth-peel", "Outside Perth / Peel"],
                            ] as const).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  input.waRegion === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                                }`}
                                onClick={() =>
                                  setInput((current) => ({
                                    ...current,
                                    waRegion: value,
                                  }))
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (fieldId === "qldConcessionPath") {
                      return (
                        <div key={fieldId} className="grid gap-2">
                          <span className="text-sm font-semibold">{ADVANCED_FIELD_LABELS[fieldId]}</span>
                          <div className="grid gap-1.5 md:grid-cols-2">
                            {([
                              ["home-concession", "Home concession"],
                              ["first-home-home-concession", "First-home home"],
                              ["first-home-vacant-land-concession", "First-home vacant land"],
                              ["no-concession-path", "No concession"],
                            ] as const).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  input.qldConcessionPath === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                                }`}
                                onClick={() =>
                                  setInput((current) => ({
                                    ...current,
                                    qldConcessionPath: value,
                                  }))
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (fieldId === "saReliefPath") {
                      return (
                        <div key={fieldId} className="grid gap-2">
                          <span className="text-sm font-semibold">{ADVANCED_FIELD_LABELS[fieldId]}</span>
                          <div className="grid gap-1.5 md:grid-cols-2">
                            {([
                              ["new-home", "New home"],
                              ["off-the-plan-apartment", "Off-the-plan apartment"],
                              ["vacant-land", "Vacant land"],
                              ["none", "None of those"],
                            ] as const).map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                  input.saReliefPath === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                                }`}
                                onClick={() =>
                                  setInput((current) => ({
                                    ...current,
                                    saReliefPath: value,
                                  }))
                                }
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (fieldId === "dependentChildrenCount") {
                      return (
                        <label key={fieldId} className="grid gap-2 text-sm font-semibold lg:max-w-sm">
                          <span>{ADVANCED_FIELD_LABELS[fieldId]}</span>
                          <Input
                            className="h-9 text-sm md:h-10 md:text-base"
                            value={display.dependentChildrenCount}
                            onChange={(event) => updateDisplay("dependentChildrenCount", event.currentTarget.value)}
                          />
                        </label>
                      );
                    }

                    return (
                      <div key={fieldId} className="grid gap-2">
                        <span className="text-sm font-semibold">{ADVANCED_FIELD_LABELS[fieldId]}</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {([
                            [true, "Yes"],
                            [false, "No"],
                          ] as const).map(([value, label]) => (
                            <button
                              key={label}
                              type="button"
                              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                                input.ntHouseAndLandEligiblePath === value ? "bg-primary text-white" : "bg-surface ring-1 ring-border"
                              }`}
                              onClick={() =>
                                setInput((current) => ({
                                  ...current,
                                  ntHouseAndLandEligiblePath: value,
                                }))
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>
      </div>

      <div className="order-3">
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

            {costRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-border text-sm"
              >
                <div className={`px-4 py-3 font-medium ${row.uncertain ? "text-foreground-soft" : "text-foreground"}`}>
                  <span className="mr-2 inline-flex min-w-[1.1rem] justify-center font-semibold text-primary-strong">
                    {row.sign}
                  </span>
                  {row.label}
                </div>
                <div className={`px-4 py-3 font-semibold ${row.uncertain ? "text-foreground-soft" : "text-foreground"}`}>
                  {row.uncertain ? `${signedCurrency(row.currentValue, row.sign)}*` : signedCurrency(row.currentValue, row.sign)}
                </div>
                <div className="bg-[#f6f4ee] px-4 py-3 font-semibold text-foreground-soft">
                  {row.uncertain ? `${signedCurrency(row.baselineValue, row.sign)}*` : signedCurrency(row.baselineValue, row.sign)}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-border text-sm">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-3 text-left font-medium text-foreground"
                onClick={() => setSetupCostsOpen((current) => !current)}
              >
                <span className="inline-flex min-w-[1.1rem] justify-center font-semibold text-primary-strong">+</span>
                <span>Additional Purchase Costs</span>
                {setupCostsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <div className="px-4 py-3 font-semibold text-foreground">
                {signedCurrency(comparisonModel.cashOutlayOverlay.otherUpfrontCosts, "+")}
              </div>
              <div className="bg-[#f6f4ee] px-4 py-3 font-semibold text-foreground-soft">
                {signedCurrency(withoutSchemes.cashOutlayOverlay.otherUpfrontCosts, "+")}
              </div>
            </div>
            {setupCostsOpen ? (
              <div className="border-t border-border bg-white p-4">
                <div className="space-y-2">
                  {setupCostDetails.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5 text-sm">
                      <span className="text-foreground-soft">
                        <span
                          className="cursor-help underline decoration-dotted"
                          title={SETUP_COST_HINTS[metric.id] ?? "Settlement-related setup cost"}
                        >
                          {metric.label}
                        </span>
                      </span>
                      <span className="font-semibold">{metric.value}</span>
                    </div>
                  ))}
                  <div className="grid gap-2 pt-2 text-xs text-foreground-soft md:grid-cols-2">
                    {purchaseCostBandSummaries.map((band) => (
                      <div key={band.label} className="rounded-lg bg-surface px-3 py-2">
                        <span className="font-semibold text-foreground">{band.label}</span>: about {formatCurrency(band.total)}
                      </div>
                    ))}
                  </div>
                  <p className="pt-2 text-xs text-foreground-soft">
                    NSW-guided estimate using 2025/26 NSW Land Registry registration fees, FY26 PEXA pricing, and current conveyancer market ranges by price band. This does not include building and pest inspections, strata reports, lender fees, removals, or urgent contract review surcharges.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] border-t border-border text-sm">
              <div className={`px-4 py-4 font-semibold ${dutyOutputsUncertain ? "bg-[#d8d4ca] text-foreground-soft" : "bg-primary text-white"}`}>
                {dutyOutputsUncertain ? "Funds required from you*" : "Funds required from you"}
              </div>
              <div className={`px-4 py-4 text-lg font-semibold ${dutyOutputsUncertain ? "bg-[#ece9e1] text-foreground-soft" : "bg-primary text-white"}`}>
                {currentCashDisplay}
              </div>
              <div
                data-testid="baseline-cash-outlay"
                className="bg-[#dcd8cf] px-4 py-4 text-lg font-semibold text-foreground"
              >
                {baselineCashDisplay}
              </div>
            </div>
          </div>

          <p className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground-soft">
            Funds required from you = <span className="font-semibold">Home price - Bank funding + Stamp duty + Additional Purchase Costs</span>.
          </p>

          {dutyOutputsUncertain ? (
            <p className="rounded-xl border border-border bg-[#f1f0ec] px-4 py-3 text-sm text-foreground-soft">
              Duty outputs marked with * still use broad assumptions. {dutyIntake.reasons.join(" ")}
            </p>
          ) : null}

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
      </div>

      <div className="order-4">
        <ResearchIntakeForm
          surface="dashboard"
          title="What still feels hardest about buying your first home?"
          intro="Tell us about a real situation from the last few weeks. We use this to decide what to build next."
          context={deriveResearchContextFromHomeownerInput(input)}
        />
      </div>

      {mobileSchemePopupId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 md:hidden">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
            {(() => {
              const scheme = withSchemes.schemeStatuses.find((entry) => entry.id === mobileSchemePopupId);
              if (!scheme) {
                return null;
              }

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stateDotClass(scheme.state)}`} />
                      <h3 className="text-base font-semibold">{scheme.label}</h3>
                    </div>
                    <button
                      type="button"
                      className="rounded-lg border border-border px-2 py-1 text-xs font-semibold"
                      onClick={() => setMobileSchemePopupId(null)}
                    >
                      Close
                    </button>
                  </div>
                  <p className="text-sm text-foreground-soft">{scheme.detail}</p>
                  <div className="flex flex-wrap gap-3 text-xs font-semibold">
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
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
