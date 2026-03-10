import { describe, expect, it } from "vitest";
import {
  buildHomeownerPathwayOutput,
  DEFAULT_HOMEOWNER_PATHWAY_INPUT,
  DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
} from "@/src/lib/analysis/homeowner-pathway-analysis";

describe("homeowner-pathway-analysis", () => {
  it("returns the three primary pathway cards", () => {
    const result = buildHomeownerPathwayOutput(DEFAULT_HOMEOWNER_PATHWAY_INPUT);

    expect(result.pathways.map((pathway) => pathway.id)).toEqual([
      "stamp-duty",
      "deposit",
      "upfront-costs",
    ]);
  });

  it("maps eligibility into the compliant badge states", () => {
    const mayBeEligible = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      firstHomeBuyer: true,
      livingInNsw: true,
      australianCitizenOrResident: true,
      paygOnly: true,
      existingProperty: false,
    });
    const notInRange = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      firstHomeBuyer: false,
      livingInNsw: false,
      australianCitizenOrResident: false,
      paygOnly: true,
      dependants: false,
      businessIncome: false,
      existingProperty: false,
      buyingSoloOrJoint: "solo",
    });

    expect(mayBeEligible.eligibility.label).toBe("MAY BE ELIGIBLE");
    expect(notInRange.eligibility.label).toBe("NOT IN RANGE");
    expect([mayBeEligible.eligibility.label, notInRange.eligibility.label]).not.toContain("ELIGIBLE");
    expect([mayBeEligible.eligibility.label, notInRange.eligibility.label]).not.toContain("INELIGIBLE");
  });

  it("uses age to map the comparison ribbon cohort", () => {
    const result = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      age: 41,
    });

    expect(result.comparisonRibbon.find((item) => item.id === "ribbon-age")?.value).toBe("peers 35-44");
  });

  it("updates deposit scenarios and cash outlay when the active scenario changes", () => {
    const baseline = buildHomeownerPathwayOutput(
      {
        ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
        firstHomeBuyer: true,
        livingInNsw: true,
        australianCitizenOrResident: true,
        paygOnly: true,
        currentSavings: 50000,
        targetPropertyPrice: 800000,
      },
      {
        ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
        activeDepositScenario: "baseline-20",
      },
    );
    const guarantee = buildHomeownerPathwayOutput(
      {
        ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
        firstHomeBuyer: true,
        livingInNsw: true,
        australianCitizenOrResident: true,
        paygOnly: true,
        currentSavings: 50000,
        targetPropertyPrice: 800000,
      },
      {
        ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
        activeDepositScenario: "guarantee-5",
      },
    );

    const baselineDeposit = baseline.pathways.find((pathway) => pathway.id === "deposit");
    const guaranteeDeposit = guarantee.pathways.find((pathway) => pathway.id === "deposit");

    expect(baselineDeposit?.scenarioOptions).toHaveLength(4);
    expect(guaranteeDeposit?.scenarioOptions?.find((scenario) => scenario.active)?.depositPercent).toBe(5);
    expect(guarantee.cashOutlayOverlay.totalBuyerCashOutlay).toBeLessThan(
      baseline.cashOutlayOverlay.totalBuyerCashOutlay,
    );
  });

  it("uses the active scenario to change payoff timing", () => {
    const baseline = buildHomeownerPathwayOutput(
      DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      {
        ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
        activeDepositScenario: "baseline-20",
      },
    );
    const midpoint = buildHomeownerPathwayOutput(
      DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      {
        ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
        activeDepositScenario: "mid-10",
      },
    );

    const baselineScenario = baseline.pathways
      .find((pathway) => pathway.id === "deposit")
      ?.scenarioOptions?.find((scenario) => scenario.active);
    const midpointScenario = midpoint.pathways
      .find((pathway) => pathway.id === "deposit")
      ?.scenarioOptions?.find((scenario) => scenario.active);

    expect(midpointScenario?.estimatedPayoffYears).toBeGreaterThanOrEqual(
      baselineScenario?.estimatedPayoffYears ?? 0,
    );
  });

  it("uses the stamp-duty engine for non-NSW states instead of manual-check fallback", () => {
    const result = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "vic",
      livingInNsw: false,
      firstHomeBuyer: true,
      australianCitizenOrResident: true,
      existingProperty: false,
      targetPropertyPrice: 550000,
    });

    const stampDutyStatus = result.schemeStatuses.find((entry) => entry.id === "stamp-duty");
    const stampDutyPathway = result.pathways.find((entry) => entry.id === "stamp-duty");
    const modelStatusMetric = stampDutyPathway?.metrics.find((metric) => metric.id === "stamp-duty-model-status");

    expect(stampDutyStatus?.detail).not.toContain("Manual check needed");
    expect(stampDutyStatus?.state).toBe("active");
    expect(modelStatusMetric?.value).toBe("Resolved rule path matched");
  });

  it("uses ACT household income to gate HBCS duty relief", () => {
    const eligible = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "act",
      livingInNsw: false,
      firstHomeBuyer: true,
      australianCitizenOrResident: true,
      existingProperty: false,
      targetPropertyPrice: 900000,
      actHouseholdIncome: 240000,
      buyerEntityType: "individuals",
      dependentChildrenCount: 0,
    });
    const ineligible = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "act",
      livingInNsw: false,
      firstHomeBuyer: true,
      australianCitizenOrResident: true,
      existingProperty: false,
      targetPropertyPrice: 900000,
      actHouseholdIncome: 260000,
      buyerEntityType: "individuals",
      dependentChildrenCount: 0,
    });

    const eligibleStampDuty = eligible.cashOutlayOverlay.stampDuty;
    const ineligibleStampDuty = ineligible.cashOutlayOverlay.stampDuty;
    const eligibleStatus = eligible.schemeStatuses.find((entry) => entry.id === "stamp-duty");
    const ineligibleStatus = ineligible.schemeStatuses.find((entry) => entry.id === "stamp-duty");

    expect(eligibleStampDuty).toBe(0);
    expect(ineligibleStampDuty).toBeGreaterThan(0);
    expect(eligibleStatus?.state).toBe("active");
    expect(ineligibleStatus?.state).toBe("inactive");
  });

  it("marks duty outputs as uncertain when Tier 2 is required but incomplete", () => {
    const result = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "wa",
      propertyTypeDetailed: "established-home",
    });

    const stampDutyPathway = result.pathways.find((entry) => entry.id === "stamp-duty");
    const stampDutyStatus = result.schemeStatuses.find((entry) => entry.id === "stamp-duty");

    expect(result.dutyIntake.needsTier2).toBe(true);
    expect(result.dutyIntake.tier2Complete).toBe(false);
    expect(stampDutyPathway?.label).toBe("Stamp Duty*");
    expect(stampDutyPathway?.headlineValue.endsWith("*")).toBe(true);
    expect(stampDutyStatus?.state).toBe("neutral");
  });

  it("keeps broad-assumption duty styling for Tier 3 edge cases", () => {
    const result = buildHomeownerPathwayOutput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "wa",
      propertyTypeDetailed: "established-home",
      buyerEntityType: "trust",
      waRegion: "perth-peel",
    });

    const stampDutyPathway = result.pathways.find((entry) => entry.id === "stamp-duty");
    const modelStatusMetric = stampDutyPathway?.metrics.find((metric) => metric.id === "stamp-duty-model-status");

    expect(result.dutyIntake.hasTier3EdgeCase).toBe(true);
    expect(result.dutyIntake.uncertaintyActive).toBe(true);
    expect(modelStatusMetric?.value).toBe("Broad assumption used*");
  });
});
