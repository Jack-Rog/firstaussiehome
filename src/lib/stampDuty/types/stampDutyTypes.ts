export type Jurisdiction = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

export type EngineInputState = Jurisdiction | Lowercase<Jurisdiction>;

export type PropertyType =
  | "established_home"
  | "new_home"
  | "vacant_land"
  | "off_the_plan_apartment"
  | "house_and_land_package"
  | "other";

export type InputType = "string" | "number" | "integer" | "boolean" | "date" | "enum" | "array";

export interface InputDefinition {
  key: string;
  type: InputType;
  required?: boolean;
  enum_values?: string[];
  description?: string;
}

export interface SourceRef {
  id: string;
  label: string;
  url: string;
  last_verified?: string;
  notes?: string;
}

export type ConditionOp =
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "not_in"
  | "between"
  | "date_gte"
  | "date_lte"
  | "exists"
  | "contains";

export interface Condition {
  field: string;
  op: ConditionOp;
  value?: unknown;
  min?: number | string;
  max?: number | string;
}

export interface ConditionGroup {
  operator: "AND" | "OR";
  conditions: Array<Condition | ConditionGroup>;
}

export type BaseFormulaType = "marginal" | "flat_rate_on_total" | "fixed_plus_marginal";

export interface Bracket {
  min_value: number;
  max_value: number | null;
  formula_type: BaseFormulaType;
  fixed_amount?: number;
  rate_per_100?: number | null;
  percent_of_total?: number | null;
  marginal_base_value?: number | null;
}

export interface FormulaSegment {
  min_value: number;
  max_value: number | null;
  expression: string;
  variables?: string[];
}

export interface LookupPoint {
  value: number;
  duty: number;
}

export type BaseCalculationMethod =
  | "brackets"
  | "flat_percent"
  | "formula_piecewise"
  | "lookup_table"
  | "official_calculator_fallback"
  | "unresolved";

export interface BaseDutyRule {
  id: string;
  effective_from: string;
  effective_to?: string | null;
  priority?: number;
  applies_if?: ConditionGroup;
  calculation_method: BaseCalculationMethod;
  rounding?:
    | "none"
    | "ceil_to_dollar"
    | "ceil_each_$100_part"
    | "jurisdiction_specific"
    | "floor_to_5_cents";
  brackets?: Bracket[];
  flat_percent?: number;
  formula_segments?: FormulaSegment[];
  lookup_table?: LookupPoint[];
  fallback_url?: string;
  source_refs?: string[];
  unresolved_reason?: string;
  todo?: string;
}

export type EffectFormulaType =
  | "zero"
  | "fixed_plus_marginal"
  | "flat_rate_on_total"
  | "subtract_fixed_amount"
  | "lookup_table"
  | "formula_expression"
  | "informational_only";

export interface EffectBracket {
  min_value: number;
  max_value: number | null;
  effect_formula_type: EffectFormulaType;
  fixed_amount?: number | null;
  rate_per_100?: number | null;
  percent_of_total?: number | null;
  marginal_base_value?: number | null;
  subtract_amount?: number | null;
  expression?: string;
  lookup_table?: LookupPoint[];
}

export type ConcessionEffectType =
  | "set_duty_to_zero"
  | "replace_with_alternate_base_rule"
  | "subtract_fixed_amount"
  | "replace_with_piecewise_formula"
  | "apply_percent_discount"
  | "informational_only";

export interface ConcessionRule {
  id: string;
  name: string;
  effective_from: string;
  effective_to?: string | null;
  eligibility: ConditionGroup;
  effect_type: ConcessionEffectType;
  priority?: number;
  alternate_base_rule_id?: string | null;
  piecewise_effect_brackets?: EffectBracket[];
  discount_percent?: number | null;
  fixed_reduction_amount?: number | null;
  source_refs?: string[];
  notes?: string[];
}

export type SurchargeCalculationMethod =
  | "percent_of_value"
  | "percent_of_base_duty"
  | "fixed_amount"
  | "unresolved";

export interface SurchargeRule {
  id: string;
  name: string;
  effective_from: string;
  effective_to?: string | null;
  eligibility: ConditionGroup;
  calculation_method: SurchargeCalculationMethod;
  percent?: number | null;
  fixed_amount?: number | null;
  fallback_url?: string;
  source_refs?: string[];
  notes?: string[];
}

export interface JurisdictionRuleSet {
  jurisdiction: Jurisdiction;
  ruleset_version: string;
  currency: "AUD";
  inputs: InputDefinition[];
  base_duty_rules: BaseDutyRule[];
  concessions: ConcessionRule[];
  surcharges?: SurchargeRule[];
  official_sources: SourceRef[];
  notes?: string[];
}

export interface StampDutyInput {
  state: EngineInputState;
  property_value: number;
  property_type?: PropertyType;
  first_home_buyer?: boolean;
  owner_occupier?: boolean;
  transaction_date: string;
  foreign_buyer?: boolean;
  state_specific_inputs?: Record<string, unknown>;
}

export interface AppliedRule {
  type: "base" | "concession" | "surcharge";
  id: string;
  name?: string;
}

export interface StampDutyCalculationResult {
  state: Jurisdiction;
  transactionDate: string;
  baseDuty: number;
  finalDuty: number;
  concessionAmount: number;
  surchargeAmount: number;
  appliedRules: AppliedRule[];
  explanations: string[];
  sourceUrls: string[];
  unresolved: boolean;
}

export interface StampDutyEvaluationContext {
  state: Jurisdiction;
  transaction_date: string;
  property_value: number;
  property_type: PropertyType;
  first_home_buyer: boolean;
  owner_occupier: boolean;
  foreign_buyer: boolean;
  state_specific_inputs: Record<string, unknown>;
}

export interface ConcessionApplicationResult {
  dutyAfterConcessions: number;
  matchedConcessionIds: string[];
  appliedRules: AppliedRule[];
  explanations: string[];
  sourceRefIds: string[];
  unresolved: boolean;
}
