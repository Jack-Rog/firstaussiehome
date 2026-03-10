import { applyConcessions } from "@/src/lib/stampDuty/engine/applyConcessions";
import { matchesConditionGroup } from "@/src/lib/stampDuty/engine/conditions";
import {
  calculateBaseDutyFromRule,
  isDateInRange,
  roundToCents,
} from "@/src/lib/stampDuty/engine/ruleMath";
import { getRulesForJurisdiction } from "@/src/lib/stampDuty/rules";
import type {
  AppliedRule,
  BaseDutyRule,
  EngineInputState,
  Jurisdiction,
  StampDutyCalculationResult,
  StampDutyEvaluationContext,
  StampDutyInput,
  SurchargeRule,
} from "@/src/lib/stampDuty/types/stampDutyTypes";

const JURISDICTIONS: Jurisdiction[] = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

function normalizeJurisdiction(state: EngineInputState): Jurisdiction {
  const normalized = state.toUpperCase() as Jurisdiction;

  if (!JURISDICTIONS.includes(normalized)) {
    throw new Error(`Unsupported jurisdiction: ${state}`);
  }

  return normalized;
}

function normalizeContext(input: StampDutyInput, jurisdiction: Jurisdiction): StampDutyEvaluationContext {
  const propertyValue = Number(input.property_value);

  if (!Number.isFinite(propertyValue) || propertyValue < 0) {
    throw new Error(`Invalid property_value: ${input.property_value}`);
  }

  return {
    state: jurisdiction,
    transaction_date: input.transaction_date,
    property_value: propertyValue,
    property_type: input.property_type ?? "established_home",
    first_home_buyer: input.first_home_buyer ?? false,
    owner_occupier: input.owner_occupier ?? false,
    foreign_buyer: input.foreign_buyer ?? false,
    state_specific_inputs: input.state_specific_inputs ?? {},
  };
}

function sortByPriorityThenDate<T extends { priority?: number; effective_from: string }>(rules: T[]) {
  return [...rules].sort((left, right) => {
    const priorityDelta = (left.priority ?? 100) - (right.priority ?? 100);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const leftDate = new Date(left.effective_from).getTime();
    const rightDate = new Date(right.effective_from).getTime();
    return rightDate - leftDate;
  });
}

function selectBaseRule(
  baseRules: BaseDutyRule[],
  context: StampDutyEvaluationContext,
) {
  const matchingRules = sortByPriorityThenDate(
    baseRules.filter(
      (rule) =>
        isDateInRange(context.transaction_date, rule.effective_from, rule.effective_to) &&
        matchesConditionGroup(context, rule.applies_if),
    ),
  );

  if (matchingRules.length === 0) {
    throw new Error(
      `No active base duty rule matched ${context.state} at ${context.transaction_date}.`,
    );
  }

  return matchingRules[0];
}

function calculateSurchargeAmount(rule: SurchargeRule, baseDuty: number, propertyValue: number) {
  switch (rule.calculation_method) {
    case "percent_of_value":
      return propertyValue * ((rule.percent ?? 0) / 100);
    case "percent_of_base_duty":
      return baseDuty * ((rule.percent ?? 0) / 100);
    case "fixed_amount":
      return rule.fixed_amount ?? 0;
    case "unresolved":
      return 0;
    default:
      return 0;
  }
}

function resolveSourceUrls(sourceRefIds: string[], sourceMap: Map<string, string>, fallbackUrls: string[]) {
  const mappedSourceUrls = sourceRefIds
    .map((sourceRefId) => sourceMap.get(sourceRefId))
    .filter((url): url is string => typeof url === "string");

  return [...new Set([...mappedSourceUrls, ...fallbackUrls])];
}

export function calculateStampDuty(input: StampDutyInput): StampDutyCalculationResult {
  const state = normalizeJurisdiction(input.state);
  const context = normalizeContext(input, state);
  const ruleset = getRulesForJurisdiction(state);
  const sourceMap = new Map(ruleset.official_sources.map((source) => [source.id, source.url]));

  const baseRule = selectBaseRule(ruleset.base_duty_rules, context);
  const baseDuty = calculateBaseDutyFromRule(baseRule, context.property_value);
  const appliedRules: AppliedRule[] = [{ type: "base", id: baseRule.id }];
  const explanations: string[] = [];
  const sourceRefIds = new Set<string>(baseRule.source_refs ?? []);
  const fallbackUrls: string[] = [];
  let unresolved = false;

  if (baseRule.calculation_method === "official_calculator_fallback" || baseRule.calculation_method === "unresolved") {
    unresolved = true;
    explanations.push(`Base duty rule ${baseRule.id} is ${baseRule.calculation_method}.`);

    if (baseRule.fallback_url) {
      fallbackUrls.push(baseRule.fallback_url);
      explanations.push("Official fallback calculator is required for a verified result.");
    }

    if (baseRule.todo) {
      explanations.push(baseRule.todo);
    }
  }

  const matchedConcessions = sortByPriorityThenDate(
    ruleset.concessions.filter(
      (concession) =>
        isDateInRange(context.transaction_date, concession.effective_from, concession.effective_to) &&
        matchesConditionGroup(context, concession.eligibility),
    ),
  );

  const concessionResult = applyConcessions({
    propertyValue: context.property_value,
    baseDuty,
    concessions: matchedConcessions,
    calculateAlternateBaseRule: (baseRuleId) => {
      const alternateRule = ruleset.base_duty_rules.find((rule) => rule.id === baseRuleId);

      if (!alternateRule) {
        throw new Error(`Concession requested unknown alternate base rule ${baseRuleId}`);
      }

      return calculateBaseDutyFromRule(alternateRule, context.property_value);
    },
  });

  concessionResult.explanations.forEach((explanation) => explanations.push(explanation));
  concessionResult.sourceRefIds.forEach((sourceRef) => sourceRefIds.add(sourceRef));
  concessionResult.appliedRules.forEach((appliedRule) => {
    const concession = matchedConcessions.find((entry) => entry.id === appliedRule.id);
    appliedRules.push({
      ...appliedRule,
      name: concession?.name,
    });
  });

  if (concessionResult.unresolved) {
    unresolved = true;
  }

  const matchedSurcharges = (ruleset.surcharges ?? []).filter(
    (surcharge) =>
      isDateInRange(context.transaction_date, surcharge.effective_from, surcharge.effective_to) &&
      matchesConditionGroup(context, surcharge.eligibility),
  );

  const surchargeAmount = matchedSurcharges.reduce((total, surcharge) => {
    const amount = roundToCents(calculateSurchargeAmount(surcharge, baseDuty, context.property_value));

    appliedRules.push({
      type: "surcharge",
      id: surcharge.id,
      name: surcharge.name,
    });

    (surcharge.source_refs ?? []).forEach((sourceRef) => sourceRefIds.add(sourceRef));

    if (surcharge.calculation_method === "unresolved") {
      unresolved = true;
      explanations.push(`Surcharge ${surcharge.id} is unresolved and currently contributes 0.`);
      if (surcharge.fallback_url) {
        fallbackUrls.push(surcharge.fallback_url);
      }
    }

    return total + amount;
  }, 0);

  const finalDuty = roundToCents(Math.max(concessionResult.dutyAfterConcessions + surchargeAmount, 0));
  const sourceUrls = resolveSourceUrls([...sourceRefIds], sourceMap, fallbackUrls);

  return {
    state,
    transactionDate: context.transaction_date,
    baseDuty,
    finalDuty,
    concessionAmount: roundToCents(Math.max(baseDuty - concessionResult.dutyAfterConcessions, 0)),
    surchargeAmount: roundToCents(surchargeAmount),
    appliedRules,
    explanations,
    sourceUrls,
    unresolved,
  };
}
