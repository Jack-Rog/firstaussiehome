import type { HomeownerPathwayInput, HomeownerPathwaySelections } from "@/src/lib/types";
import type { Frequency } from "@/src/lib/utils";

export const HOMEOWNER_DASHBOARD_STORAGE_KEY = "aussiesfirsthome:first-home-dashboard";

export type HomeownerDashboardSnapshot = {
  input: HomeownerPathwayInput;
  selections: HomeownerPathwaySelections;
  account: {
    name: string;
    email: string;
    story: string;
  };
  incomeFrequency: Frequency;
  expenseFrequency: Frequency;
  sentAt: string;
};
