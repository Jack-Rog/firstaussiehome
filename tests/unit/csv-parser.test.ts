import { describe, expect, it } from "vitest";
import { parseCsvText } from "@/src/server/parsers/csv-parser";

describe("parseCsvText", () => {
  it("parses header rows into record objects", () => {
    const rows = parseCsvText("date,description,amount\n2026-01-01,Salary,1000");

    expect(rows).toEqual([
      {
        date: "2026-01-01",
        description: "Salary",
        amount: "1000",
      },
    ]);
  });
});
