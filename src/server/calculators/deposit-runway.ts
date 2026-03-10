import type { DepositScenarioInput, DepositScenarioOutput } from "@/src/lib/types";
import {
  calculateIndicativeNswFirstHomeDuty,
  calculateIndicativeNswTransferDuty,
} from "@/src/lib/stampDuty";

const REVIEW_DATE = "2026-03-03";
const DEFAULT_DEPOSIT_TARGETS = [5, 10, 20];
const HOME_LOAN_RATE = 6.1;
const HOME_LOAN_TERM_YEARS = 30;
const PRIVATE_DEBT_RATE = 8.5;
const PRIVATE_DEBT_TERM_YEARS = 5;
const TAKE_HOME_PROXY = 0.76;

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

export function calculateDepositRunway(input: DepositScenarioInput): DepositScenarioOutput {
  const targetPropertyPrice = clampMoney(input.targetPropertyPrice);
  const currentSavings = clampMoney(input.currentSavings);
  const annualSalary = clampMoney(input.annualSalary ?? 0);
  const privateDebt = clampMoney(input.privateDebt ?? 0);
  const hecsDebt = clampMoney(input.hecsDebt ?? 0);
  const averageMonthlyExpenses = clampMoney(input.averageMonthlyExpenses ?? 0);
  const annualSavingsRate = clampMoney(input.annualSavingsRate ?? 3);
  const targets = input.depositTargets && input.depositTargets.length > 0 ? input.depositTargets : DEFAULT_DEPOSIT_TARGETS;

  const estimatedNetMonthlyIncome = annualSalary > 0 ? (annualSalary * TAKE_HOME_PROXY) / 12 : 0;
  const privateDebtServicing = amortizedMonthlyRepayment(privateDebt, PRIVATE_DEBT_RATE, PRIVATE_DEBT_TERM_YEARS);
  const monthlySavings =
    input.monthlySavings ?? Math.max(estimatedNetMonthlyIncome - averageMonthlyExpenses - privateDebtServicing, 0);
  const homeLoanAmount = Math.max(targetPropertyPrice - currentSavings, 0);
  const indicativeHomeLoanRepayment = amortizedMonthlyRepayment(homeLoanAmount, HOME_LOAN_RATE, HOME_LOAN_TERM_YEARS);
  const indicativeDebtServicing = indicativeHomeLoanRepayment + privateDebtServicing;
  const totalDebt = homeLoanAmount + privateDebt + hecsDebt;
  const existingDebt = privateDebt + hecsDebt;
  const indicativeStampDuty = calculateIndicativeNswTransferDuty(targetPropertyPrice);
  const indicativeStampDutyAfterRelief = calculateIndicativeNswFirstHomeDuty(targetPropertyPrice);
  const firstHomeGuaranteeMinimumDeposit = targetPropertyPrice * 0.05;

  const scenarioRows = targets.map((depositPercent) => {
    const targetAmount = targetPropertyPrice * (depositPercent / 100);
    let savings = currentSavings;
    let months = 0;

    while (savings < targetAmount && months < 1200) {
      savings += monthlySavings;

      if ((months + 1) % 12 === 0) {
        savings *= 1 + annualSavingsRate / 100;
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

  return {
    scenarioRows,
    facts: {
      indicativeStampDuty,
      indicativeStampDutyAfterRelief,
      indicativeStampDutySaving: Math.max(indicativeStampDuty - indicativeStampDutyAfterRelief, 0),
      firstHomeGuaranteeMinimumDeposit,
      currentDepositPercent: targetPropertyPrice === 0 ? 0 : (currentSavings / targetPropertyPrice) * 100,
      currentLoanToValueRatio: targetPropertyPrice === 0 ? 0 : (homeLoanAmount / targetPropertyPrice) * 100,
      projectedDebtToIncomeRatio: annualSalary === 0 ? 0 : totalDebt / annualSalary,
      existingDebtToIncomeRatio: annualSalary === 0 ? 0 : existingDebt / annualSalary,
      indicativeHomeLoanRepayment,
      indicativeDebtServicing,
      estimatedMonthlyBuffer: estimatedNetMonthlyIncome - averageMonthlyExpenses - indicativeDebtServicing,
    },
    infoNotes: [
      {
        id: "lmi",
        label: "LVR and LMI",
        body: "LMI is commonly charged when LVR is above 80%, unless a guarantee pathway changes that setup. This page does not assess lender policy.",
      },
      {
        id: "dti",
        label: "Debt-to-income ratio",
        body: "DTI compares total debt with gross annual income. Lenders often apply more scrutiny as the ratio rises, but each lender can set different limits.",
      },
      {
        id: "servicing",
        label: "Debt servicing estimate",
        body: "The servicing figure combines an illustrative home-loan repayment with an illustrative private-debt repayment. HELP is shown in the debt totals, but its cashflow effect depends on taxable income settings.",
      },
      {
        id: "stamp-duty",
        label: "Stamp duty saving",
        body: "The duty saving is an indicative NSW first-home comparison only. Full eligibility still depends on the current government criteria, including price caps and occupancy rules.",
      },
    ],
    reviewDate: REVIEW_DATE,
    assumptions: [
      "Indicative NSW transfer duty uses the Revenue NSW rate table reviewed on 3 March 2026.",
      "Indicative NSW first-home duty relief uses a simple band model: full relief up to $800,000 and a tapered amount up to $1,000,000.",
      "Home-loan repayments use a 30-year principal-and-interest comparison rate of 6.1%.",
      "Private debt servicing uses a 5-year comparison term at 8.5%.",
      "If no monthly savings amount is entered, the timeline uses a 76% take-home proxy of gross salary before subtracting expenses and private debt servicing.",
    ],
    sensitivityNotes: [
      "Salary deductions, rent changes, and irregular costs can move the timeline materially.",
      "Scheme administrators and lenders can apply additional criteria not shown in this comparison.",
      "Government thresholds and duty settings can change, so confirm current rules on the linked official pages.",
    ],
  };
}
