const BANNED_PHRASE_DEFINITIONS = [
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
] as const;

export const COMPLIANCE_BANNER_TEXT =
  "General information and modelling only - not financial advice.";

export const TOOL_DISCLAIMER_TEXT =
  "This tool provides general information and scenario modelling. It uses simple assumptions, does not assess full personal circumstances, and may miss details that matter in practice.";

export const GET_HELP_SAFELY_LINK = "/safety";

export const BANNED_PHRASES = [...BANNED_PHRASE_DEFINITIONS];

export function findBannedPhrases(text: string) {
  const normalized = text.toLowerCase();

  return BANNED_PHRASE_DEFINITIONS.filter((phrase) => normalized.includes(phrase));
}

export function assertCompliantCopy(text: string) {
  const hits = findBannedPhrases(text);

  if (hits.length > 0) {
    throw new Error(`Non-compliant copy detected: ${hits.join(", ")}`);
  }
}

export function buildToolDisclaimer(extraAssumptions: string[]) {
  const assumptions = ["General information only.", ...extraAssumptions];
  const text = `${TOOL_DISCLAIMER_TEXT} Assumptions: ${assumptions.join(" ")}`;
  assertCompliantCopy(text);
  return text;
}

export function getScannableFixtureCopy() {
  const fixtures = [
    "Scenario range: Deposit timeline can change if income, rent, or savings patterns move over time.",
    "Missing information checklist: confirm updated scheme rules, fees, and documentation with official sources.",
    "Questions to clarify with a licensed professional: what assumptions matter if circumstances become more complex?",
  ];

  fixtures.forEach(assertCompliantCopy);
  return fixtures;
}
