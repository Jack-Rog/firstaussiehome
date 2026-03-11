import { describe, expect, it } from "vitest";
import { DEFAULT_HOMEOWNER_PATHWAY_INPUT } from "@/src/lib/analysis/homeowner-pathway-analysis";
import {
  bandIncomeAmount,
  bandPropertyPrice,
  bandSavingsAmount,
  buildResearchTags,
  deriveResearchContextFromHomeownerInput,
  deriveResearchDetailBand,
} from "@/src/lib/research";

describe("research helpers", () => {
  it("bands income, savings, and property values consistently", () => {
    expect(bandIncomeAmount(75000)).toBe("lt-80k");
    expect(bandIncomeAmount(120000)).toBe("120k-160k");
    expect(bandSavingsAmount(18000)).toBe("lt-20k");
    expect(bandSavingsAmount(90000)).toBe("50k-100k");
    expect(bandPropertyPrice(550000)).toBe("lt-600k");
    expect(bandPropertyPrice(950000)).toBe("800k-1m");
  });

  it("derives research detail band from total free-text depth", () => {
    expect(deriveResearchDetailBand("Unsure", "Nothing yet")).toBe("thin");
    expect(
      deriveResearchDetailBand(
        "I keep bouncing between scheme pages and calculators and still do not know whether I can buy earlier.",
        "I tried spreadsheets, talked to friends, and read state guidance.",
      ),
    ).toBe("solid");
    expect(
      deriveResearchDetailBand(
        "I have spent weeks trying to understand which options change my deposit path, whether I should save more, and how much extra cash I would need at settlement before I even start inspecting properties.",
        "I have used spreadsheets, budget apps, blog posts, official scheme pages, and a broker conversation, but I still cannot turn it into a clean step-by-step plan that feels safe.",
      ),
    ).toBe("rich");
  });

  it("derives dashboard context and flat tags for later analysis", () => {
    const context = deriveResearchContextFromHomeownerInput({
      ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
      homeState: "nsw",
      actHouseholdIncome: 110000,
      currentSavings: 45000,
      buyingSoloOrJoint: "solo",
      targetPropertyPrice: 780000,
    });

    expect(context).toEqual({
      state: "nsw",
      incomeBand: "80k-120k",
      savingsBand: "20k-50k",
      buyingMode: "solo",
      propertyPriceBand: "600k-800k",
    });

    expect(
      buildResearchTags({
        surface: "dashboard",
        category: "options-and-schemes",
        timeStuck: "1-3-months",
        slowdownLevel: 4,
        buyTimeline: "1-2-years",
        confidenceLevel: 2,
        interviewOptIn: true,
        detailBand: "solid",
        careerStage: "0-2-years-working",
        context,
      }),
    ).toContain("income_band:80k-120k");
  });
});
