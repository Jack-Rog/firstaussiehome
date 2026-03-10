import type { Jurisdiction, JurisdictionRuleSet } from "@/src/lib/stampDuty/types/stampDutyTypes";
import act from "@/src/lib/stampDuty/rules/current/act.json";
import nsw from "@/src/lib/stampDuty/rules/current/nsw.json";
import nt from "@/src/lib/stampDuty/rules/current/nt.json";
import qld from "@/src/lib/stampDuty/rules/current/qld.json";
import sa from "@/src/lib/stampDuty/rules/current/sa.json";
import tas from "@/src/lib/stampDuty/rules/current/tas.json";
import vic from "@/src/lib/stampDuty/rules/current/vic.json";
import wa from "@/src/lib/stampDuty/rules/current/wa.json";
import nswLegacy from "@/src/lib/stampDuty/rules/history/nsw.legacy.json";

const ALL_RULESETS: JurisdictionRuleSet[] = [
  nsw as JurisdictionRuleSet,
  vic as JurisdictionRuleSet,
  qld as JurisdictionRuleSet,
  wa as JurisdictionRuleSet,
  sa as JurisdictionRuleSet,
  tas as JurisdictionRuleSet,
  act as JurisdictionRuleSet,
  nt as JurisdictionRuleSet,
  nswLegacy as JurisdictionRuleSet,
];

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function dedupeByKey<T extends { key: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.key)) {
      return false;
    }
    seen.add(item.key);
    return true;
  });
}

export function listAllRulesets() {
  return ALL_RULESETS;
}

export function getRulesForJurisdiction(jurisdiction: Jurisdiction): JurisdictionRuleSet {
  const matchingRulesets = ALL_RULESETS.filter((ruleset) => ruleset.jurisdiction === jurisdiction);

  if (matchingRulesets.length === 0) {
    throw new Error(`No stamp duty ruleset found for ${jurisdiction}`);
  }

  return {
    jurisdiction,
    ruleset_version: matchingRulesets.map((ruleset) => ruleset.ruleset_version).join(" + "),
    currency: "AUD",
    inputs: dedupeByKey(matchingRulesets.flatMap((ruleset) => ruleset.inputs)),
    base_duty_rules: matchingRulesets.flatMap((ruleset) => ruleset.base_duty_rules),
    concessions: matchingRulesets.flatMap((ruleset) => ruleset.concessions),
    surcharges: matchingRulesets.flatMap((ruleset) => ruleset.surcharges ?? []),
    official_sources: dedupeById(matchingRulesets.flatMap((ruleset) => ruleset.official_sources)),
    notes: matchingRulesets.flatMap((ruleset) => ruleset.notes ?? []),
  };
}
