import {
  calculateDutyFromEffectBracket,
  matchEffectBracket,
  roundToCents,
} from "@/src/lib/stampDuty/engine/ruleMath";
import type {
  ConcessionApplicationResult,
  ConcessionRule,
} from "@/src/lib/stampDuty/types/stampDutyTypes";

type ApplyConcessionsInput = {
  propertyValue: number;
  baseDuty: number;
  concessions: ConcessionRule[];
  calculateAlternateBaseRule: (baseRuleId: string) => number;
};

function sortByPriority(concessions: ConcessionRule[]) {
  return [...concessions].sort((left, right) => (left.priority ?? 100) - (right.priority ?? 100));
}

export function applyConcessions(input: ApplyConcessionsInput): ConcessionApplicationResult {
  let dutyAfterConcessions = input.baseDuty;
  const matchedConcessionIds: string[] = [];
  const explanations: string[] = [];
  const sourceRefIds = new Set<string>();
  let unresolved = false;

  for (const concession of sortByPriority(input.concessions)) {
    matchedConcessionIds.push(concession.id);
    (concession.source_refs ?? []).forEach((sourceRef) => sourceRefIds.add(sourceRef));

    switch (concession.effect_type) {
      case "set_duty_to_zero": {
        dutyAfterConcessions = 0;
        explanations.push(`${concession.name} set duty to zero.`);
        break;
      }
      case "replace_with_alternate_base_rule": {
        if (!concession.alternate_base_rule_id) {
          unresolved = true;
          explanations.push(`${concession.name} is missing alternate_base_rule_id.`);
          break;
        }

        dutyAfterConcessions = input.calculateAlternateBaseRule(concession.alternate_base_rule_id);
        explanations.push(`${concession.name} replaced duty with alternate base rule ${concession.alternate_base_rule_id}.`);
        break;
      }
      case "subtract_fixed_amount": {
        dutyAfterConcessions = Math.max(dutyAfterConcessions - (concession.fixed_reduction_amount ?? 0), 0);
        explanations.push(`${concession.name} reduced duty by a fixed amount.`);
        break;
      }
      case "replace_with_piecewise_formula": {
        const matchedBracket = matchEffectBracket(input.propertyValue, concession.piecewise_effect_brackets ?? []);

        if (!matchedBracket) {
          unresolved = true;
          explanations.push(`${concession.name} has no matching piecewise bracket for the property value.`);
          break;
        }

        dutyAfterConcessions = calculateDutyFromEffectBracket(
          input.propertyValue,
          dutyAfterConcessions,
          matchedBracket,
        );

        if (matchedBracket.effect_formula_type === "informational_only") {
          explanations.push(`${concession.name} matched an informational segment. Base duty was retained.`);
        } else {
          explanations.push(`${concession.name} replaced duty using a piecewise concession segment.`);
        }
        break;
      }
      case "apply_percent_discount": {
        const discount = (concession.discount_percent ?? 0) / 100;
        dutyAfterConcessions = Math.max(dutyAfterConcessions * (1 - discount), 0);
        explanations.push(`${concession.name} applied a percentage discount.`);
        break;
      }
      case "informational_only": {
        explanations.push(`${concession.name} matched, but is informational only.`);
        break;
      }
      default:
        unresolved = true;
        explanations.push(`${concession.name} has an unsupported concession effect.`);
        break;
    }

    dutyAfterConcessions = roundToCents(dutyAfterConcessions);
  }

  return {
    dutyAfterConcessions,
    matchedConcessionIds,
    appliedRules: matchedConcessionIds.map((id) => ({
      type: "concession" as const,
      id,
    })),
    explanations,
    sourceRefIds: [...sourceRefIds],
    unresolved,
  };
}
