import { buildHomeownerPathwayOutput } from "@/src/lib/analysis/homeowner-pathway-analysis";
import { buildFirstHomeExplorerOutput } from "@/src/lib/analysis/first-home-analysis";
import { buildToolDisclaimer } from "@/src/lib/compliance";
import type { BudgetInput, DepositScenarioInput, FirstHomeExplorerInput } from "@/src/lib/types";
import { calculateBudgetSummary } from "@/src/server/calculators/budget";
import { calculateDepositRunway } from "@/src/server/calculators/deposit-runway";
import { buildHecsHelpIllustration } from "@/src/server/calculators/hecs-help";

export function buildFirstHomeAnalysisToolOutput(input: Partial<FirstHomeExplorerInput>) {
  return buildFirstHomeExplorerOutput(input);
}

export function buildDepositToolOutput(input: DepositScenarioInput) {
  const output = calculateDepositRunway(input);
  const pathwayOutput = buildHomeownerPathwayOutput(
    {
      firstHomeBuyer: true,
      livingInNsw: true,
      australianCitizenOrResident: true,
      paygOnly: true,
      targetPropertyPrice: input.targetPropertyPrice,
      currentSavings: input.currentSavings,
      annualSalary: input.annualSalary ?? 0,
      privateDebt: input.privateDebt ?? 0,
      hecsDebt: input.hecsDebt ?? 0,
      averageMonthlyExpenses: input.averageMonthlyExpenses ?? 0,
      annualSavingsRate: input.annualSavingsRate ?? 3,
    },
    {
      expandedPathway: "deposit",
      activeDepositScenario: "baseline-20",
      includeGuaranteeComparison: true,
      includeFhssConcept: true,
    },
  );
  const guaranteeScenario = pathwayOutput.pathways
    .find((pathway) => pathway.id === "deposit")
    ?.scenarioOptions?.find((scenario) => scenario.id === "guarantee-5");

  return {
    ...output,
    facts: {
      ...output.facts,
      indicativeStampDutyAfterRelief: pathwayOutput.cashOutlayOverlay.stampDuty,
      indicativeStampDutySaving: Math.max(
        output.facts.indicativeStampDuty - pathwayOutput.cashOutlayOverlay.stampDuty,
        0,
      ),
      firstHomeGuaranteeMinimumDeposit:
        guaranteeScenario?.depositAmount ?? output.facts.firstHomeGuaranteeMinimumDeposit,
    },
    disclaimer: buildToolDisclaimer(output.assumptions),
  };
}

export function buildBudgetToolOutput(input: BudgetInput) {
  const summary = calculateBudgetSummary(input);
  return {
    ...summary,
    disclaimer: buildToolDisclaimer([
      "The budget assumes fixed and variable categories remain stable in the short term.",
      "Irregular annual costs are averaged across 12 months.",
    ]),
  };
}

export function buildHecsToolOutput(annualIncome: number) {
  const model = buildHecsHelpIllustration(annualIncome);
  return {
    ...model,
    disclaimer: buildToolDisclaimer(model.assumptions),
  };
}
