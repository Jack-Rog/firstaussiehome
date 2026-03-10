import { calculateStampDuty } from "@/src/lib/stampDuty/engine/calculateStampDuty";

export const STAMP_DUTY_MODEL_DATE = "2026-03-10";

export function calculateIndicativeNswTransferDuty(
  propertyValue: number,
  transactionDate = STAMP_DUTY_MODEL_DATE,
) {
  return calculateStampDuty({
    state: "NSW",
    property_value: propertyValue,
    property_type: "established_home",
    first_home_buyer: false,
    owner_occupier: false,
    transaction_date: transactionDate,
    foreign_buyer: false,
  }).finalDuty;
}

export function calculateIndicativeNswFirstHomeDuty(
  propertyValue: number,
  transactionDate = STAMP_DUTY_MODEL_DATE,
) {
  return calculateStampDuty({
    state: "NSW",
    property_value: propertyValue,
    property_type: "established_home",
    first_home_buyer: true,
    owner_occupier: true,
    transaction_date: transactionDate,
    foreign_buyer: false,
  }).finalDuty;
}

export { calculateStampDuty };

export type {
  AppliedRule,
  Jurisdiction,
  PropertyType,
  StampDutyCalculationResult,
  StampDutyInput,
} from "@/src/lib/stampDuty/types/stampDutyTypes";
