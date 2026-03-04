import { describe, expect, it } from "vitest";
import { summarizeTransactions } from "@/src/server/parsers/categorizer";

describe("summarizeTransactions", () => {
  it("normalizes and categorizes imported rows", () => {
    const summary = summarizeTransactions([
      { date: "2026-01-01", description: "Salary", amount: "4500" },
      { date: "2026-01-02", description: "Woolworths", amount: "-90" },
    ]);

    expect(summary.rows[0]?.category).toBe("income");
    expect(summary.rows[1]?.category).toBe("groceries");
    expect(summary.totals.income).toBe(4500);
    expect(summary.totals.outgoings).toBe(90);
  });
});
