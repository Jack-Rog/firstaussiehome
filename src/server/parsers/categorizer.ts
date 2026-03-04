import type { BudgetCategoryKey, CsvImportResult, CsvImportRow, ImportedTransactionView } from "@/src/lib/types";

const CATEGORY_RULES: Array<{ match: RegExp; category: BudgetCategoryKey }> = [
  { match: /salary|payroll|wages|income/i, category: "income" },
  { match: /rent|real estate|property/i, category: "housing" },
  { match: /uber|opal|fuel|bp|shell|transport/i, category: "transport" },
  { match: /woolworths|coles|aldi|grocer/i, category: "groceries" },
  { match: /cafe|restaurant|uber eats|menulog/i, category: "dining" },
  { match: /energy|water|internet|phone|utility/i, category: "utilities" },
  { match: /spotify|netflix|subscription/i, category: "subscriptions" },
  { match: /chemist|doctor|health/i, category: "health" },
  { match: /course|uni|tuition|books/i, category: "education" },
  { match: /transfer|osko|savings/i, category: "transfers" },
];

function pickValue(row: CsvImportRow, aliases: string[]) {
  const normalizedKeys = Object.keys(row);
  const match = normalizedKeys.find((key) => aliases.includes(key));
  return match ? row[match] : "";
}

export function categorizeDescription(description: string): BudgetCategoryKey {
  const rule = CATEGORY_RULES.find((candidate) => candidate.match.test(description));
  return rule?.category ?? "uncategorized";
}

export function normalizeTransaction(row: CsvImportRow): ImportedTransactionView {
  const date = pickValue(row, ["date", "transaction date", "posted date"]);
  const description = pickValue(row, ["description", "details", "merchant"]);
  const amountText = pickValue(row, ["amount", "value", "debit", "credit"]);
  const rawCategory = pickValue(row, ["category", "type"]) || null;
  const amount = Number(amountText.replace(/[^0-9.-]/g, "")) || 0;
  const direction = amount < 0 ? "out" : "in";

  return {
    date: date || new Date().toISOString().slice(0, 10),
    description: description || "Imported transaction",
    amount: Math.abs(amount),
    direction,
    category: categorizeDescription(description || rawCategory || ""),
    rawCategory,
    notes: rawCategory ? `Source category: ${rawCategory}` : "Rules-based default category.",
  };
}

export function summarizeTransactions(rows: CsvImportRow[]): CsvImportResult {
  const normalized = rows.map(normalizeTransaction);
  const categories = {
    housing: 0,
    transport: 0,
    groceries: 0,
    dining: 0,
    utilities: 0,
    subscriptions: 0,
    health: 0,
    education: 0,
    income: 0,
    transfers: 0,
    uncategorized: 0,
  } satisfies Record<BudgetCategoryKey, number>;

  let income = 0;
  let outgoings = 0;

  normalized.forEach((transaction) => {
    categories[transaction.category] += transaction.amount;

    if (transaction.direction === "in") {
      income += transaction.amount;
      return;
    }

    outgoings += transaction.amount;
  });

  return {
    rows: normalized,
    totals: {
      income,
      outgoings,
      estimatedMonthlyCapacity: Math.round((income - outgoings) / 3 || 0),
    },
    categories,
    assumptions: [
      "Categorisation uses simple keyword rules in the MVP.",
      "Transfers and reimbursements may need manual review.",
    ],
    warnings: normalized.some((transaction) => transaction.category === "uncategorized")
      ? ["Some transactions remain uncategorized and may need review."]
      : [],
  };
}
