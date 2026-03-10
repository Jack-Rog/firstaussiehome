import type {
  BaseDutyRule,
  Bracket,
  EffectBracket,
  FormulaSegment,
  LookupPoint,
} from "@/src/lib/stampDuty/types/stampDutyTypes";

function isWithinRange(value: number, min: number, max: number | null) {
  if (value < min) {
    return false;
  }
  if (max === null) {
    return true;
  }
  return value <= max;
}

function calculateBracketDuty(value: number, bracket: Bracket) {
  switch (bracket.formula_type) {
    case "flat_rate_on_total":
      return value * (bracket.percent_of_total ?? 0);
    case "fixed_plus_marginal": {
      const marginalBase = bracket.marginal_base_value ?? bracket.min_value;
      return (bracket.fixed_amount ?? 0) + ((value - marginalBase) / 100) * (bracket.rate_per_100 ?? 0);
    }
    case "marginal": {
      const marginalBase = bracket.marginal_base_value ?? bracket.min_value;
      return ((value - marginalBase) / 100) * (bracket.rate_per_100 ?? 0);
    }
    default:
      return 0;
  }
}

export function roundToCents(value: number) {
  return Number(value.toFixed(2));
}

export function applyRounding(value: number, rounding: BaseDutyRule["rounding"]) {
  if (!rounding || rounding === "none") {
    return roundToCents(value);
  }

  if (rounding === "ceil_to_dollar") {
    return Math.ceil(value);
  }

  if (rounding === "ceil_each_$100_part") {
    return Math.ceil(value / 100) * 100;
  }

  if (rounding === "floor_to_5_cents") {
    return Math.floor((value + Number.EPSILON) * 20) / 20;
  }

  return roundToCents(value);
}

export function calculateDutyFromBrackets(value: number, brackets: Bracket[]) {
  const bracket = [...brackets]
    .sort((left, right) => left.min_value - right.min_value)
    .find((entry) => isWithinRange(value, entry.min_value, entry.max_value));

  if (!bracket) {
    throw new Error(`No bracket found for value ${value}`);
  }

  return calculateBracketDuty(value, bracket);
}

function evaluateFormulaExpression(value: number, segment: FormulaSegment) {
  const fn = new Function("value", "Math", `return ${segment.expression};`) as (value: number, math: Math) => number;
  return fn(value, Math);
}

function evaluateConcessionExpression(value: number, currentDuty: number, expression?: string) {
  if (!expression) {
    return currentDuty;
  }

  const fn = new Function(
    "value",
    "currentDuty",
    "Math",
    `return ${expression};`,
  ) as (value: number, currentDuty: number, math: Math) => number;
  return fn(value, currentDuty, Math);
}

export function calculateDutyFromFormulaSegments(value: number, segments: FormulaSegment[]) {
  const segment = [...segments]
    .sort((left, right) => left.min_value - right.min_value)
    .find((entry) => isWithinRange(value, entry.min_value, entry.max_value));

  if (!segment) {
    throw new Error(`No formula segment found for value ${value}`);
  }

  return evaluateFormulaExpression(value, segment);
}

export function calculateDutyFromLookupTable(value: number, lookupTable: LookupPoint[]) {
  const sorted = [...lookupTable].sort((left, right) => left.value - right.value);

  const exactMatch = sorted.find((entry) => entry.value === value);
  if (exactMatch) {
    return exactMatch.duty;
  }

  const belowOrEqual = sorted.filter((entry) => entry.value <= value);
  if (belowOrEqual.length === 0) {
    return sorted[0]?.duty ?? 0;
  }

  return belowOrEqual[belowOrEqual.length - 1]?.duty ?? 0;
}

export function calculateDutyFromEffectBracket(
  value: number,
  currentDuty: number,
  bracket: EffectBracket,
) {
  switch (bracket.effect_formula_type) {
    case "zero":
      return 0;
    case "fixed_plus_marginal": {
      const marginalBase = bracket.marginal_base_value ?? bracket.min_value;
      return (bracket.fixed_amount ?? 0) + ((value - marginalBase) / 100) * (bracket.rate_per_100 ?? 0);
    }
    case "flat_rate_on_total":
      return value * (bracket.percent_of_total ?? 0);
    case "subtract_fixed_amount":
      return Math.max(currentDuty - (bracket.subtract_amount ?? 0), 0);
    case "lookup_table":
      return calculateDutyFromLookupTable(value, bracket.lookup_table ?? []);
    case "formula_expression":
      return evaluateConcessionExpression(value, currentDuty, bracket.expression);
    case "informational_only":
      return currentDuty;
    default:
      return currentDuty;
  }
}

export function calculateBaseDutyFromRule(rule: BaseDutyRule, propertyValue: number) {
  if (propertyValue <= 0) {
    return 0;
  }

  let rawDuty = 0;

  switch (rule.calculation_method) {
    case "brackets":
      rawDuty = calculateDutyFromBrackets(propertyValue, rule.brackets ?? []);
      break;
    case "flat_percent":
      rawDuty = propertyValue * (rule.flat_percent ?? 0);
      break;
    case "formula_piecewise":
      rawDuty = calculateDutyFromFormulaSegments(propertyValue, rule.formula_segments ?? []);
      break;
    case "lookup_table":
      rawDuty = calculateDutyFromLookupTable(propertyValue, rule.lookup_table ?? []);
      break;
    case "official_calculator_fallback":
    case "unresolved":
      rawDuty = 0;
      break;
    default:
      rawDuty = 0;
      break;
  }

  return applyRounding(rawDuty, rule.rounding);
}

export function isDateInRange(targetDate: string, from: string, to?: string | null) {
  const target = new Date(targetDate).getTime();
  const start = new Date(from).getTime();

  if (Number.isNaN(target) || Number.isNaN(start)) {
    return false;
  }

  if (target < start) {
    return false;
  }

  if (!to) {
    return true;
  }

  const end = new Date(to).getTime();
  if (Number.isNaN(end)) {
    return false;
  }

  return target <= end;
}

export function matchEffectBracket(value: number, brackets: EffectBracket[]) {
  return [...brackets]
    .sort((left, right) => left.min_value - right.min_value)
    .find((entry) => isWithinRange(value, entry.min_value, entry.max_value));
}
