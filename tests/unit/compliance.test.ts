import { describe, expect, it } from "vitest";
import { assertCompliantCopy, findBannedPhrases } from "@/src/lib/compliance";

describe("compliance", () => {
  it("detects banned phrases", () => {
    expect(findBannedPhrases("We recommend this path.")).toContain("we recommend");
  });

  it("throws on non-compliant copy", () => {
    expect(() => assertCompliantCopy("You should open account X.")).toThrow();
  });
});
