import { describe, expect, it } from "vitest";
import { buildOnboardingResult, buildSchemeScreeningResult } from "@/src/server/services/quiz-service";

describe("quiz-service", () => {
  it("builds an onboarding result with an ultra-simple track label", () => {
    const result = buildOnboardingResult({
      goals: ["buy-first-home"],
      payg: true,
      single: true,
      dependants: false,
      businessIncome: false,
      trusts: false,
      property: false,
      smallPortfolio: true,
      firstHomeBuyer: true,
      buyingNewHome: false,
      australianCitizenOrResident: true,
      livingInNsw: true,
      buyingSoloOrJoint: "solo",
      annualSalary: 85000,
      privateDebt: 12000,
      hecsDebt: 18000,
      currentSavings: 45000,
      averageMonthlyExpenses: 2800,
      desiredPropertyPrice: 780000,
    });

    expect(result.learningPathId).toBe("first-home-roadmap-nsw");
    expect(result.ultraSimpleTrack).toBe(true);
    expect(result.mayBeEligible).toBe(true);
    expect(result.nextPrimaryCta.href).toBe("/tools/deposit-runway");
  });

  it("returns a may-be-eligible outcome for a broad NSW screen", () => {
    const result = buildSchemeScreeningResult({
      firstHomeBuyer: true,
      buyingNewHome: false,
      australianCitizenOrResident: true,
      livingInNsw: true,
      buyingSoloOrJoint: "solo",
    });

    expect(result.mayBeEligible).toBe(true);
    expect(result.needsManualCheck).toBe(true);
  });
});
