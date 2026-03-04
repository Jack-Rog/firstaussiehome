import type { BudgetInput, BudgetSummary } from "@/src/lib/types";

export function calculateBudgetSummary(input: BudgetInput): BudgetSummary {
  const irregularProvision = Math.round(input.irregularAnnualCosts / 12);
  const spending = input.fixedCosts + input.variableCosts;
  const surplus = input.monthlyIncome - spending - irregularProvision;
  const gapToGoal = input.savingsGoal - Math.max(surplus, 0);

  return {
    monthlyTotals: {
      income: input.monthlyIncome,
      spending,
      irregularProvision,
      surplus,
      gapToGoal,
    },
    annualizedTotals: {
      income: input.monthlyIncome * 12,
      spending: spending * 12,
      irregularProvision: irregularProvision * 12,
      surplus: surplus * 12,
    },
    irregularChecklist: [
      "Car registration or servicing",
      "Health appointments and medication top-ups",
      "Gifts, travel, and major annual subscriptions",
      "Tech replacement or work equipment refreshes",
    ],
    exportChecklist: [
      "Check the timing of annual and quarterly expenses",
      "Confirm which subscriptions are still active",
      "Review whether savings goals are funded by current surplus or one-off transfers",
    ],
  };
}
