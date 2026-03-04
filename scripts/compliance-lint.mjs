import { promises as fs } from "node:fs";
import path from "node:path";

const bannedPhrases = [
  "you should",
  "we recommend",
  "choose this",
  "choose that",
  "buy this",
  "buy that",
  "switch now",
  "open account",
  "invest in",
  "best lender",
  "best mortgage",
  "apply with",
  "this fund",
];

const scanRoots = ["app", "components", "content", "src/server/services"];
const allowedFiles = new Set([
  path.join("src", "lib", "compliance.ts"),
  path.join("docs", "COMPLIANCE.md"),
]);

async function walk(target) {
  const entries = await fs.readdir(target, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(target, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      }
      return [fullPath];
    }),
  );
  return files.flat();
}

const hits = [];

for (const root of scanRoots) {
  const fullRoot = path.join(process.cwd(), root);
  const files = await walk(fullRoot);

  for (const file of files) {
    if (!/\.(ts|tsx|mdx)$/.test(file)) {
      continue;
    }

    const relative = path.relative(process.cwd(), file);
    if (allowedFiles.has(relative)) {
      continue;
    }

    const source = (await fs.readFile(file, "utf8")).toLowerCase();
    for (const phrase of bannedPhrases) {
      if (source.includes(phrase)) {
        hits.push(`${relative}: ${phrase}`);
      }
    }
  }
}

const virtualOutputs = [
  "Scenario range: this report compares multiple pathways and assumptions.",
  "Missing information checklist: verify current scheme rules and supporting documents.",
  "Questions to clarify with a licensed professional: which assumptions change if circumstances become more complex?",
];

for (const output of virtualOutputs) {
  for (const phrase of bannedPhrases) {
    if (output.toLowerCase().includes(phrase)) {
      hits.push(`virtual-output: ${phrase}`);
    }
  }
}

if (hits.length > 0) {
  console.error("Compliance scan failed:");
  for (const hit of hits) {
    console.error(`- ${hit}`);
  }
  process.exit(1);
}

console.log("Compliance scan passed.");
