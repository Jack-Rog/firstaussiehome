import { describe, expect, it } from "vitest";
import {
  buildFirstHomeExplorerOutput,
  DEFAULT_FIRST_HOME_EXPLORER_INPUT,
} from "@/src/lib/analysis/first-home-analysis";

describe("first-home-analysis", () => {
  it("returns the six explorer categories", () => {
    const result = buildFirstHomeExplorerOutput(DEFAULT_FIRST_HOME_EXPLORER_INPUT);

    expect(result.categories.map((category) => category.id)).toEqual([
      "scheme-fit",
      "stamp-duty",
      "deposit",
      "time-to-save",
      "borrowing",
      "peer-position",
    ]);
  });

  it("switches the scheme fit headline when the first-home flag changes", () => {
    const result = buildFirstHomeExplorerOutput({
      ...DEFAULT_FIRST_HOME_EXPLORER_INPUT,
      firstHomeBuyer: false,
      existingProperty: true,
    });

    expect(result.categories[0]?.headlineValue).toBe("Needs manual check");
  });

  it("keeps DTI wording as a multiple rather than a percentage", () => {
    const result = buildFirstHomeExplorerOutput(DEFAULT_FIRST_HOME_EXPLORER_INPUT);
    const borrowingCategory = result.categories.find((category) => category.id === "borrowing");

    expect(
      borrowingCategory?.expandedMetrics.some((metric) => metric.value.includes("x")),
    ).toBe(true);
    expect(
      borrowingCategory?.expandedMetrics.some((metric) => metric.label.includes("DTI %")),
    ).toBe(false);
  });
});
