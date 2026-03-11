import type {
  HomeownerPathwayInput,
  ResearchBuyTimeline,
  ResearchBuyingMode,
  ResearchCareerStage,
  ResearchCategory,
  ResearchContext,
  ResearchDetailBand,
  ResearchEventName,
  ResearchIncomeBand,
  ResearchPropertyPriceBand,
  ResearchSavingsBand,
  ResearchState,
  ResearchSubmissionSurface,
  ResearchTimeStuck,
} from "@/src/lib/types";

export const RESEARCH_PROMPT_VERSION = "research-v1";
export const DASHBOARD_RESEARCH_SUBMITTED_AT_KEY = "aussiesfirsthome:dashboard-research-submitted-at";

export const RESEARCH_EVENT_NAMES: readonly ResearchEventName[] = [
  "quiz_completed",
  "dashboard_viewed",
  "research_module_viewed",
  "research_started",
  "research_skipped",
  "research_submitted",
  "eoi_viewed",
] as const;

export const RESEARCH_CATEGORIES: ReadonlyArray<{ value: ResearchCategory; label: string }> = [
  { value: "options-and-schemes", label: "Knowing what help or schemes exist" },
  { value: "affordability", label: "Figuring out what I can afford" },
  { value: "deposit-and-cash", label: "Knowing how much deposit or cash I need" },
  { value: "save-vs-invest-vs-debt", label: "Choosing between saving, investing, or debt" },
  { value: "making-a-plan", label: "Turning everything into a realistic plan" },
  { value: "something-else", label: "Something else" },
] as const;

export const RESEARCH_TIME_STUCK_OPTIONS: ReadonlyArray<{ value: ResearchTimeStuck; label: string }> = [
  { value: "lt-1-month", label: "Less than 1 month" },
  { value: "1-3-months", label: "1 to 3 months" },
  { value: "3-6-months", label: "3 to 6 months" },
  { value: "gt-6-months", label: "More than 6 months" },
] as const;

export const RESEARCH_BUY_TIMELINE_OPTIONS: ReadonlyArray<{ value: ResearchBuyTimeline; label: string }> = [
  { value: "lt-12-months", label: "Less than 12 months" },
  { value: "1-2-years", label: "1 to 2 years" },
  { value: "2-5-years", label: "2 to 5 years" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

export const RESEARCH_CAREER_STAGE_OPTIONS: ReadonlyArray<{ value: ResearchCareerStage; label: string }> = [
  { value: "still-studying", label: "Still studying or transitioning into work" },
  { value: "0-2-years-working", label: "0 to 2 years into work" },
  { value: "3-5-years-working", label: "3 to 5 years into work" },
  { value: "5-plus-years-working", label: "5+ years into work" },
  { value: "other", label: "Other" },
] as const;

export const RESEARCH_STATE_OPTIONS: ReadonlyArray<{ value: ResearchState; label: string }> = [
  { value: "nsw", label: "NSW" },
  { value: "vic", label: "VIC" },
  { value: "qld", label: "QLD" },
  { value: "wa", label: "WA" },
  { value: "sa", label: "SA" },
  { value: "tas", label: "TAS" },
  { value: "act", label: "ACT" },
  { value: "nt", label: "NT" },
  { value: "unknown", label: "Not sure yet" },
] as const;

export const RESEARCH_INCOME_BAND_OPTIONS: ReadonlyArray<{ value: ResearchIncomeBand; label: string }> = [
  { value: "lt-80k", label: "Under $80k" },
  { value: "80k-120k", label: "$80k to $120k" },
  { value: "120k-160k", label: "$120k to $160k" },
  { value: "gt-160k", label: "$160k+" },
  { value: "unknown", label: "Prefer not to say / not sure" },
] as const;

export const RESEARCH_SAVINGS_BAND_OPTIONS: ReadonlyArray<{ value: ResearchSavingsBand; label: string }> = [
  { value: "lt-20k", label: "Under $20k" },
  { value: "20k-50k", label: "$20k to $50k" },
  { value: "50k-100k", label: "$50k to $100k" },
  { value: "gt-100k", label: "$100k+" },
  { value: "unknown", label: "Prefer not to say / not sure" },
] as const;

export const RESEARCH_BUYING_MODE_OPTIONS: ReadonlyArray<{ value: ResearchBuyingMode; label: string }> = [
  { value: "solo", label: "Buying alone" },
  { value: "joint", label: "Buying jointly" },
  { value: "unknown", label: "Not sure yet" },
] as const;

export function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function deriveResearchDetailBand(problemText: string, attemptedSolutions: string): ResearchDetailBand {
  const totalWords = countWords(problemText) + countWords(attemptedSolutions);

  if (totalWords >= 60) {
    return "rich";
  }

  if (totalWords >= 25) {
    return "solid";
  }

  return "thin";
}

export function buildResearchTags(input: {
  surface: ResearchSubmissionSurface;
  category: ResearchCategory;
  timeStuck: ResearchTimeStuck;
  slowdownLevel: number;
  buyTimeline: ResearchBuyTimeline;
  confidenceLevel: number;
  interviewOptIn: boolean;
  detailBand: ResearchDetailBand;
  careerStage?: ResearchCareerStage | null;
  context?: ResearchContext | null;
}) {
  const tags = [
    `surface:${input.surface}`,
    `category:${input.category}`,
    `time_stuck:${input.timeStuck}`,
    `slowdown:${input.slowdownLevel}`,
    `buy_timeline:${input.buyTimeline}`,
    `confidence:${input.confidenceLevel}`,
    `interview_opt_in:${input.interviewOptIn}`,
    `detail_band:${input.detailBand}`,
  ];

  if (input.careerStage) {
    tags.push(`career_stage:${input.careerStage}`);
  }

  if (input.context?.state) {
    tags.push(`state:${input.context.state}`);
  }

  if (input.context?.incomeBand) {
    tags.push(`income_band:${input.context.incomeBand}`);
  }

  if (input.context?.savingsBand) {
    tags.push(`savings_band:${input.context.savingsBand}`);
  }

  if (input.context?.buyingMode) {
    tags.push(`buying_mode:${input.context.buyingMode}`);
  }

  if (input.context?.propertyPriceBand) {
    tags.push(`property_price_band:${input.context.propertyPriceBand}`);
  }

  return tags;
}

export function bandIncomeAmount(value?: number | null): ResearchIncomeBand {
  if (!value || value <= 0) {
    return "unknown";
  }

  if (value < 80000) {
    return "lt-80k";
  }

  if (value < 120000) {
    return "80k-120k";
  }

  if (value < 160000) {
    return "120k-160k";
  }

  return "gt-160k";
}

export function bandSavingsAmount(value?: number | null): ResearchSavingsBand {
  if (!value || value <= 0) {
    return "unknown";
  }

  if (value < 20000) {
    return "lt-20k";
  }

  if (value < 50000) {
    return "20k-50k";
  }

  if (value < 100000) {
    return "50k-100k";
  }

  return "gt-100k";
}

export function bandPropertyPrice(value?: number | null): ResearchPropertyPriceBand {
  if (!value || value <= 0) {
    return "unknown";
  }

  if (value < 600000) {
    return "lt-600k";
  }

  if (value < 800000) {
    return "600k-800k";
  }

  if (value < 1000000) {
    return "800k-1m";
  }

  return "gt-1m";
}

export function deriveResearchContextFromHomeownerInput(input: HomeownerPathwayInput): ResearchContext {
  return {
    state: input.homeState ?? "unknown",
    incomeBand: bandIncomeAmount(input.actHouseholdIncome),
    savingsBand: bandSavingsAmount(input.currentSavings),
    buyingMode: input.buyingSoloOrJoint ?? "unknown",
    propertyPriceBand: bandPropertyPrice(input.targetPropertyPrice),
  };
}
