export type Jurisdiction = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';

export type PropertyType =
  | 'established_home'
  | 'new_home'
  | 'vacant_land'
  | 'off_the_plan_apartment'
  | 'house_and_land_package'
  | 'other';

export type InputType = 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'enum' | 'array';

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
  | 'eq'
  | 'neq'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'in'
  | 'not_in'
  | 'between'
  | 'date_gte'
  | 'date_lte'
  | 'exists'
  | 'contains';

export interface Condition {
  field: string;
  op: ConditionOp;
  value?: unknown;
  min?: number | string;
  max?: number | string;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Array<Condition | ConditionGroup>;
}

export type BaseFormulaType = 'marginal' | 'flat_rate_on_total' | 'fixed_plus_marginal';

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
  | 'brackets'
  | 'flat_percent'
  | 'formula_piecewise'
  | 'lookup_table'
  | 'official_calculator_fallback';

export interface BaseDutyRule {
  id: string;
  effective_from: string;
  effective_to?: string | null;
  applies_if?: ConditionGroup;
  calculation_method: BaseCalculationMethod;
  rounding?: 'none' | 'ceil_to_dollar' | 'ceil_each_$100_part' | 'jurisdiction_specific';
  brackets?: Bracket[];
  formula_segments?: FormulaSegment[];
  lookup_table?: LookupPoint[];
  fallback_url?: string;
  source_refs?: string[];
}

export type EffectFormulaType =
  | 'zero'
  | 'fixed_plus_marginal'
  | 'flat_rate_on_total'
  | 'subtract_fixed_amount'
  | 'lookup_table'
  | 'informational_only';

export interface EffectBracket {
  min_value: number;
  max_value: number | null;
  effect_formula_type: EffectFormulaType;
  fixed_amount?: number | null;
  rate_per_100?: number | null;
  percent_of_total?: number | null;
  marginal_base_value?: number | null;
  subtract_amount?: number | null;
  lookup_table?: LookupPoint[];
}

export type ConcessionEffectType =
  | 'set_duty_to_zero'
  | 'replace_with_alternate_base_rule'
  | 'subtract_fixed_amount'
  | 'replace_with_piecewise_formula'
  | 'apply_percent_discount'
  | 'informational_only';

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

export type SurchargeCalculationMethod = 'percent_of_value' | 'percent_of_base_duty' | 'fixed_amount';

export interface SurchargeRule {
  id: string;
  name: string;
  effective_from: string;
  effective_to?: string | null;
  eligibility: ConditionGroup;
  calculation_method: SurchargeCalculationMethod;
  percent?: number | null;
  fixed_amount?: number | null;
  source_refs?: string[];
}

export interface JurisdictionRuleSet {
  jurisdiction: Jurisdiction;
  currency: 'AUD';
  inputs: InputDefinition[];
  base_duty_rules: BaseDutyRule[];
  concessions: ConcessionRule[];
  surcharges?: SurchargeRule[];
  official_sources: SourceRef[];
  notes?: string[];
}

export interface StampDutyRuleset {
  schema_version: string;
  generated_at: string;
  jurisdictions: JurisdictionRuleSet[];
}

export interface StampDutyRequest {
  jurisdiction: Jurisdiction;
  contract_date: string;
  dutiable_value: number;
  property_type?: PropertyType;
  is_first_home_buyer?: boolean;
  is_owner_occupier?: boolean;
  is_principal_place_of_residence?: boolean;
  is_foreign_person?: boolean;
  household_income?: number;
  dependants?: number;
  [key: string]: unknown;
}

export interface StampDutyResponse {
  base_rule_id: string;
  base_duty: number;
  matched_concession_ids: string[];
  matched_surcharge_ids: string[];
  final_duty: number;
  explanations: string[];
  source_urls: string[];
}
