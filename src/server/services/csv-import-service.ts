import type { CsvImportResult } from "@/src/lib/types";
import { parseCsvText } from "@/src/server/parsers/csv-parser";
import { summarizeTransactions } from "@/src/server/parsers/categorizer";

export function importTransactions(csvText: string): CsvImportResult {
  const rows = parseCsvText(csvText);
  return summarizeTransactions(rows);
}
