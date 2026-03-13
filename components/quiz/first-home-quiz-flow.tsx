"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDisclosure } from "@/components/compliance/disclosure-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildDefaultHomeownerPathwaySelections } from "@/src/lib/analysis/homeowner-pathway-defaults";
import { deriveDutyIntakeState } from "@/src/lib/analysis/homeowner-duty-intake";
import {
  buildHomeownerPathwayOutput,
  DEFAULT_HOMEOWNER_PATHWAY_INPUT,
} from "@/src/lib/analysis/homeowner-pathway-analysis";
import {
  type FirstHomeQuizPersistedState,
  PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY,
} from "@/src/lib/first-home-quiz";
import {
  HOMEOWNER_DASHBOARD_STORAGE_KEY,
  createHomeownerDashboardSnapshot,
} from "@/src/lib/homeowner-dashboard-storage";
import { getAnonymousId, getSessionId, trackResearchEvent } from "@/src/lib/research-client";
import type {
  DutyTier2FieldId,
  HomeownerPathwayInput,
  HomeownerPathwaySelections,
} from "@/src/lib/types";
import { formatCurrencyInput, parseMoneyInput } from "@/src/lib/utils";

type Stage = "tier1" | "tier2";

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

type QuizPersistedState = {
  stage: Stage;
  tier1PageIndex: number;
  input: HomeownerPathwayInput;
  tier1Answers: Tier1AnswerMap;
  display: DisplayDraft;
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
        prompt: "Are all buyers considered domestic persons for duty purposes?",
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
}

function getInitialDisplay(): DisplayDraft {
  return {
    targetPropertyPrice: "",
    actHouseholdIncome: "",
    currentSavings: "",
    dependentChildrenCount: "",
  };
}

function getFallbackQuizState(): QuizPersistedState {
  const baseInput: HomeownerPathwayInput = {
    ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
    livingInNsw: true,
  };

  return {
    stage: "tier1",
    tier1PageIndex: 0,
    input: baseInput,
    tier1Answers: {},
    display: getInitialDisplay(),
  };
}

function readSavedQuizState(): QuizPersistedState {
  const fallback = getFallbackQuizState();

  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(QUIZ_STORAGE_KEY);
  if (!raw) {
    return fallback;
  }

  try {
    const saved = JSON.parse(raw) as Partial<QuizPersistedState>;
    const savedInput = saved.input ?? fallback.input;
    const savedHomeState = savedInput.homeState ?? (savedInput.livingInNsw === false ? "vic" : "nsw");

    return {
      stage: saved.stage ?? "tier1",
      tier1PageIndex: typeof saved.tier1PageIndex === "number" ? saved.tier1PageIndex : 0,
      input: {
        ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
        ...savedInput,
        homeState: savedHomeState,
        livingInNsw: savedHomeState === "nsw",
      },
      tier1Answers: saved.tier1Answers ?? {},
      display: {
        ...getInitialDisplay(),
        ...saved.display,
      },
    };
  } catch {
    window.localStorage.removeItem(QUIZ_STORAGE_KEY);
    return fallback;
  }
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
  const savedStateLoaded = useRef(false);
  const quizStartedTracked = useRef(false);
  const [stage, setStage] = useState<Stage>("tier1");
  const [tier1PageIndex, setTier1PageIndex] = useState(0);
  const [input, setInput] = useState<HomeownerPathwayInput>(() => getFallbackQuizState().input);
  const [tier1Answers, setTier1Answers] = useState<Tier1AnswerMap>({});
  const [display, setDisplay] = useState<DisplayDraft>(() => getInitialDisplay());
  const [isCompleting, setIsCompleting] = useState(false);

  const tier1Page = TIER1_PAGES[tier1PageIndex] ?? TIER1_PAGES[0];
  const dutyIntake = useMemo(() => deriveDutyIntakeState(input), [input]);
  const tier2Questions = useMemo(
    () => dutyIntake.visibleTier2Fields.map((fieldId) => TIER2_QUESTION_BY_FIELD[fieldId]),
    [dutyIntake.visibleTier2Fields],
  );
  const previewSelections = useMemo(() => buildDefaultHomeownerPathwaySelections(input), [input]);
  const preview = useMemo(() => buildHomeownerPathwayOutput(input, previewSelections), [input, previewSelections]);
  const canContinueTier1 = tier1Page.questions.every((question) => isTier1QuestionAnswered(question, tier1Answers, display));
  const canContinueTier2 = tier2Questions.every((question) => isTier2QuestionAnswered(question, input, display));
  const activeStage: Stage = stage === "tier2" && !dutyIntake.needsTier2 ? "tier1" : stage;
  const stageLabels = dutyIntake.needsTier2 ? ["Tier 1", "Tier 2"] : ["Tier 1"];
  const currentStagePosition = activeStage === "tier2" && dutyIntake.needsTier2 ? 1 : 0;

  useEffect(() => {
    if (savedStateLoaded.current) {
      return;
    }

    savedStateLoaded.current = true;
    const savedState = readSavedQuizState();
    setStage(savedState.stage);
    setTier1PageIndex(savedState.tier1PageIndex);
    setInput(savedState.input);
    setTier1Answers(savedState.tier1Answers);
    setDisplay(savedState.display);
  }, []);

  useEffect(() => {
    if (quizStartedTracked.current) {
      return;
    }

    quizStartedTracked.current = true;
    void trackResearchEvent({
      surface: "quiz",
      eventName: "quiz_started",
    });
  }, []);

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

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        QUIZ_STORAGE_KEY,
        JSON.stringify({
          stage: activeStage,
          tier1PageIndex,
          input,
          tier1Answers,
          display,
        }),
      );
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    activeStage,
    tier1PageIndex,
    input,
    tier1Answers,
    display,
  ]);

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

    setStage("tier2");
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

  async function completeQuiz() {
    setIsCompleting(true);
    const dashboardSelections = buildDefaultHomeownerPathwaySelections(input);
    const snapshot = createHomeownerDashboardSnapshot(input, dashboardSelections);
    const submission: FirstHomeQuizPersistedState = {
      stage: activeStage,
      input,
      tier1Answers,
      display,
      capturedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem(HOMEOWNER_DASHBOARD_STORAGE_KEY, JSON.stringify(snapshot));
      window.localStorage.setItem(PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY, JSON.stringify(submission));
      window.localStorage.removeItem(QUIZ_STORAGE_KEY);
    }

    const trackingPromise = trackResearchEvent({
      surface: "quiz",
      eventName: "quiz_completed",
      properties: {
        homeState: input.homeState ?? "unknown",
        targetPropertyPrice: input.targetPropertyPrice,
      },
    });

    await Promise.allSettled([
      fetch("/api/quiz/first-home", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonymousId: getAnonymousId(),
          sessionId: getSessionId(),
          stage: activeStage,
          input,
          tier1Answers,
          display,
        }),
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Failed to persist first-home quiz submission.");
        }

        if (typeof window !== "undefined") {
          window.localStorage.removeItem(PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY);
        }
      }),
      trackingPromise,
    ]);

    router.push("/first-home-dashboard");
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-[1.4rem] border border-border bg-[linear-gradient(180deg,#ffffff,#f4f6f1)] p-5 shadow-[0_14px_34px_rgba(33,47,37,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">
              {activeStage === "tier1" ? tier1Page.title : "Tier 2: Duty details"}
            </p>
            <p className="mt-1 text-sm text-foreground-soft">
              {activeStage === "tier1"
                ? `Page ${tier1PageIndex + 1} of ${TIER1_PAGES.length}`
                : "Only shown when duty needs more detail"}
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

      {activeStage === "tier1" ? (
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
            <Button
              data-testid="tier1-continue"
              type="button"
              onClick={tier1PageIndex === TIER1_PAGES.length - 1 && !dutyIntake.needsTier2 ? () => void completeQuiz() : goNextTier1}
              disabled={!canContinueTier1 || isCompleting}
            >
              {tier1PageIndex === TIER1_PAGES.length - 1 && !dutyIntake.needsTier2
                ? isCompleting
                  ? "Saving..."
                  : "View dashboard"
                : "Continue"}
            </Button>
          </div>
        </section>
      ) : null}

      {activeStage === "tier2" ? (
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
              onClick={() => void completeQuiz()}
              disabled={!canContinueTier2 || isCompleting}
            >
              {isCompleting ? "Saving..." : "View dashboard"}
              {isCompleting ? null : <ChevronRight className="ml-1 h-4 w-4" />}
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
