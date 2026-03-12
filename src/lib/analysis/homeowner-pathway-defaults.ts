import { buildHomeownerPathwayOutput, DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS } from "@/src/lib/analysis/homeowner-pathway-analysis";
import type { HomeownerPathwayInput, HomeownerPathwaySelections } from "@/src/lib/types";

export function buildDefaultHomeownerPathwaySelections(
  input: HomeownerPathwayInput,
): HomeownerPathwaySelections {
  const preview = buildHomeownerPathwayOutput(input, {
    ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
    includeGuaranteeComparison: true,
    includeFhssConcept: true,
    activeDepositScenario: "baseline-20",
  });
  const helpToBuy = preview.schemeStatuses.find((status) => status.id === "help-to-buy");
  const guarantee = preview.schemeStatuses.find((status) => status.id === "guarantee");

  return {
    ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
    includeGuaranteeComparison: true,
    includeFhssConcept: true,
    activeDepositScenario:
      helpToBuy?.state === "available" || helpToBuy?.state === "active"
        ? "shared-equity-2"
        : guarantee?.state === "available" || guarantee?.state === "active"
          ? "guarantee-5"
          : "baseline-20",
    expandedPathway: "deposit",
  };
}
