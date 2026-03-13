import type { HomeownerPathwayInput, HomeownerPathwaySelections } from "@/src/lib/types";
import type { Frequency } from "@/src/lib/utils";

export const HOMEOWNER_DASHBOARD_STORAGE_KEY = "aussiesfirsthome:first-home-dashboard";
export const HOMEOWNER_DASHBOARD_PROGRESS_KEY = "first-home-dashboard";

export type HomeownerDashboardSnapshot = {
  input: HomeownerPathwayInput;
  selections: HomeownerPathwaySelections;
  incomeFrequency: Frequency;
  expenseFrequency: Frequency;
  sentAt: string;
};

export function createHomeownerDashboardSnapshot(
  input: HomeownerPathwayInput,
  selections: HomeownerPathwaySelections,
  sentAt = new Date().toISOString(),
): HomeownerDashboardSnapshot {
  return {
    input,
    selections,
    incomeFrequency: "annually",
    expenseFrequency: "monthly",
    sentAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFrequency(value: unknown): value is Frequency {
  return value === "annually" || value === "monthly" || value === "weekly";
}

export function parseHomeownerDashboardSnapshot(value: unknown): HomeownerDashboardSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const input = value.input;
  const selections = value.selections;
  const incomeFrequency = value.incomeFrequency;
  const expenseFrequency = value.expenseFrequency;
  const sentAt = value.sentAt;

  if (!isRecord(input) || !isRecord(selections) || typeof sentAt !== "string") {
    return null;
  }

  if (!isFrequency(incomeFrequency) || !isFrequency(expenseFrequency)) {
    return null;
  }

  return {
    input: input as HomeownerPathwayInput,
    selections: selections as HomeownerPathwaySelections,
    incomeFrequency,
    expenseFrequency,
    sentAt,
  };
}
