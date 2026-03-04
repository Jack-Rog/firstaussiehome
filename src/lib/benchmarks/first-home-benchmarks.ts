import type { BenchmarkBand } from "@/src/lib/types";

export const BENCHMARK_REVIEW_DATE = "2026-03-03";

type BenchmarkDefinition = {
  sourceLabel: string;
  sourceScope: string;
  lastReviewed: string;
  href?: string;
  lowerMax: number;
  middleMax: number;
  lowDescriptor: string;
  midDescriptor: string;
  highDescriptor: string;
};

const INCOME_BENCHMARK: BenchmarkDefinition = {
  sourceLabel: "ABS employee earnings proxy",
  sourceScope: "NSW-focused banding with national fallback",
  lastReviewed: BENCHMARK_REVIEW_DATE,
  href: "https://www.abs.gov.au/statistics/labour/earnings-and-working-conditions/employee-earnings/latest-release",
  lowerMax: 70000,
  middleMax: 105000,
  lowDescriptor: "around the lower quarter",
  midDescriptor: "around the middle half",
  highDescriptor: "around the upper quarter",
};

const DEPOSIT_BENCHMARK: BenchmarkDefinition = {
  sourceLabel: "Public first-home deposit readiness proxy",
  sourceScope: "5%, 10%, and 20% hurdle bands",
  lastReviewed: BENCHMARK_REVIEW_DATE,
  href: "https://www.housingaustralia.gov.au/support-buy-home/home-guarantee-scheme",
  lowerMax: 0.05,
  middleMax: 0.15,
  lowDescriptor: "below the common first-home hurdle",
  midDescriptor: "around the middle readiness band",
  highDescriptor: "around the upper readiness band",
};

const EXPENSE_RATIO_BENCHMARK: BenchmarkDefinition = {
  sourceLabel: "ABS household spending proxy",
  sourceScope: "Young-adult expense burden comparison",
  lastReviewed: BENCHMARK_REVIEW_DATE,
  href: "https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/household-spending-indicator",
  lowerMax: 0.4,
  middleMax: 0.6,
  lowDescriptor: "lighter cost base",
  midDescriptor: "around the middle burden band",
  highDescriptor: "heavier cost base",
};

function toBand(value: number, definition: BenchmarkDefinition, inversePreference = false): BenchmarkBand {
  const low = {
    label: inversePreference ? "Upper benchmark band" : "Lower benchmark band",
    descriptor: definition.lowDescriptor,
  } as const;
  const middle = {
    label: "Middle benchmark band",
    descriptor: definition.midDescriptor,
  } as const;
  const high = {
    label: inversePreference ? "Lower benchmark band" : "Upper benchmark band",
    descriptor: definition.highDescriptor,
  } as const;

  const selected =
    value <= definition.lowerMax ? low : value <= definition.middleMax ? middle : high;

  return {
    label: selected.label,
    descriptor: selected.descriptor,
    sourceLabel: definition.sourceLabel,
    sourceScope: definition.sourceScope,
    lastReviewed: definition.lastReviewed,
  };
}

export function getIncomeBenchmark(annualSalary: number) {
  return toBand(annualSalary, INCOME_BENCHMARK);
}

export function getDepositBenchmark(currentSavings: number, targetPropertyPrice: number) {
  const ratio = targetPropertyPrice <= 0 ? 0 : currentSavings / targetPropertyPrice;
  return toBand(ratio, DEPOSIT_BENCHMARK);
}

export function getExpenseBenchmark(averageMonthlyExpenses: number, estimatedNetMonthlyIncome: number) {
  const ratio = estimatedNetMonthlyIncome <= 0 ? 1 : averageMonthlyExpenses / estimatedNetMonthlyIncome;
  return toBand(ratio, EXPENSE_RATIO_BENCHMARK, true);
}

export function listBenchmarkSources() {
  return [INCOME_BENCHMARK, DEPOSIT_BENCHMARK, EXPENSE_RATIO_BENCHMARK].map((definition) => ({
    label: definition.sourceLabel,
    href: definition.href,
    note: `${definition.sourceScope}. Reviewed ${definition.lastReviewed}.`,
  }));
}
