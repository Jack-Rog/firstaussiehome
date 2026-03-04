import { describe, expect, it } from "vitest";
import { calculateBudgetSummary } from "@/src/server/calculators/budget";

describe("calculateBudgetSummary", () => {
  it("calculates monthly and annualized totals", () => {
    const summary = calculateBudgetSummary({
      monthlyIncome: 6200,
      fixedCosts: 2400,
      variableCosts: 1600,
      irregularAnnualCosts: 3600,
      savingsGoal: 1800,
    });

    expect(summary.monthlyTotals.irregularProvision).toBe(300);
    expect(summary.monthlyTotals.surplus).toBe(1900);
    expect(summary.annualizedTotals.surplus).toBe(22800);
  });
});
