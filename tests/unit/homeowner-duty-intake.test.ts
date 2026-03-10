import { describe, expect, it } from "vitest";
import { deriveDutyIntakeState } from "@/src/lib/analysis/homeowner-duty-intake";
import { DEFAULT_HOMEOWNER_PATHWAY_INPUT } from "@/src/lib/analysis/homeowner-pathway-analysis";

describe("homeowner-duty-intake", () => {
  it("skips Tier 2 for a simple NSW solo established-home path", () => {
    const result = deriveDutyIntakeState({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "nsw",
      propertyTypeDetailed: "established-home",
      buyingSoloOrJoint: "solo",
      foreignBuyer: false,
    });

    expect(result.needsTier2).toBe(false);
    expect(result.visibleTier2Fields).toEqual([]);
    expect(result.tier2Complete).toBe(true);
    expect(result.uncertaintyActive).toBe(false);
  });

  it("requires WA Tier 2 answers before the duty path is treated as complete", () => {
    const incomplete = deriveDutyIntakeState({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "wa",
      propertyTypeDetailed: "established-home",
    });
    const complete = deriveDutyIntakeState({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "wa",
      propertyTypeDetailed: "established-home",
      buyerEntityType: "individuals",
      waRegion: "perth-peel",
    });

    expect(incomplete.needsTier2).toBe(true);
    expect(incomplete.visibleTier2Fields).toEqual(["buyerEntityType", "waRegion"]);
    expect(incomplete.tier2Complete).toBe(false);
    expect(incomplete.uncertaintyActive).toBe(true);
    expect(complete.tier2Complete).toBe(true);
    expect(complete.uncertaintyActive).toBe(false);
  });

  it("collects exact dependant count for ACT in Tier 2", () => {
    const result = deriveDutyIntakeState({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "act",
      buyerEntityType: "individuals",
    });

    expect(result.visibleTier2Fields).toContain("dependentChildrenCount");
    expect(result.tier2Complete).toBe(false);
  });

  it("keeps uncertainty active for Tier 3 edge cases", () => {
    const entityBuyer = deriveDutyIntakeState({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "wa",
      buyerEntityType: "trust",
      waRegion: "perth-peel",
    });
    const offThePlan = deriveDutyIntakeState({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "nsw",
      propertyTypeDetailed: "off-the-plan-home",
      buyerEntityType: "individuals",
    });

    expect(entityBuyer.hasTier3EdgeCase).toBe(true);
    expect(entityBuyer.uncertaintyActive).toBe(true);
    expect(offThePlan.hasTier3EdgeCase).toBe(true);
    expect(offThePlan.uncertaintyActive).toBe(true);
  });
});
