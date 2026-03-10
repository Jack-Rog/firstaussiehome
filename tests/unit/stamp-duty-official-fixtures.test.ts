import { describe, expect, it } from "vitest";
import fixtures from "@/tests/fixtures/stamp-duty-official-fixtures.json";
import { calculateStampDuty } from "@/src/lib/stampDuty";

type Fixture = {
  id: string;
  description: string;
  source_url: string;
  input: Parameters<typeof calculateStampDuty>[0];
  expected: Partial<ReturnType<typeof calculateStampDuty>>;
};

describe("stamp-duty official fixtures", () => {
  for (const fixture of fixtures as Fixture[]) {
    it(`${fixture.id}: ${fixture.description}`, () => {
      const result = calculateStampDuty(fixture.input);

      for (const [key, expectedValue] of Object.entries(fixture.expected)) {
        const actualValue = result[key as keyof typeof result];
        expect(actualValue).toBe(expectedValue);
      }

      expect(result.sourceUrls.length).toBeGreaterThan(0);
    });
  }
});
