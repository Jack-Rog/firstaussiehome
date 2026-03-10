import { describe, expect, it } from "vitest";
import { calculateStampDuty } from "@/src/lib/stampDuty";

describe("stamp-duty rules engine", () => {
  it("calculates NSW bracket duty using fixed-plus-marginal rules", () => {
    const result = calculateStampDuty({
      state: "NSW",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(result.baseDuty).toBe(17029);
    expect(result.finalDuty).toBe(17029);
    expect(result.unresolved).toBe(false);
  });

  it("applies NSW first-home concession with zero duty under 800k", () => {
    const result = calculateStampDuty({
      state: "NSW",
      property_value: 780000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(result.baseDuty).toBeGreaterThan(0);
    expect(result.finalDuty).toBe(0);
    expect(result.appliedRules.some((rule) => rule.type === "concession")).toBe(true);
  });

  it("applies NSW tapered first-home concession between 800k and 1m", () => {
    const result = calculateStampDuty({
      state: "NSW",
      property_value: 900000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(result.finalDuty).toBe(19706);
    expect(result.concessionAmount).toBeGreaterThan(0);
  });

  it("selects NSW historical rules by transaction date", () => {
    const legacy = calculateStampDuty({
      state: "NSW",
      property_value: 900000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-02",
      foreign_buyer: false,
    });

    const current = calculateStampDuty({
      state: "NSW",
      property_value: 900000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(legacy.appliedRules[0]?.id).toBe("nsw_general_inline_legacy_until_2026_03_02");
    expect(current.appliedRules[0]?.id).toBe("nsw_general_2026_03_03");
  });

  it("applies NSW foreign buyer surcharge by date-based rates", () => {
    const currentRate = calculateStampDuty({
      state: "NSW",
      property_value: 1000000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: true,
    });
    const historicalRate = calculateStampDuty({
      state: "NSW",
      property_value: 1000000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2024-12-31",
      foreign_buyer: true,
    });

    expect(currentRate.surchargeAmount).toBe(90000);
    expect(currentRate.finalDuty).toBe(129529);
    expect(historicalRate.surchargeAmount).toBe(80000);
    expect(historicalRate.finalDuty).toBe(119529);
  });

  it("returns the expected deterministic output structure", () => {
    const result = calculateStampDuty({
      state: "NSW",
      property_value: 850000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        baseDuty: expect.any(Number),
        finalDuty: expect.any(Number),
        appliedRules: expect.any(Array),
        explanations: expect.any(Array),
        sourceUrls: expect.any(Array),
      }),
    );
  });

  it("marks unresolved rule paths with source hooks", () => {
    const result = calculateStampDuty({
      state: "NT",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: true,
    });

    expect(result.unresolved).toBe(true);
    expect(result.baseDuty).toBe(23928.6);
    expect(result.finalDuty).toBe(23928.6);
    expect(result.appliedRules.some((rule) => rule.type === "surcharge")).toBe(true);
    expect(result.sourceUrls.length).toBeGreaterThan(0);
  });

  it("calculates VIC general duty from verified non-PPR brackets", () => {
    const result = calculateStampDuty({
      state: "VIC",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(result.baseDuty).toBe(25070);
    expect(result.finalDuty).toBe(25070);
    expect(result.unresolved).toBe(false);
  });

  it("applies VIC first-home full exemption up to 600k", () => {
    const result = calculateStampDuty({
      state: "VIC",
      property_value: 550000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(result.finalDuty).toBe(0);
    expect(result.appliedRules.some((rule) => rule.id === "vic_first_home_full_exemption_2026_03_10")).toBe(true);
    expect(result.unresolved).toBe(false);
  });

  it("calculates VIC partial first-home and PPR concession bands", () => {
    const firstHomePartial = calculateStampDuty({
      state: "VIC",
      property_value: 700000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });
    const pprPartial = calculateStampDuty({
      state: "VIC",
      property_value: 300000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(firstHomePartial.baseDuty).toBe(37070);
    expect(firstHomePartial.finalDuty).toBe(24713);
    expect(firstHomePartial.unresolved).toBe(false);
    expect(firstHomePartial.appliedRules.some((rule) => rule.id === "vic_first_home_partial_concession_2026_03_10")).toBe(true);
    expect(pprPartial.baseDuty).toBe(2380);
    expect(pprPartial.finalDuty).toBe(2380);
    expect(pprPartial.unresolved).toBe(false);
    expect(pprPartial.appliedRules[0]?.id).toBe("vic_ppr_concession_2026_03_10");
  });

  it("calculates QLD general and owner-occupier home concession rates", () => {
    const general = calculateStampDuty({
      state: "QLD",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });
    const ownerOccupier = calculateStampDuty({
      state: "QLD",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(general.baseDuty).toBe(15925);
    expect(ownerOccupier.baseDuty).toBe(8700);
    expect(general.unresolved).toBe(false);
    expect(ownerOccupier.unresolved).toBe(false);
  });

  it("applies QLD first-home concession amounts and AFAD surcharge", () => {
    const firstHome = calculateStampDuty({
      state: "QLD",
      property_value: 700000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });
    const foreign = calculateStampDuty({
      state: "QLD",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: true,
    });

    expect(firstHome.finalDuty).toBe(0);
    expect(firstHome.unresolved).toBe(false);
    expect(foreign.surchargeAmount).toBe(40000);
    expect(foreign.finalDuty).toBe(55925);
  });

  it("applies WA first-home rates with region input and flags missing region as unresolved", () => {
    const metro = calculateStampDuty({
      state: "WA",
      property_value: 600000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
      state_specific_inputs: { wa_region: "metro_or_peel" },
    });
    const missingRegion = calculateStampDuty({
      state: "WA",
      property_value: 600000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(metro.baseDuty).toBe(13630);
    expect(metro.unresolved).toBe(false);
    expect(missingRegion.baseDuty).toBe(0);
    expect(missingRegion.unresolved).toBe(true);
  });

  it("calculates SA base duty and applies partial vacant-land relief formulas", () => {
    const general = calculateStampDuty({
      state: "SA",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });
    const partialBand = calculateStampDuty({
      state: "SA",
      property_value: 520000,
      property_type: "vacant_land",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(general.baseDuty).toBe(21330);
    expect(general.unresolved).toBe(false);
    expect(partialBand.baseDuty).toBe(22430);
    expect(partialBand.finalDuty).toBe(8972);
    expect(partialBand.unresolved).toBe(false);
  });

  it("applies TAS first-home established-home relief by date", () => {
    const duringRelief = calculateStampDuty({
      state: "TAS",
      property_value: 600000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });
    const postRelief = calculateStampDuty({
      state: "TAS",
      property_value: 600000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-07-01",
      foreign_buyer: false,
    });

    expect(duringRelief.finalDuty).toBe(0);
    expect(duringRelief.unresolved).toBe(false);
    expect(postRelief.finalDuty).toBe(24857.5);
    expect(postRelief.unresolved).toBe(true);
  });

  it("calculates ACT owner-occupier and non-owner rates and applies HBCS when flagged income-eligible", () => {
    const nonOwner = calculateStampDuty({
      state: "ACT",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });
    const owner = calculateStampDuty({
      state: "ACT",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });
    const firstHome = calculateStampDuty({
      state: "ACT",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
      state_specific_inputs: { act_hbcs_income_eligible: true },
    });
    const firstHomeWithoutIncomeFlag = calculateStampDuty({
      state: "ACT",
      property_value: 500000,
      property_type: "established_home",
      first_home_buyer: true,
      owner_occupier: true,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(nonOwner.baseDuty).toBe(11800);
    expect(owner.baseDuty).toBe(8408);
    expect(firstHome.finalDuty).toBe(0);
    expect(firstHome.unresolved).toBe(false);
    expect(firstHomeWithoutIncomeFlag.finalDuty).toBe(8408);
  });

  it("calculates NT duty using official formula segments with 5-cent floor rounding", () => {
    const result = calculateStampDuty({
      state: "NT",
      property_value: 123456,
      property_type: "established_home",
      first_home_buyer: false,
      owner_occupier: false,
      transaction_date: "2026-03-10",
      foreign_buyer: false,
    });

    expect(result.baseDuty).toBe(2853.4);
    expect(result.baseDuty * 20).toBeCloseTo(Math.round(result.baseDuty * 20), 8);
    expect(result.unresolved).toBe(false);
  });
});
