import { formatCurrency } from "@/src/lib/utils";
import type { CsvImportResult, DepositScenarioOutput, ReadinessReportModel } from "@/src/lib/types";

export function buildReadinessReport(input: {
  depositOutput: DepositScenarioOutput;
  importSummary?: CsvImportResult | null;
}): ReadinessReportModel {
  const topScenario = input.depositOutput.scenarioRows[0];
  const latestScenario = input.depositOutput.scenarioRows[input.depositOutput.scenarioRows.length - 1];
  const capacity = input.importSummary?.totals.estimatedMonthlyCapacity ?? 0;

  const model: ReadinessReportModel = {
    snapshot: [
      `Current modelling compares deposit ranges from ${topScenario.depositPercent}% to ${latestScenario.depositPercent}%.`,
      `Estimated monthly savings capacity in the current model: ${formatCurrency(capacity)}.`,
    ],
    assumptions: [
      ...input.depositOutput.assumptions,
      "CSV categorisation uses MVP rules and may need manual checking.",
    ],
    scenarioRanges: input.depositOutput.scenarioRows.map(
      (row) => `${row.depositPercent}% target: about ${row.monthsToTarget} months (${formatCurrency(row.targetAmount)}).`,
    ),
    schemeIndicators: [
      "NSW and federal scheme concepts can be cross-checked from the schemes hub.",
      "Any scheme indicator remains a broad screen until official criteria are checked in full.",
    ],
    missingInformation: [
      "Property price range still needs a real-world validation step.",
      "Upfront purchase costs beyond the deposit may change the working range.",
      "If income, dependants, or ownership history changes, use broader assumptions.",
    ],
    professionalQuestions: [
      "Which assumptions become less reliable if income or living arrangements change?",
      "Which documents would be required to verify a borrowing or grant application with a licensed provider?",
    ],
    generatedAt: new Date().toISOString(),
  };

  return model;
}
