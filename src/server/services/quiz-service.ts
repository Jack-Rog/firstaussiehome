import { TOOL_DISCLAIMER_TEXT } from "@/src/lib/compliance";
import { getLearningPath } from "@/src/lib/learning-paths";
import type {
  OnboardingAnswers,
  OnboardingResult,
  SchemeScreeningAnswers,
  SchemeScreeningResult,
} from "@/src/lib/types";

export function buildOnboardingResult(input: OnboardingAnswers): OnboardingResult {
  const pathId = input.goals.includes("buy-first-home")
    ? "first-home-roadmap-nsw"
    : input.goals.includes("super-tax")
      ? "tax-for-first-job"
      : input.goals.includes("investing-basics")
        ? "investing-basics"
        : "week-1-money-reset";
  const path = getLearningPath(pathId);
  const ultraSimpleTrack =
    input.payg &&
    input.single &&
    !input.dependants &&
    !input.businessIncome &&
    !input.trusts &&
    !input.property &&
    input.smallPortfolio;
  const mayBeEligible =
    input.firstHomeBuyer &&
    !input.property &&
    input.australianCitizenOrResident &&
    input.livingInNsw;
  const needsManualCheck =
    !input.buyingNewHome ||
    input.buyingSoloOrJoint === "joint" ||
    !ultraSimpleTrack;

  return {
    selectedGoals: input.goals,
    ultraSimpleTrack,
    learningPathId: path.id,
    mayBeEligible,
    needsManualCheck,
    schemeSummary: mayBeEligible
      ? "You may be eligible for one or more first-home pathways, subject to price caps, occupancy rules, and the full government criteria."
      : "Your answers do not line up with the broadest first-home indicators, so treat this as a learning screen and check the official criteria before ruling anything in or out.",
    officialLinks: [
      "SERVICE_NSW_FHBAS",
      "REVENUE_NSW_FHOG",
      "FIRSTHOME_HOME_GUARANTEE",
      "FIRSTHOME_FHSS",
    ],
    readinessChecklist: [
      mayBeEligible
        ? "Check the linked government pages for price caps, owner-occupier rules, and any timing conditions."
        : "Use the linked official pages to confirm whether a different purchase setup changes the broad result.",
      "Keep salary, debt, savings, and expense figures in one place before using calculators.",
      needsManualCheck
        ? "Joint ownership, non-new builds, or more complex finances can widen the assumptions used in the next step."
        : "Your answers sit inside the simpler comparison track, so the next step can stay more focused.",
      "Use each number as a comparison point only. It does not replace a lender, broker, or licensed adviser assessment.",
    ],
    disclaimer: TOOL_DISCLAIMER_TEXT,
    calculatorPrefill: {
      annualSalary: input.annualSalary,
      privateDebt: input.privateDebt,
      hecsDebt: input.hecsDebt,
      currentSavings: input.currentSavings,
      averageMonthlyExpenses: input.averageMonthlyExpenses,
      targetPropertyPrice: input.desiredPropertyPrice,
    },
    tierJourney: [
      {
        tier: "Tier 1",
        title: "Check broad scheme fit",
        summary: "Use the quiz and fact cards to understand grants, guarantees, and first-home numbers in plain English.",
        status: "now",
      },
      {
        tier: "Tier 2",
        title: "Compare deeper modelling",
        summary: "Move into Pro if you want CSV-based cashflow modelling and a readiness report with clearer assumptions.",
        status: "next",
      },
      {
        tier: "Tier 3",
        title: "Licensed advice later",
        summary: "The advice lane is not available yet and remains a future AFSL-partner workflow only.",
        status: "later",
      },
    ],
    nextPrimaryCta: {
      href: mayBeEligible ? "/tools/deposit-runway" : "/paths",
      label: mayBeEligible ? "See first-home numbers" : `Open ${path.title}`,
    },
  };
}

export function buildSchemeScreeningResult(input: SchemeScreeningAnswers): SchemeScreeningResult {
  const mayBeEligible =
    input.firstHomeBuyer && input.australianCitizenOrResident && input.livingInNsw;
  const needsManualCheck = !input.buyingNewHome || input.buyingSoloOrJoint === "joint";

  return {
    mayBeEligible,
    needsManualCheck,
    officialLinks: [
      "SERVICE_NSW_FHBAS",
      "REVENUE_NSW_FHOG",
      "FIRSTHOME_HOME_GUARANTEE",
      "FIRSTHOME_FHSS",
    ],
    assumptions: [
      "This screen uses broad concept checks only.",
      "Price caps, income caps, occupancy rules, and timing rules can change.",
      "Joint applications can introduce extra conditions that need manual checking.",
    ],
    summary: mayBeEligible
      ? "You may be eligible for one or more first-home support pathways, subject to detailed official criteria."
      : "Your answers do not line up with the broadest day-one indicators, but official criteria can still be worth checking if circumstances change.",
  };
}

export function scoreFundamentalsQuiz(correctAnswers: number, totalQuestions: number) {
  const ratio = totalQuestions === 0 ? 0 : correctAnswers / totalQuestions;

  if (ratio >= 0.8) {
    return "Strong baseline";
  }

  if (ratio >= 0.5) {
    return "Building confidence";
  }

  return "Early stage";
}
