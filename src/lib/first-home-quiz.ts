import type { DutyTier2FieldId, HomeownerPathwayInput } from "@/src/lib/types";
import { formatCurrency } from "@/src/lib/utils";

type QuizAnswerValue = boolean | string | null;

type QuizDisplayDraft = {
  targetPropertyPrice?: string;
  actHouseholdIncome?: string;
  currentSavings?: string;
  dependentChildrenCount?: string;
};

export type FirstHomeQuizPersistedState = {
  stage: "tier1" | "tier2";
  input: HomeownerPathwayInput;
  tier1Answers: Record<string, boolean | string>;
  display: {
    targetPropertyPrice: string;
    actHouseholdIncome: string;
    currentSavings: string;
    dependentChildrenCount: string;
  };
  capturedAt: string;
};

export const PENDING_FIRST_HOME_QUIZ_SUBMISSION_KEY = "aussiesfirsthome:pending-first-home-quiz-submission";

export type FirstHomeQuizQuestionResponse = {
  id: string;
  stage: "Tier 1" | "Tier 2";
  prompt: string;
  answer: string;
};

const TIER1_ORDER = [
  "homeState",
  "targetPropertyPrice",
  "firstHomeBuyer",
  "ownerOccupier",
  "australianCitizenOrResident",
  "buyingSoloOrJoint",
  "foreignBuyer",
  "propertyTypeDetailed",
  "buyingArea",
  "actHouseholdIncome",
  "dependentChildrenCount",
  "currentSavings",
] as const;

const TIER2_ORDER = [
  "buyerEntityType",
  "jointEligibilityAligned",
  "foreignOwnershipMode",
  "waRegion",
  "qldConcessionPath",
  "saReliefPath",
  "dependentChildrenCount",
  "ntHouseAndLandEligiblePath",
] as const satisfies DutyTier2FieldId[];

const TIER1_PROMPTS: Record<(typeof TIER1_ORDER)[number], string> = {
  homeState: "Which state or territory are you buying in?",
  targetPropertyPrice: "What price are you aiming to buy at?",
  firstHomeBuyer: "Is this your first home purchase?",
  ownerOccupier: "Will at least one buyer live in the property as their home?",
  australianCitizenOrResident: "Are all buyers Australian citizens or permanent residents?",
  buyingSoloOrJoint: "Are you buying alone or jointly?",
  foreignBuyer: "Are all buyers considered domestic persons for duty purposes?",
  propertyTypeDetailed: "What are you buying?",
  buyingArea: "Is the property in a state capital/metro area or outside one?",
  actHouseholdIncome: "What is your household income from the previous financial year?",
  dependentChildrenCount: "How many dependant children are in the household?",
  currentSavings: "How much do you already have saved?",
};

const TIER2_PROMPTS: Record<DutyTier2FieldId, string> = {
  buyerEntityType:
    "Are all buyers individuals rather than a trust, company, SMSF, or corporate trustee?",
  jointEligibilityAligned:
    "If buying jointly, do all buyers have the same first-home, residency, and foreign-buyer status?",
  foreignOwnershipMode:
    "If any buyer is foreign, will the foreign buyer own the full purchase or only part of it?",
  waRegion: "Is the property in Perth/Peel or outside Perth/Peel?",
  qldConcessionPath: "Which Queensland path best fits?",
  saReliefPath: "If seeking South Australia first-home relief, which path fits?",
  dependentChildrenCount: "Confirm the exact number of dependant children for the household.",
  ntHouseAndLandEligiblePath:
    "Is this a house-and-land package that may fall under the targeted exemption path?",
};

const CHOICE_LABELS: Record<string, Record<string, string>> = {
  homeState: {
    nsw: "NSW",
    vic: "VIC",
    qld: "QLD",
    wa: "WA",
    sa: "SA",
    tas: "TAS",
    act: "ACT",
    nt: "NT",
  },
  buyingSoloOrJoint: {
    solo: "Buying alone",
    joint: "Buying jointly",
  },
  propertyTypeDetailed: {
    "established-home": "Established home",
    "new-home": "New home",
    "vacant-land": "Vacant land",
    "off-the-plan-home": "Off-the-plan home",
    "house-and-land-package": "House-and-land package",
  },
  buyingArea: {
    "state-capital": "State capital / metro",
    regional: "Outside the capital / metro",
  },
  buyerEntityType: {
    individuals: "All buyers are individuals",
    trust: "Trust involved",
    company: "Company involved",
    smsf: "SMSF involved",
    "corporate-trustee": "Corporate trustee involved",
  },
  foreignOwnershipMode: {
    full: "Full purchase",
    partial: "Partial ownership only",
  },
  waRegion: {
    "perth-peel": "Perth / Peel",
    "outside-perth-peel": "Outside Perth / Peel",
  },
  qldConcessionPath: {
    "home-concession": "Home concession",
    "first-home-home-concession": "First-home home concession",
    "first-home-vacant-land-concession": "First-home vacant land concession",
    "no-concession-path": "No concession path",
  },
  saReliefPath: {
    "new-home": "New home",
    "off-the-plan-apartment": "Off-the-plan apartment",
    "vacant-land": "Vacant land",
    none: "None of those",
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatBooleanAnswer(value: boolean | null) {
  return value === null ? null : value ? "Yes" : "No";
}

function formatCurrencyAnswer(displayValue: unknown, numericValue: unknown) {
  const display = asString(displayValue);
  if (display) {
    return display;
  }

  const amount = asNumber(numericValue);
  return amount === null ? null : formatCurrency(amount);
}

function formatIntegerAnswer(displayValue: unknown, numericValue: unknown) {
  const display = asString(displayValue);
  if (display) {
    return display;
  }

  const amount = asNumber(numericValue);
  return amount === null ? null : String(amount);
}

function formatChoiceAnswer(fieldId: string, value: unknown) {
  const raw = asString(value);
  if (!raw) {
    return null;
  }

  return CHOICE_LABELS[fieldId]?.[raw] ?? raw;
}

function normalizeSavedQuestionResponses(value: unknown): FirstHomeQuizQuestionResponse[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index) => {
    const record = asRecord(entry);
    const prompt = asString(record.prompt);
    const answer = asString(record.answer);
    const stage = asString(record.stage);
    const id = asString(record.id) ?? `response-${index + 1}`;

    if (!prompt || !answer || (stage !== "Tier 1" && stage !== "Tier 2")) {
      return [];
    }

    return [{ id, prompt, answer, stage }];
  });
}

function normalizeTier1Answers(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, boolean | string | null] =>
        typeof entry[1] === "boolean" || typeof entry[1] === "string" || entry[1] === null,
    ),
  );
}

export function buildFirstHomeQuizQuestionResponses(input: {
  input: HomeownerPathwayInput;
  tier1Answers?: Record<string, QuizAnswerValue>;
  display?: QuizDisplayDraft;
  visibleTier2Fields?: DutyTier2FieldId[];
}): FirstHomeQuizQuestionResponse[] {
  const tier1Answers = input.tier1Answers ?? {};
  const display = input.display ?? {};
  const visibleTier2Fields = input.visibleTier2Fields ?? [];

  const tier1Responses = TIER1_ORDER.flatMap((fieldId) => {
    let answer: string | null = null;

    if (fieldId === "homeState") {
      answer = formatChoiceAnswer(fieldId, tier1Answers[fieldId] ?? input.input.homeState);
    } else if (fieldId === "targetPropertyPrice") {
      answer = formatCurrencyAnswer(display.targetPropertyPrice, input.input.targetPropertyPrice);
    } else if (fieldId === "firstHomeBuyer" || fieldId === "ownerOccupier" || fieldId === "australianCitizenOrResident") {
      answer = formatBooleanAnswer(asBoolean(tier1Answers[fieldId]));
    } else if (fieldId === "buyingSoloOrJoint" || fieldId === "propertyTypeDetailed" || fieldId === "buyingArea") {
      answer = formatChoiceAnswer(fieldId, tier1Answers[fieldId] ?? input.input[fieldId]);
    } else if (fieldId === "foreignBuyer") {
      answer = formatBooleanAnswer(asBoolean(tier1Answers[fieldId]));
    } else if (fieldId === "actHouseholdIncome") {
      answer = formatCurrencyAnswer(display.actHouseholdIncome, input.input.actHouseholdIncome);
    } else if (fieldId === "dependentChildrenCount") {
      answer = formatIntegerAnswer(display.dependentChildrenCount, input.input.dependentChildrenCount);
    } else if (fieldId === "currentSavings") {
      answer = formatCurrencyAnswer(display.currentSavings, input.input.currentSavings);
    }

    return answer
      ? [
          {
            id: fieldId,
            stage: "Tier 1" as const,
            prompt: TIER1_PROMPTS[fieldId],
            answer,
          },
        ]
      : [];
  });

  const tier2Responses = TIER2_ORDER.flatMap((fieldId) => {
    if (!visibleTier2Fields.includes(fieldId)) {
      return [];
    }

    let answer: string | null = null;

    if (
      fieldId === "buyerEntityType" ||
      fieldId === "foreignOwnershipMode" ||
      fieldId === "waRegion" ||
      fieldId === "qldConcessionPath" ||
      fieldId === "saReliefPath"
    ) {
      answer = formatChoiceAnswer(fieldId, input.input[fieldId]);
    } else if (fieldId === "jointEligibilityAligned" || fieldId === "ntHouseAndLandEligiblePath") {
      answer = formatBooleanAnswer(asBoolean(input.input[fieldId]));
    } else if (fieldId === "dependentChildrenCount") {
      answer = formatIntegerAnswer(display.dependentChildrenCount, input.input.dependentChildrenCount);
    }

    return answer
      ? [
          {
            id: `tier2-${fieldId}`,
            stage: "Tier 2" as const,
            prompt: TIER2_PROMPTS[fieldId],
            answer,
          },
        ]
      : [];
  });

  return [...tier1Responses, ...tier2Responses];
}

function removeEmptyEntries(value: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ""),
  );
}

export function sanitizeStoredFirstHomeQuizDisplay(display?: QuizDisplayDraft) {
  return removeEmptyEntries({
    targetPropertyPrice: asString(display?.targetPropertyPrice),
    actHouseholdIncome: asString(display?.actHouseholdIncome),
    currentSavings: asString(display?.currentSavings),
    dependentChildrenCount: asString(display?.dependentChildrenCount),
  });
}

export function sanitizeStoredFirstHomeQuizInput(input: {
  input: HomeownerPathwayInput;
  tier1Answers?: Record<string, QuizAnswerValue>;
  display?: QuizDisplayDraft;
  visibleTier2Fields?: DutyTier2FieldId[];
}) {
  const tier1Answers = input.tier1Answers ?? {};
  const display = input.display ?? {};
  const visibleTier2Fields = input.visibleTier2Fields ?? [];
  const answeredDependentChildrenCount = asString(display.dependentChildrenCount) !== null;

  return removeEmptyEntries({
    homeState: "homeState" in tier1Answers ? input.input.homeState : undefined,
    livingInNsw: "homeState" in tier1Answers ? input.input.livingInNsw : undefined,
    targetPropertyPrice:
      asString(display.targetPropertyPrice) !== null ? input.input.targetPropertyPrice : undefined,
    firstHomeBuyer: "firstHomeBuyer" in tier1Answers ? input.input.firstHomeBuyer : undefined,
    existingProperty: "firstHomeBuyer" in tier1Answers ? input.input.existingProperty : undefined,
    ownerOccupier: "ownerOccupier" in tier1Answers ? input.input.ownerOccupier : undefined,
    australianCitizenOrResident:
      "australianCitizenOrResident" in tier1Answers ? input.input.australianCitizenOrResident : undefined,
    buyingSoloOrJoint: "buyingSoloOrJoint" in tier1Answers ? input.input.buyingSoloOrJoint : undefined,
    foreignBuyer: "foreignBuyer" in tier1Answers ? input.input.foreignBuyer : undefined,
    propertyTypeDetailed: "propertyTypeDetailed" in tier1Answers ? input.input.propertyTypeDetailed : undefined,
    buyingNewHome: "propertyTypeDetailed" in tier1Answers ? input.input.buyingNewHome : undefined,
    buyingArea: "buyingArea" in tier1Answers ? input.input.buyingArea : undefined,
    actHouseholdIncome:
      asString(display.actHouseholdIncome) !== null ? input.input.actHouseholdIncome : undefined,
    dependentChildrenCount: answeredDependentChildrenCount ? input.input.dependentChildrenCount : undefined,
    dependants: answeredDependentChildrenCount ? input.input.dependants : undefined,
    currentSavings: asString(display.currentSavings) !== null ? input.input.currentSavings : undefined,
    buyerEntityType: visibleTier2Fields.includes("buyerEntityType") ? input.input.buyerEntityType : undefined,
    jointEligibilityAligned:
      visibleTier2Fields.includes("jointEligibilityAligned") ? input.input.jointEligibilityAligned : undefined,
    foreignOwnershipMode:
      visibleTier2Fields.includes("foreignOwnershipMode") ? input.input.foreignOwnershipMode : undefined,
    waRegion: visibleTier2Fields.includes("waRegion") ? input.input.waRegion : undefined,
    qldConcessionPath:
      visibleTier2Fields.includes("qldConcessionPath") ? input.input.qldConcessionPath : undefined,
    saReliefPath: visibleTier2Fields.includes("saReliefPath") ? input.input.saReliefPath : undefined,
    ntHouseAndLandEligiblePath:
      visibleTier2Fields.includes("ntHouseAndLandEligiblePath") ? input.input.ntHouseAndLandEligiblePath : undefined,
  });
}

export function getStoredFirstHomeQuizQuestionResponses(input: {
  answers: Record<string, unknown>;
  result?: Record<string, unknown>;
}) {
  const savedResponses = normalizeSavedQuestionResponses(input.answers.questionResponses);
  if (savedResponses.length > 0) {
    return savedResponses;
  }

  const answers = asRecord(input.answers);
  const result = asRecord(input.result);
  const dutyIntake = asRecord(result.dutyIntake);
  const inputRecord = asRecord(answers.input);
  const tier1Answers = normalizeTier1Answers(asRecord(answers.tier1Answers));
  const display = asRecord(answers.display) as QuizDisplayDraft;
  const visibleTier2Fields = Array.isArray(dutyIntake.visibleTier2Fields)
    ? dutyIntake.visibleTier2Fields.filter((fieldId): fieldId is DutyTier2FieldId =>
        TIER2_ORDER.includes(fieldId as DutyTier2FieldId),
      )
    : [];

  return buildFirstHomeQuizQuestionResponses({
    input: inputRecord as HomeownerPathwayInput,
    tier1Answers,
    display,
    visibleTier2Fields,
  });
}
