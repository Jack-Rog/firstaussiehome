import type { Condition, ConditionGroup, StampDutyEvaluationContext } from "@/src/lib/stampDuty/types/stampDutyTypes";

function isConditionGroup(value: Condition | ConditionGroup): value is ConditionGroup {
  return (value as ConditionGroup).operator !== undefined;
}

function getFieldValue(context: StampDutyEvaluationContext, field: string): unknown {
  const segments = field.split(".");
  let current: unknown = context;

  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function compareDate(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function matchesCondition(context: StampDutyEvaluationContext, condition: Condition) {
  const fieldValue = getFieldValue(context, condition.field);

  switch (condition.op) {
    case "eq":
      return fieldValue === condition.value;
    case "neq":
      return fieldValue !== condition.value;
    case "lt":
      return Number(fieldValue) < Number(condition.value);
    case "lte":
      return Number(fieldValue) <= Number(condition.value);
    case "gt":
      return Number(fieldValue) > Number(condition.value);
    case "gte":
      return Number(fieldValue) >= Number(condition.value);
    case "in":
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case "not_in":
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
    case "between": {
      const numericValue = Number(fieldValue);
      const min = Number(condition.min);
      const max = Number(condition.max);
      return Number.isFinite(numericValue) && numericValue >= min && numericValue <= max;
    }
    case "date_gte": {
      if (typeof fieldValue !== "string" || typeof condition.value !== "string") {
        return false;
      }
      return compareDate(fieldValue, condition.value) >= 0;
    }
    case "date_lte": {
      if (typeof fieldValue !== "string" || typeof condition.value !== "string") {
        return false;
      }
      return compareDate(fieldValue, condition.value) <= 0;
    }
    case "exists":
      return condition.value === true ? fieldValue !== undefined : fieldValue === undefined;
    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      if (typeof fieldValue === "string" && typeof condition.value === "string") {
        return fieldValue.includes(condition.value);
      }
      return false;
    default:
      return false;
  }
}

export function matchesConditionGroup(context: StampDutyEvaluationContext, group?: ConditionGroup) {
  if (!group) {
    return true;
  }

  const evaluator = (entry: Condition | ConditionGroup) => {
    if (isConditionGroup(entry)) {
      return matchesConditionGroup(context, entry);
    }
    return matchesCondition(context, entry);
  };

  if (group.operator === "AND") {
    return group.conditions.every(evaluator);
  }

  return group.conditions.some(evaluator);
}
