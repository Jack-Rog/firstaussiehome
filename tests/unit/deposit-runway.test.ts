import { describe, expect, it } from "vitest";
import { calculateDepositRunway } from "@/src/server/calculators/deposit-runway";

describe("calculateDepositRunway", () => {
  it("returns a scenario row for each deposit target", () => {
    const result = calculateDepositRunway({
      targetPropertyPrice: 780000,
      currentSavings: 45000,
      annualSalary: 85000,
      privateDebt: 12000,
      hecsDebt: 18000,
      averageMonthlyExpenses: 2800,
      annualSavingsRate: 3,
    });

    expect(result.scenarioRows).toHaveLength(3);
    expect(result.scenarioRows[1]?.monthsToTarget).toBeGreaterThan(0);
    expect(result.facts.firstHomeGuaranteeMinimumDeposit).toBe(39000);
    expect(result.facts.currentLoanToValueRatio).toBeGreaterThan(90);
  });
});
