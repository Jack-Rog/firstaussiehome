"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDisclosure } from "@/components/compliance/disclosure-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deriveDutyIntakeState } from "@/src/lib/analysis/homeowner-duty-intake";
import {
  buildHomeownerPathwayOutput,
  DEFAULT_HOMEOWNER_PATHWAY_INPUT,
  DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
} from "@/src/lib/analysis/homeowner-pathway-analysis";
import {
  HOMEOWNER_DASHBOARD_STORAGE_KEY,
  type HomeownerDashboardSnapshot,
} from "@/src/lib/homeowner-dashboard-storage";
import type {
  DutyTier2FieldId,
  HomeownerPathwayInput,
  HomeownerPathwaySelections,
} from "@/src/lib/types";
import { formatCurrencyInput, parseMoneyInput } from "@/src/lib/utils";

type Stage = "tier1" | "tier2" | "account";

type Tier1QuestionId =
  | "homeState"
  | "firstHomeBuyer"
  | "ownerOccupier"
  | "targetPropertyPrice"
  | "australianCitizenOrResident"
  | "buyingSoloOrJoint"
  | "foreignBuyer"
  | "propertyTypeDetailed"
  | "buyingArea"
  | "actHouseholdIncome"
  | "dependentChildrenCount"
  | "currentSavings";

type Tier1AnswerMap = Partial<Record<
  Exclude<
    Tier1QuestionId,
    "targetPropertyPrice" | "actHouseholdIncome" | "currentSavings" | "dependentChildrenCount"
  >,
  boolean | string
>>;

type DisplayDraft = {
  targetPropertyPrice: string;
  actHouseholdIncome: string;
  currentSavings: string;
  dependentChildrenCount: string;
};

type Tier1Question =
  | {
      type: "boolean";
      id: Exclude<
        Tier1QuestionId,
        | "homeState"
        | "buyingSoloOrJoint"
        | "propertyTypeDetailed"
        | "buyingArea"
        | "targetPropertyPrice"
        | "actHouseholdIncome"
        | "currentSavings"
        | "dependentChildrenCount"
      >;
      prompt: string;
      applyAnswer: (current: HomeownerPathwayInput, answer: boolean) => HomeownerPathwayInput;
    }
  | {
      type: "choice";
      id: Extract<Tier1QuestionId, "homeState" | "buyingSoloOrJoint" | "propertyTypeDetailed" | "buyingArea">;
      prompt: string;
      options: Array<{
        value: string;
        label: string;
      }>;
      applyAnswer: (current: HomeownerPathwayInput, answer: string) => HomeownerPathwayInput;
    }
  | {
      type: "currency";
      id: Extract<Tier1QuestionId, "targetPropertyPrice" | "actHouseholdIncome" | "currentSavings">;
      prompt: string;
      placeholder: string;
    }
  | {
      type: "integer";
      id: Extract<Tier1QuestionId, "dependentChildrenCount">;
      prompt: string;
      placeholder: string;
    };

type Tier2Question =
  | {
      type: "choice";
      id: Exclude<DutyTier2FieldId, "ntHouseAndLandEligiblePath" | "dependentChildrenCount">;
      prompt: string;
      options: Array<{
        value: string;
        label: string;
      }>;
      applyAnswer: (current: HomeownerPathwayInput, answer: string) => HomeownerPathwayInput;
    }
  | {
      type: "boolean";
      id: Extract<DutyTier2FieldId, "ntHouseAndLandEligiblePath">;
      prompt: string;
      applyAnswer: (current: HomeownerPathwayInput, answer: boolean) => HomeownerPathwayInput;
    }
  | {
      type: "integer";
      id: Extract<DutyTier2FieldId, "dependentChildrenCount">;
      prompt: string;
      placeholder: string;
    };

const QUIZ_STORAGE_KEY = "aussiesfirsthome:first-home-quiz";

const TIER1_PAGES: Array<{
  title: string;
  questions: Tier1Question[];
}> = [
  {
    title: "Tier 1: Purchase basics",
    questions: [
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
        applyAnswer: (current, answer) => ({
          ...current,
          homeState: answer as HomeownerPathwayInput["homeState"],
          livingInNsw: answer === "nsw",
        }),
      },
      {
        type: "currency",
        id: "targetPropertyPrice",
        prompt: "What price are you aiming to buy at?",
        placeholder: "$800,000",
      },
      {
        type: "boolean",
        id: "firstHomeBuyer",
        prompt: "Is this your first home purchase?",
        applyAnswer: (current, answer) => ({
          ...current,
          firstHomeBuyer: answer,
          existingProperty: !answer,
        }),
      },
      {
        type: "boolean",
        id: "ownerOccupier",
        prompt: "Will at least one buyer live in the property as their home?",
        applyAnswer: (current, answer) => ({
          ...current,
          ownerOccupier: answer,
        }),
      },
    ],
  },
  {
    title: "Tier 1: Buyer profile",
    questions: [
      {
        type: "boolean",
        id: "australianCitizenOrResident",
        prompt: "Are all buyers Australian citizens or permanent residents?",
        applyAnswer: (current, answer) => ({
          ...current,
          australianCitizenOrResident: answer,
        }),
      },
      {
        type: "choice",
        id: "buyingSoloOrJoint",
        prompt: "Are you buying alone or jointly?",
        options: [
          { value: "solo", label: "Buying alone" },
          { value: "joint", label: "Buying jointly" },
        ],
        applyAnswer: (current, answer) => ({
          ...current,
          buyingSoloOrJoint: answer as HomeownerPathwayInput["buyingSoloOrJoint"],
        }),
      },
      {
        type: "boolean",
        id: "foreignBuyer",
        prompt: "Are all buyers not foreign persons for duty purposes?",
        applyAnswer: (current, answer) => ({
          ...current,
          foreignBuyer: !answer,
          foreignOwnershipMode: answer ? undefined : current.foreignOwnershipMode,
        }),
      },
      {
        type: "choice",
        id: "propertyTypeDetailed",
        prompt: "What are you buying?",
        options: [
          { value: "established-home", label: "Established home" },
          { value: "new-home", label: "New home" },
          { value: "vacant-land", label: "Vacant land" },
          { value: "off-the-plan-home", label: "Off-the-plan home" },
          { value: "house-and-land-package", label: "House-and-land package" },
        ],
        applyAnswer: (current, answer) => ({
          ...current,
          propertyTypeDetailed: answer as HomeownerPathwayInput["propertyTypeDetailed"],
          buyingNewHome:
            answer === "new-home" || answer === "off-the-plan-home" || answer === "house-and-land-package",
        }),
      },
      {
        type: "choice",
        id: "buyingArea",
        prompt: "Is the property in a state capital/metro area or outside one?",
        options: [
          { value: "state-capital", label: "State capital / metro" },
          { value: "regional", label: "Outside the capital / metro" },
        ],
        applyAnswer: (current, answer) => ({
          ...current,
          buyingArea: answer as HomeownerPathwayInput["buyingArea"],
        }),
      },
    ],
  },
  {
    title: "Tier 1: Household numbers",
    questions: [
      {
        type: "currency",
        id: "actHouseholdIncome",
        prompt: "What is your household income from the previous financial year?",
        placeholder: "$120,000",
      },
      {
        type: "integer",
        id: "dependentChildrenCount",
        prompt: "How many dependant children are in the household?",
        placeholder: "0",
      },
      {
        type: "currency",
        id: "currentSavings",
        prompt: "How much do you already have saved?",
        placeholder: "$50,000",
      },
    ],
  },
];

const TIER2_QUESTION_BY_FIELD: Record<DutyTier2FieldId, Tier2Question> = {
  buyerEntityType: {
    type: "choice",
    id: "buyerEntityType",
    prompt: "Are all buyers individuals rather than a trust, company, SMSF, or corporate trustee?",
    options: [
      { value: "individuals", label: "All buyers are individuals" },
      { value: "trust", label: "Trust involved" },
      { value: "company", label: "Company involved" },
      { value: "smsf", label: "SMSF involved" },
      { value: "corporate-trustee", label: "Corporate trustee involved" },
    ],
    applyAnswer: (current, answer) => ({
      ...current,
      buyerEntityType: answer as HomeownerPathwayInput["buyerEntityType"],
    }),
  },
  jointEligibilityAligned: {
    type: "choice",
    id: "jointEligibilityAligned",
    prompt: "If buying jointly, do all buyers have the same first-home, residency, and foreign-buyer status?",
    options: [
      { value: "true", label: "Yes, profiles align" },
      { value: "false", label: "No, profiles differ" },
    ],
    applyAnswer: (current, answer) => ({
      ...current,
      jointEligibilityAligned: answer === "true",
    }),
  },
  foreignOwnershipMode: {
    type: "choice",
    id: "foreignOwnershipMode",
    prompt: "If any buyer is foreign, will the foreign buyer own the full purchase or only part of it?",
    options: [
      { value: "full", label: "Full purchase" },
      { value: "partial", label: "Partial ownership only" },
    ],
    applyAnswer: (current, answer) => ({
      ...current,
      foreignOwnershipMode: answer as HomeownerPathwayInput["foreignOwnershipMode"],
    }),
  },
  waRegion: {
    type: "choice",
    id: "waRegion",
    prompt: "Is the property in Perth/Peel or outside Perth/Peel?",
    options: [
      { value: "perth-peel", label: "Perth / Peel" },
      { value: "outside-perth-peel", label: "Outside Perth / Peel" },
    ],
    applyAnswer: (current, answer) => ({
      ...current,
      waRegion: answer as HomeownerPathwayInput["waRegion"],
    }),
  },
  qldConcessionPath: {
    type: "choice",
    id: "qldConcessionPath",
    prompt: "Which Queensland path best fits?",
    options: [
      { value: "home-concession", label: "Home concession" },
      { value: "first-home-home-concession", label: "First-home home concession" },
      { value: "first-home-vacant-land-concession", label: "First-home vacant land concession" },
      { value: "no-concession-path", label: "No concession path" },
    ],
    applyAnswer: (current, answer) => ({
      ...current,
      qldConcessionPath: answer as HomeownerPathwayInput["qldConcessionPath"],
    }),
  },
  saReliefPath: {
    type: "choice",
    id: "saReliefPath",
    prompt: "If seeking South Australia first-home relief, which path fits?",
    options: [
      { value: "new-home", label: "New home" },
      { value: "off-the-plan-apartment", label: "Off-the-plan apartment" },
      { value: "vacant-land", label: "Vacant land" },
      { value: "none", label: "None of those" },
    ],
    applyAnswer: (current, answer) => ({
      ...current,
      saReliefPath: answer as HomeownerPathwayInput["saReliefPath"],
    }),
  },
  dependentChildrenCount: {
    type: "integer",
    id: "dependentChildrenCount",
    prompt: "Confirm the exact number of dependant children for the household.",
    placeholder: "0",
  },
  ntHouseAndLandEligiblePath: {
    type: "boolean",
    id: "ntHouseAndLandEligiblePath",
    prompt: "Is this a house-and-land package that may fall under the targeted exemption path?",
    applyAnswer: (current, answer) => ({
      ...current,
      ntHouseAndLandEligiblePath: answer,
    }),
  },
};

const SUPPORT_CHALLENGE_OPTIONS = [
  { key: "deposit-need", label: "Figuring out how much deposit I actually need" },
  { key: "saving-consistently", label: "Saving consistently for the deposit" },
  { key: "invest-or-save", label: "Deciding whether to invest or save" },
  { key: "debt-vs-saving", label: "Paying off debt vs saving" },
  { key: "understanding-schemes", label: "Understanding government schemes" },
  { key: "affordable-price-range", label: "Knowing what price range I can afford" },
  { key: "long-term-plan", label: "Building a long-term financial plan" },
  { key: "something-else", label: "Something else" },
] as const;

type SupportChallengeKey = (typeof SUPPORT_CHALLENGE_OPTIONS)[number]["key"];

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

function getInitialDisplay(): DisplayDraft {
  return {
    targetPropertyPrice: "",
    actHouseholdIncome: "",
    currentSavings: "",
    dependentChildrenCount: "",
  };
}

function formatTier1Answer(questionId: Tier1Question["id"], value: string) {
  if (questionId === "dependentChildrenCount") {
    return value.replace(/[^\d]/g, "");
  }

  return value.trim().length === 0 ? "" : formatCurrencyInput(parseMoneyInput(value));
}

function applyNumericDisplay(
  current: HomeownerPathwayInput,
  fieldId: keyof DisplayDraft,
  displayValue: string,
) {
  if (fieldId === "dependentChildrenCount") {
    const count = displayValue.trim().length === 0 ? undefined : Number(displayValue);

    return {
      ...current,
      dependentChildrenCount: count,
      dependants: (count ?? 0) > 0,
    };
  }

  const parsed = parseMoneyInput(displayValue);

  return {
    ...current,
    [fieldId]: parsed,
  };
}

function isTier1QuestionAnswered(
  question: Tier1Question,
  answers: Tier1AnswerMap,
  display: DisplayDraft,
) {
  if (question.type === "currency" || question.type === "integer") {
    return display[question.id].trim().length > 0;
  }

  return question.id in answers;
}

function isTier2QuestionAnswered(question: Tier2Question, input: HomeownerPathwayInput, display: DisplayDraft) {
  if (question.type === "integer") {
    return display.dependentChildrenCount.trim().length > 0;
  }

  const value = input[question.id];

  if (typeof value === "boolean") {
    return true;
  }

  return typeof value === "string" && value.length > 0;
}

function optionButtonClass(active: boolean) {
  return active
    ? "bg-primary text-white shadow-[0_8px_20px_rgba(74,124,89,0.3)]"
    : "bg-surface text-foreground ring-1 ring-border hover:bg-surface-muted";
}

export function FirstHomeQuizFlow() {
  const router = useRouter();
  const { setDisclosure } = useDisclosure();
  const [stage, setStage] = useState<Stage>("tier1");
  const [tier1PageIndex, setTier1PageIndex] = useState(0);
  const [input, setInput] = useState<HomeownerPathwayInput>({
    ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
    livingInNsw: true,
  });
  const [tier1Answers, setTier1Answers] = useState<Tier1AnswerMap>({});
  const [display, setDisplay] = useState<DisplayDraft>(getInitialDisplay());
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportTried, setSupportTried] = useState("");
  const [supportChallenge, setSupportChallenge] = useState<SupportChallengeKey | null>(null);
  const [supportFrustration, setSupportFrustration] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tier1Page = TIER1_PAGES[tier1PageIndex] ?? TIER1_PAGES[0];
  const dutyIntake = useMemo(() => deriveDutyIntakeState(input), [input]);
  const tier2Questions = useMemo(
    () => dutyIntake.visibleTier2Fields.map((fieldId) => TIER2_QUESTION_BY_FIELD[fieldId]),
    [dutyIntake.visibleTier2Fields],
  );
  const previewSelections = useMemo(() => buildDefaultSelections(input), [input]);
  const preview = useMemo(() => buildHomeownerPathwayOutput(input, previewSelections), [input, previewSelections]);
  const canContinueTier1 = tier1Page.questions.every((question) => isTier1QuestionAnswered(question, tier1Answers, display));
  const canContinueTier2 = tier2Questions.every((question) => isTier2QuestionAnswered(question, input, display));
  const stageLabels = dutyIntake.needsTier2 ? ["Tier 1", "Tier 2", "Final details"] : ["Tier 1", "Final details"];
  const currentStagePosition =
    stage === "tier1" ? 0 : stage === "tier2" && dutyIntake.needsTier2 ? 1 : stageLabels.length - 1;

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
        tier1PageIndex?: number;
        input?: HomeownerPathwayInput;
        tier1Answers?: Tier1AnswerMap;
        display?: DisplayDraft;
        supportName?: string;
        supportEmail?: string;
        supportTried?: string;
        supportChallenge?: SupportChallengeKey | null;
        supportFrustration?: 1 | 2 | 3 | 4 | 5 | null;
      };

      if (saved.stage) {
        setStage(saved.stage);
      }
      if (typeof saved.tier1PageIndex === "number") {
        setTier1PageIndex(saved.tier1PageIndex);
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
      if (saved.tier1Answers) {
        setTier1Answers(saved.tier1Answers);
      }
      if (saved.display) {
        setDisplay((current) => ({
          ...current,
          ...saved.display,
        }));
      }
      if (saved.supportName) {
        setSupportName(saved.supportName);
      }
      if (saved.supportEmail) {
        setSupportEmail(saved.supportEmail);
      }
      if (saved.supportTried) {
        setSupportTried(saved.supportTried);
      }
      if (saved.supportChallenge) {
        setSupportChallenge(saved.supportChallenge);
      }
      if (saved.supportFrustration) {
        setSupportFrustration(saved.supportFrustration);
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
          tier1PageIndex,
          input,
          tier1Answers,
          display,
          supportName,
          supportEmail,
          supportTried,
          supportChallenge,
          supportFrustration,
        }),
      );
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    stage,
    tier1PageIndex,
    input,
    tier1Answers,
    display,
    supportName,
    supportEmail,
    supportTried,
    supportChallenge,
    supportFrustration,
  ]);

  useEffect(() => {
    if (stage === "tier2" && !dutyIntake.needsTier2) {
      setStage("account");
    }
  }, [dutyIntake.needsTier2, stage]);

  function answerTier1Boolean(
    question: Extract<Tier1Question, { type: "boolean" }>,
    answer: boolean,
  ) {
    setInput((current) => question.applyAnswer(current, answer));
    setTier1Answers((current) => ({
      ...current,
      [question.id]: answer,
    }));
  }

  function answerTier1Choice(
    question: Extract<Tier1Question, { type: "choice" }>,
    answer: string,
  ) {
    setInput((current) => question.applyAnswer(current, answer));
    setTier1Answers((current) => ({
      ...current,
      [question.id]: answer,
    }));
  }

  function answerTier1Display(fieldId: keyof DisplayDraft, raw: string) {
    const formatted = formatTier1Answer(fieldId as Tier1Question["id"], raw);

    setDisplay((current) => ({
      ...current,
      [fieldId]: formatted,
    }));
    setInput((current) => applyNumericDisplay(current, fieldId, formatted));
  }

  function answerTier2Choice(
    question: Extract<Tier2Question, { type: "choice" }>,
    answer: string,
  ) {
    setInput((current) => question.applyAnswer(current, answer));
  }

  function answerTier2Boolean(
    question: Extract<Tier2Question, { type: "boolean" }>,
    answer: boolean,
  ) {
    setInput((current) => question.applyAnswer(current, answer));
  }

  function goNextTier1() {
    if (!canContinueTier1) {
      return;
    }

    if (tier1PageIndex < TIER1_PAGES.length - 1) {
      setTier1PageIndex((current) => current + 1);
      return;
    }

    setStage(dutyIntake.needsTier2 ? "tier2" : "account");
  }

  function goBackTier1() {
    if (tier1PageIndex > 0) {
      setTier1PageIndex((current) => current - 1);
    }
  }

  function goBackTier2() {
    setStage("tier1");
    setTier1PageIndex(TIER1_PAGES.length - 1);
  }

  async function createAccountAndContinue() {
    setIsSubmitting(true);
    setSupportError(null);

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
        name: supportName.trim() || "there",
        email: supportEmail.trim(),
        story: supportTried.trim(),
      },
      incomeFrequency: "annually",
      expenseFrequency: "monthly",
      sentAt: new Date().toISOString(),
    };

    try {
      const supportResponse = await fetch("/api/quiz/dashboard-support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challenge: supportChallenge,
          frustrationLevel: supportFrustration,
          name: supportName.trim() || null,
          email: supportEmail.trim() || null,
          comment: supportTried.trim() || null,
          sourcePage: "/First-Home-Quiz",
        }),
      });

      if (!supportResponse.ok) {
        throw new Error("Failed to save support survey response");
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(HOMEOWNER_DASHBOARD_STORAGE_KEY, JSON.stringify(snapshot));
        window.localStorage.removeItem(QUIZ_STORAGE_KEY);
      }

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
    } catch {
      setSupportError("We could not save your response. Please try again.");
      setIsSubmitting(false);
      return;
    } finally {
      setIsSubmitting(false);
    }

    router.push("/first-home-dashboard");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#ffffff,#f4f6f1)] p-5 shadow-[0_14px_34px_rgba(33,47,37,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              {stage === "tier1" ? tier1Page.title : stage === "tier2" ? "Tier 2: Duty details" : "Final details"}
            </p>
            <p className="mt-1 text-sm text-foreground-soft">
              {stage === "tier1"
                ? `Page ${tier1PageIndex + 1} of ${TIER1_PAGES.length}`
                : stage === "tier2"
                  ? "Only shown when duty needs more detail"
                  : "One last step before the dashboard"}
            </p>
          </div>
          <div className="flex gap-2">
            {stageLabels.map((label, index) => (
              <span
                key={label}
                className={`h-2.5 w-8 rounded-full transition-colors ${
                  index <= currentStagePosition ? "bg-primary" : "bg-primary/15"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {stage === "tier1" ? (
        <section className="space-y-4">
          {tier1Page.questions.map((question) => {
            if (question.type === "choice") {
              const answer = tier1Answers[question.id];

              return (
                <Card key={question.id} className="animate-fade-up space-y-4 bg-white p-6">
                  <p className="text-xl font-semibold tracking-tight">{question.prompt}</p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {question.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        data-testid={`quiz-${question.id}-${option.value}`}
                        className={`rounded-xl px-5 py-4 text-sm font-semibold transition-all ${optionButtonClass(
                          answer === option.value,
                        )}`}
                        onClick={() => answerTier1Choice(question, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Card>
              );
            }

            if (question.type === "boolean") {
              const answer = tier1Answers[question.id];

              return (
                <Card key={question.id} className="animate-fade-up space-y-4 bg-white p-6">
                  <p className="text-xl font-semibold tracking-tight">{question.prompt}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      data-testid={`quiz-${question.id}-yes`}
                      className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${optionButtonClass(
                        answer === true,
                      )}`}
                      onClick={() => answerTier1Boolean(question, true)}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      data-testid={`quiz-${question.id}-no`}
                      className={`rounded-xl px-5 py-3 text-sm font-semibold transition-all ${
                        answer === false
                          ? "bg-[#7a4a43] text-white"
                          : "bg-[#f7f1ed] text-foreground ring-1 ring-border hover:bg-[#efe7e0]"
                      }`}
                      onClick={() => answerTier1Boolean(question, false)}
                    >
                      No
                    </button>
                  </div>
                </Card>
              );
            }

            return (
              <Card key={question.id} className="animate-fade-up space-y-4 bg-white p-6">
                <label className="grid gap-2">
                  <span className="text-xl font-semibold tracking-tight">{question.prompt}</span>
                  <Input
                    data-testid={`quiz-${question.id}`}
                    type="text"
                    inputMode="numeric"
                    placeholder={question.placeholder}
                    className="h-14 text-xl placeholder:text-[#9aa097]"
                    value={display[question.id]}
                    onChange={(event) => answerTier1Display(question.id, event.currentTarget.value)}
                  />
                </label>
              </Card>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goBackTier1} disabled={tier1PageIndex === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button data-testid="tier1-continue" type="button" onClick={goNextTier1} disabled={!canContinueTier1}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "tier2" ? (
        <Card className="animate-fade-up space-y-6 bg-white p-6 md:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Tier 2</p>
            <h2 className="text-2xl font-semibold tracking-tight">Duty details that change the calculation path</h2>
            <p className="text-sm text-foreground-soft">
              We only ask these when the Tier 1 answers move into a higher-complexity duty path.
            </p>
          </div>

          {dutyIntake.hasTier3EdgeCase ? (
            <div className="rounded-2xl border border-border bg-[#f1f0ec] p-4 text-sm text-foreground-soft">
              Broad assumption used for this duty path even after Tier 2. {dutyIntake.reasons.join(" ")}
            </div>
          ) : null}

          <div className="grid gap-4">
            {tier2Questions.map((question) => {
              if (question.type === "choice") {
                const answer = input[question.id];

                return (
                  <div key={question.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                    <p className="text-base font-semibold">{question.prompt}</p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {question.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          data-testid={`quiz-tier2-${question.id}-${option.value}`}
                          className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${optionButtonClass(
                            answer === option.value || String(answer) === option.value,
                          )}`}
                          onClick={() => answerTier2Choice(question, option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              if (question.type === "boolean") {
                const answer = input[question.id];

                return (
                  <div key={question.id} className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                    <p className="text-base font-semibold">{question.prompt}</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        data-testid={`quiz-tier2-${question.id}-yes`}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${optionButtonClass(
                          answer === true,
                        )}`}
                        onClick={() => answerTier2Boolean(question, true)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        data-testid={`quiz-tier2-${question.id}-no`}
                        className={`rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                          answer === false
                            ? "bg-[#7a4a43] text-white"
                            : "bg-[#f7f1ed] text-foreground ring-1 ring-border hover:bg-[#efe7e0]"
                        }`}
                        onClick={() => answerTier2Boolean(question, false)}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <label key={question.id} className="grid gap-2 rounded-2xl border border-border bg-surface p-4">
                  <span className="text-base font-semibold">{question.prompt}</span>
                  <Input
                    data-testid={`quiz-tier2-${question.id}`}
                    type="text"
                    inputMode="numeric"
                    placeholder={question.placeholder}
                    value={display.dependentChildrenCount}
                    onChange={(event) => answerTier1Display("dependentChildrenCount", event.currentTarget.value)}
                  />
                </label>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={goBackTier2}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              data-testid="tier2-continue"
              type="button"
              onClick={() => setStage("account")}
              disabled={!canContinueTier2}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : null}

      {stage === "account" ? (
        <Card className="animate-fade-up space-y-6 border-primary/30 bg-gradient-to-br from-[#f4faef] to-[#edf6f8] p-6 md:p-8">
          {preview.dutyIntake.uncertaintyActive ? (
            <div className="rounded-2xl border border-border bg-[#f1f0ec] p-4 text-sm text-foreground-soft">
              Duty outputs will stay marked with * until the missing advanced details are filled or the Tier 3 edge case is resolved manually.{" "}
              {preview.dutyIntake.reasons.join(" ")}
            </div>
          ) : null}

          <div className="space-y-4 rounded-2xl border border-primary/20 bg-white/80 p-4 md:p-5">
            <h3 className="text-2xl font-semibold tracking-tight">What is the hardest part of saving for your first home?</h3>
            <p className="text-sm text-foreground-soft">
              Tell us what you struggle with most so we can build the right tools
            </p>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                <span>Name</span>
                <Input value={supportName} onChange={(event) => setSupportName(event.currentTarget.value)} />
              </label>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-white p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-soft">
                Select your biggest challenge right now:
              </p>
              {SUPPORT_CHALLENGE_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-start gap-2">
                  <input
                    data-testid={`quiz-support-challenge-${option.key}`}
                    type="radio"
                    name="support-challenge"
                    className="mt-0.5 h-4 w-4 rounded-full accent-primary"
                    checked={supportChallenge === option.key}
                    onChange={() => setSupportChallenge(option.key)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
              <div className="space-y-2 pt-2">
                <p className="text-xs text-foreground-soft">How frustrating is this problem?</p>
                <div className="flex items-center gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((value) => (
                    <button
                      key={`quiz-support-frustration-${value}`}
                      data-testid={`quiz-support-frustration-${value}`}
                      type="button"
                      className={`h-8 w-8 rounded-full border text-xs font-semibold transition ${
                        supportFrustration === value
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-foreground hover:bg-surface-muted"
                      }`}
                      onClick={() => setSupportFrustration(value)}
                      aria-label={`Frustration level ${value}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-foreground-soft">Minor -&gt; Extremely frustrating</p>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs text-foreground-soft">
                  Leave your email if you&apos;d like early access to tools that solve this
                </span>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.currentTarget.value)}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs text-foreground-soft">What have you already tried to solve this</span>
                <textarea
                  className="min-h-20 rounded-xl border border-border bg-[#f9f8f6] px-4 py-3 text-sm text-foreground outline-none ring-0 placeholder:text-[#9aa097] focus:border-primary focus:bg-white"
                  placeholder="Spreadsheet, financial advisor, nothing yet, etc."
                  value={supportTried}
                  onChange={(event) => setSupportTried(event.currentTarget.value)}
                />
              </label>
            </div>
          </div>

          {supportError ? <p className="text-sm text-[#8a2f2f]">{supportError}</p> : null}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (dutyIntake.needsTier2) {
                  setStage("tier2");
                  return;
                }

                setStage("tier1");
                setTier1PageIndex(TIER1_PAGES.length - 1);
              }}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <Button
              data-testid="create-free-account"
              type="button"
              onClick={() => void createAccountAndContinue()}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Continue to your dashboard"}
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
