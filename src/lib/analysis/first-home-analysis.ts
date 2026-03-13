import {
  BENCHMARK_REVIEW_DATE,
  getDepositBenchmark,
  getExpenseBenchmark,
  getIncomeBenchmark,
  listBenchmarkSources,
} from "@/src/lib/benchmarks/first-home-benchmarks";
import { REFERENCE_LINKS } from "@/src/lib/references";
import type {
  BorrowingRangeResult,
  ExplorerCategory,
  ExplorerStatus,
  FirstHomeExplorerInput,
  FirstHomeExplorerOutput,
  ReferenceKey,
} from "@/src/lib/types";
import { formatCurrency, formatPercent } from "@/src/lib/utils";
import {
  calculateIndicativeNswFirstHomeDuty,
  calculateIndicativeNswTransferDuty,
} from "@/src/lib/stampDuty";

export const FIRST_HOME_REVIEW_DATE = "2026-03-03";
const TAKE_HOME_PROXY = 0.76;
const HOME_LOAN_RATE = 6.1;
const ASSESSMENT_RATE = 8.1;
const HOME_LOAN_TERM_YEARS = 30;
const PRIVATE_DEBT_RATE = 8.5;
const PRIVATE_DEBT_TERM_YEARS = 5;
const MAX_REPAYMENT_SHARE = 0.35;
const DTI_REFERENCE_CAP = 6;
const DEPOSIT_TARGETS = [5, 10, 20];

export const DEFAULT_FIRST_HOME_EXPLORER_INPUT: FirstHomeExplorerInput = {
  firstHomeBuyer: true,
  livingInNsw: true,
  buyingNewHome: false,
  australianCitizenOrResident: true,
  buyingSoloOrJoint: "solo",
  paygOnly: true,
  dependants: false,
  businessIncome: false,
  existingProperty: false,
  annualSalary: 85000,
  privateDebt: 12000,
  hecsDebt: 18000,
  currentSavings: 45000,
  averageMonthlyExpenses: 2800,
  targetPropertyPrice: 780000,
  annualSavingsRate: 3,
};

function clampMoney(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function amortizedMonthlyRepayment(principal: number, annualRate: number, termYears: number) {
  if (principal <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const periods = termYears * 12;

  if (monthlyRate === 0) {
    return principal / periods;
  }

  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -periods));
}

function principalFromMonthlyRepayment(monthlyPayment: number, annualRate: number, termYears: number) {
  if (monthlyPayment <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const periods = termYears * 12;

  if (monthlyRate === 0) {
    return monthlyPayment * periods;
  }

  return (monthlyPayment * (1 - Math.pow(1 + monthlyRate, -periods))) / monthlyRate;
}

function buildTimeToSaveRows(input: FirstHomeExplorerInput, derivedMonthlySavings: number) {
  return DEPOSIT_TARGETS.map((depositPercent) => {
    const targetAmount = input.targetPropertyPrice * (depositPercent / 100);
    let savings = input.currentSavings;
    let months = 0;

    while (savings < targetAmount && months < 1200) {
      savings += derivedMonthlySavings;

      if ((months + 1) % 12 === 0) {
        savings *= 1 + input.annualSavingsRate / 100;
      }

      months += 1;
    }

    return {
      depositPercent,
      targetAmount,
      monthsToTarget: months,
      yearsToTarget: Number((months / 12).toFixed(1)),
    };
  });
}

function getLvrBand(loanToValueRatio: number) {
  if (loanToValueRatio <= 80) {
    return {
      label: "Lower leverage band",
      tone: "positive" as const,
    };
  }

  if (loanToValueRatio <= 95) {
    return {
      label: "Higher-friction band",
      tone: "watch" as const,
    };
  }

  return {
    label: "Very high leverage band",
    tone: "caution" as const,
  };
}

function getDtiChips(projectedDti: number) {
  const chips: string[] = [];

  if (projectedDti > 8) {
    chips.push("High leverage band");
  } else if (projectedDti > 6) {
    chips.push("Tighter servicing scrutiny band");
  } else {
    chips.push("Within broad DTI reference band");
  }

  return chips;
}

function getBorrowingRange(input: FirstHomeExplorerInput, estimatedNetMonthlyIncome: number): BorrowingRangeResult {
  const maxRepayment = estimatedNetMonthlyIncome * MAX_REPAYMENT_SHARE;
  const affordabilityBasedMaxLoan = principalFromMonthlyRepayment(
    maxRepayment,
    ASSESSMENT_RATE,
    HOME_LOAN_TERM_YEARS,
  );
  const dtiBasedMaxLoan = Math.max(input.annualSalary * DTI_REFERENCE_CAP - input.privateDebt - input.hecsDebt, 0);
  const illustrativeBorrowingRange = Math.max(Math.min(affordabilityBasedMaxLoan, dtiBasedMaxLoan), 0);

  let cappedBy: BorrowingRangeResult["cappedBy"] = "within broad reference band";

  if (affordabilityBasedMaxLoan < dtiBasedMaxLoan) {
    cappedBy = "serviceability-limited";
  } else if (dtiBasedMaxLoan < affordabilityBasedMaxLoan) {
    cappedBy = "DTI-limited";
  }

  return {
    cappedBy,
    affordabilityBasedMaxLoan,
    dtiBasedMaxLoan,
    illustrativeBorrowingRange,
    repaymentShare: estimatedNetMonthlyIncome === 0 ? 0 : maxRepayment / estimatedNetMonthlyIncome,
  };
}

function findCategory(categories: ExplorerCategory[], id: ExplorerCategory["id"]) {
  const category = categories.find((entry) => entry.id === id);

  if (!category) {
    throw new Error(`Missing explorer category: ${id}`);
  }

  return category;
}

function pickPeerHeadline(input: FirstHomeExplorerInput, estimatedNetMonthlyIncome: number) {
  const incomeBand = getIncomeBenchmark(input.annualSalary);
  const savingsBand = getDepositBenchmark(input.currentSavings, input.targetPropertyPrice);
  const expenseBand = getExpenseBenchmark(input.averageMonthlyExpenses, estimatedNetMonthlyIncome);

  if (savingsBand.label === "Upper benchmark band") {
    return `Savings: ${savingsBand.label}`;
  }

  if (incomeBand.label === "Upper benchmark band") {
    return `Income: ${incomeBand.label}`;
  }

  if (expenseBand.label === "Upper benchmark band") {
    return `Costs: ${expenseBand.label}`;
  }

  return `Income: ${incomeBand.label}`;
}

function mapToneFromStatus(status: ExplorerStatus) {
  return status;
}

function buildSources(extraReferenceKeys: ReferenceKey[]) {
  const linkSources = extraReferenceKeys.map((key) => ({
    label: REFERENCE_LINKS[key].label,
    href: REFERENCE_LINKS[key].href,
    note: REFERENCE_LINKS[key].note,
  }));

  return [...linkSources, ...listBenchmarkSources()];
}

export function buildFirstHomeExplorerOutput(
  partialInput: Partial<FirstHomeExplorerInput>,
): FirstHomeExplorerOutput {
  const input: FirstHomeExplorerInput = {
    ...DEFAULT_FIRST_HOME_EXPLORER_INPUT,
    ...partialInput,
    annualSalary: clampMoney(partialInput.annualSalary ?? DEFAULT_FIRST_HOME_EXPLORER_INPUT.annualSalary),
    privateDebt: clampMoney(partialInput.privateDebt ?? DEFAULT_FIRST_HOME_EXPLORER_INPUT.privateDebt),
    hecsDebt: clampMoney(partialInput.hecsDebt ?? DEFAULT_FIRST_HOME_EXPLORER_INPUT.hecsDebt),
    currentSavings: clampMoney(partialInput.currentSavings ?? DEFAULT_FIRST_HOME_EXPLORER_INPUT.currentSavings),
    averageMonthlyExpenses: clampMoney(
      partialInput.averageMonthlyExpenses ?? DEFAULT_FIRST_HOME_EXPLORER_INPUT.averageMonthlyExpenses,
    ),
    targetPropertyPrice: clampMoney(
      partialInput.targetPropertyPrice ?? DEFAULT_FIRST_HOME_EXPLORER_INPUT.targetPropertyPrice,
    ),
    annualSavingsRate: clampMoney(
      partialInput.annualSavingsRate ?? DEFAULT_FIRST_HOME_EXPLORER_INPUT.annualSavingsRate,
    ),
  };

  const estimatedNetMonthlyIncome = (input.annualSalary * TAKE_HOME_PROXY) / 12;
  const privateDebtServicing = amortizedMonthlyRepayment(
    input.privateDebt,
    PRIVATE_DEBT_RATE,
    PRIVATE_DEBT_TERM_YEARS,
  );
  const derivedMonthlySavings = Math.max(
    estimatedNetMonthlyIncome - input.averageMonthlyExpenses - privateDebtServicing,
    0,
  );
  const homeLoanAmount = Math.max(input.targetPropertyPrice - input.currentSavings, 0);
  const indicativeHomeLoanRepayment = amortizedMonthlyRepayment(
    homeLoanAmount,
    HOME_LOAN_RATE,
    HOME_LOAN_TERM_YEARS,
  );
  const indicativeDebtServicing = indicativeHomeLoanRepayment + privateDebtServicing;
  const estimatedMonthlyBuffer = estimatedNetMonthlyIncome - input.averageMonthlyExpenses - indicativeDebtServicing;
  const projectedDti = input.annualSalary === 0 ? 0 : (homeLoanAmount + input.privateDebt + input.hecsDebt) / input.annualSalary;
  const currentLvr = input.targetPropertyPrice === 0 ? 0 : (homeLoanAmount / input.targetPropertyPrice) * 100;
  const depositPercent = input.targetPropertyPrice === 0 ? 0 : (input.currentSavings / input.targetPropertyPrice) * 100;
  const stampDuty = calculateIndicativeNswTransferDuty(input.targetPropertyPrice);
  const firstHomeDuty = calculateIndicativeNswFirstHomeDuty(input.targetPropertyPrice);
  const stampDutySaving = Math.max(stampDuty - firstHomeDuty, 0);
  const firstHomeGuaranteeMinimumDeposit = input.targetPropertyPrice * 0.05;
  const timeToSaveRows = buildTimeToSaveRows(input, derivedMonthlySavings);
  const closestDepositRow = timeToSaveRows.find((row) => row.targetAmount > input.currentSavings) ?? timeToSaveRows[0];
  const borrowingRange = getBorrowingRange(input, estimatedNetMonthlyIncome);
  const mayBeEligible =
    input.firstHomeBuyer &&
    !input.existingProperty &&
    input.australianCitizenOrResident &&
    input.livingInNsw;
  const needsManualCheck =
    !input.buyingNewHome ||
    input.buyingSoloOrJoint === "joint" ||
    !input.paygOnly ||
    input.dependants ||
    input.businessIncome;
  const lvrBand = getLvrBand(currentLvr);
  const peerHeadline = pickPeerHeadline(input, estimatedNetMonthlyIncome);
  const incomeBand = getIncomeBenchmark(input.annualSalary);
  const savingsBand = getDepositBenchmark(input.currentSavings, input.targetPropertyPrice);
  const expenseBand = getExpenseBenchmark(input.averageMonthlyExpenses, estimatedNetMonthlyIncome);

  const categories: ExplorerCategory[] = [
    {
      id: "scheme-fit",
      label: "Scheme fit",
      subtitle: "Broad screen only",
      headlineValue: mayBeEligible ? "May be eligible" : "Needs manual check",
      headlineStatus: mayBeEligible ? "positive" : "watch",
      microVisual: {
        kind: "status",
        value: mayBeEligible ? 72 : 38,
        label: mayBeEligible ? "Broad fit" : "Broader review",
      },
      statusChips: [
        input.firstHomeBuyer ? "First-home flag on" : "Prior ownership flagged",
        input.buyingNewHome ? "New-home grant concept in range" : "Existing-home path",
        input.livingInNsw ? "NSW screen active" : "Outside NSW screen",
        input.buyingSoloOrJoint === "joint" ? "Joint application" : "Solo application",
      ],
      expandedMetrics: [
        { label: "NSW first-home duty relief", value: mayBeEligible ? "May be in range" : "Manual check" },
        { label: "NSW new-home grant", value: input.buyingNewHome ? "May be in range" : "Not highlighted" },
        { label: "Federal guarantee concept", value: mayBeEligible ? "May be in range" : "Manual check" },
        { label: "FHSS concept", value: "Official criteria still apply" },
      ],
      detailNotes: [
        needsManualCheck ? "Complexity flag active" : "Simpler comparison track",
        "Official criteria remain the source of truth",
      ],
      officialLinks: [
        "SERVICE_NSW_FHBAS",
        "REVENUE_NSW_FHOG",
        "FIRSTHOME_HOME_GUARANTEE",
        "FIRSTHOME_FHSS",
      ],
    },
    {
      id: "stamp-duty",
      label: "Stamp duty",
      subtitle: "NSW indicative comparison",
      headlineValue: formatCurrency(stampDuty),
      headlineStatus: stampDutySaving > 0 ? "positive" : "neutral",
      microVisual: {
        kind: "progress",
        value: Math.min((stampDutySaving / Math.max(stampDuty, 1)) * 100, 100),
        label: "Relief effect",
      },
      statusChips: [stampDutySaving > 0 ? "Relief band visible" : "Standard duty only"],
      expandedMetrics: [
        { label: "Standard duty", value: formatCurrency(stampDuty) },
        { label: "Indicative first-home duty", value: formatCurrency(firstHomeDuty) },
        { label: "Indicative duty saving", value: formatCurrency(stampDutySaving), tone: "positive" },
      ],
      detailNotes: ["Revenue NSW rate table", `Reviewed ${FIRST_HOME_REVIEW_DATE}`],
      officialLinks: ["SERVICE_NSW_FHBAS", "REVENUE_NSW_FHOG"],
    },
    {
      id: "deposit",
      label: "Deposit",
      subtitle: "Deposit share and leverage",
      headlineValue: formatPercent(depositPercent),
      headlineStatus: mapToneFromStatus(lvrBand.tone),
      microVisual: {
        kind: "progress",
        value: Math.min((depositPercent / 20) * 100, 100),
        label: "20% target scale",
      },
      statusChips: [lvrBand.label, currentLvr > 80 ? "Extra cost friction can apply" : "Lower friction band"],
      expandedMetrics: [
        { label: "5% target", value: formatCurrency(firstHomeGuaranteeMinimumDeposit) },
        { label: "10% target", value: formatCurrency(input.targetPropertyPrice * 0.1) },
        { label: "20% target", value: formatCurrency(input.targetPropertyPrice * 0.2) },
        { label: "Current deposit share", value: formatPercent(depositPercent) },
        { label: "Current LVR", value: formatPercent(currentLvr), tone: mapToneFromStatus(lvrBand.tone) },
      ],
      detailNotes: ["5%, 10%, and 20% hurdle bands", "LVR over 80% can add extra friction"],
      officialLinks: ["FIRSTHOME_HOME_GUARANTEE"],
    },
    {
      id: "time-to-save",
      label: "Time to save",
      subtitle: "Using the current gap",
      headlineValue: `${closestDepositRow.monthsToTarget} months`,
      headlineStatus: closestDepositRow.monthsToTarget <= 24 ? "positive" : closestDepositRow.monthsToTarget <= 60 ? "watch" : "caution",
      microVisual: {
        kind: "progress",
        value: Math.max(0, 100 - Math.min(closestDepositRow.monthsToTarget, 120) / 1.2),
        label: "Speed",
      },
      statusChips: [
        `${formatCurrency(derivedMonthlySavings)} monthly gap`,
        `${input.annualSavingsRate.toFixed(1)}% savings-rate assumption`,
      ],
      expandedMetrics: timeToSaveRows.flatMap((row) => [
        {
          label: `${row.depositPercent}% target`,
          value: formatCurrency(row.targetAmount),
        },
        {
          label: `${row.depositPercent}% time`,
          value: `${row.monthsToTarget} months`,
        },
      ]),
      detailNotes: ["Uses a gross-to-net proxy", "Private debt servicing is included"],
    },
    {
      id: "borrowing",
      label: "Borrowing range",
      subtitle: "Illustrative educational range",
      headlineValue: formatCurrency(borrowingRange.illustrativeBorrowingRange),
      headlineStatus:
        borrowingRange.cappedBy === "within broad reference band"
          ? "positive"
          : borrowingRange.cappedBy === "serviceability-limited"
            ? "watch"
            : "caution",
      microVisual: {
        kind: "progress",
        value: Math.min(borrowingRange.repaymentShare * 100, 100),
        label: "Repayment share",
      },
      statusChips: [borrowingRange.cappedBy, ...getDtiChips(projectedDti)],
      expandedMetrics: [
        { label: "Affordability-based max loan", value: formatCurrency(borrowingRange.affordabilityBasedMaxLoan) },
        { label: "DTI-capped max loan", value: formatCurrency(borrowingRange.dtiBasedMaxLoan) },
        { label: "Illustrative borrowing range", value: formatCurrency(borrowingRange.illustrativeBorrowingRange) },
        { label: "Indicative monthly repayment", value: formatCurrency(indicativeHomeLoanRepayment) },
        { label: "Estimated monthly buffer", value: formatCurrency(estimatedMonthlyBuffer) },
        { label: "Repayment share", value: formatPercent(borrowingRange.repaymentShare * 100) },
        { label: "Projected DTI", value: `${projectedDti.toFixed(1)}x` },
      ],
      detailNotes: ["Assessment rate fixed at 8.1%", "Generic DTI reference cap fixed at 6.0x"],
      officialLinks: ["MONEYSMART_HOME"],
    },
    {
      id: "peer-position",
      label: "Position vs peers",
      subtitle: "Broad benchmark bands",
      headlineValue: peerHeadline,
      headlineStatus:
        savingsBand.label === "Upper benchmark band" || incomeBand.label === "Upper benchmark band"
          ? "positive"
          : expenseBand.label === "Lower benchmark band"
            ? "caution"
            : "neutral",
      microVisual: {
        kind: "benchmark",
        value:
          savingsBand.label === "Upper benchmark band"
            ? 85
            : savingsBand.label === "Middle benchmark band"
              ? 55
              : 25,
        label: "Benchmark position",
      },
      statusChips: [incomeBand.label, savingsBand.label, expenseBand.label],
      expandedMetrics: [
        { label: "Income position", value: `${incomeBand.label} - ${incomeBand.descriptor}` },
        { label: "Deposit readiness", value: `${savingsBand.label} - ${savingsBand.descriptor}` },
        { label: "Expense burden", value: `${expenseBand.label} - ${expenseBand.descriptor}` },
      ],
      detailNotes: ["Savings uses a deposit-readiness proxy", "Bands are broad and not literal population percentiles"],
    },
  ];

  const officialKeys: ReferenceKey[] = [
    ...(findCategory(categories, "scheme-fit").officialLinks ?? []),
    ...(findCategory(categories, "stamp-duty").officialLinks ?? []),
    ...(findCategory(categories, "deposit").officialLinks ?? []),
    ...(findCategory(categories, "borrowing").officialLinks ?? []),
  ].filter((value, index, array) => array.indexOf(value) === index);

  return {
    summary: [
      {
        label: "Scheme fit",
        value: findCategory(categories, "scheme-fit").headlineValue,
        context: "Broad concept screen",
      },
      {
        label: "Deposit share",
        value: formatPercent(depositPercent),
        context: "Against the target price",
      },
      {
        label: "Illustrative range",
        value: formatCurrency(borrowingRange.illustrativeBorrowingRange),
        context: "Educational borrowing band",
      },
    ],
    categories,
    sources: buildSources(officialKeys),
    assumptions: [
      "Not financial advice - verify eligibility modelling with official sources.",
      "NSW transfer duty and first-home relief use a source-dated band model reviewed on 3 March 2026.",
      "Monthly net income uses a 76% gross-to-net proxy.",
      "Private debt servicing uses a 5-year comparison term at 8.5%.",
      "Borrowing range uses a fixed 8.1% assessment rate and a 35% repayment-share cap.",
      `Benchmark bands are source-dated broad comparisons. Benchmark review date: ${BENCHMARK_REVIEW_DATE}.`,
      "Deposit readiness is shown as a benchmark proxy, not a literal population savings percentile.",
      "Lender-friction labels are generic heuristics only and do not represent a named lender policy.",
    ],
    reviewDate: FIRST_HOME_REVIEW_DATE,
  };
}
