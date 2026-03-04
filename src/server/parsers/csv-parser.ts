import type { CsvImportRow } from "@/src/lib/types";

function splitLine(line: string) {
  const output: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const character of line) {
    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      output.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  output.push(current.trim());
  return output;
}

export function parseCsvText(text: string): CsvImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitLine(lines[0]).map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitLine(line);
    return headers.reduce<CsvImportRow>((row, header, index) => {
      row[header] = cells[index] ?? "";
      return row;
    }, {});
  });
}
