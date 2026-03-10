import type {
  DutyIntakeState,
  DutyTier2FieldId,
  HomeownerPathwayInput,
} from "@/src/lib/types";

const ADVANCED_FIELD_IDS: DutyTier2FieldId[] = [
  "buyerEntityType",
  "jointEligibilityAligned",
  "foreignOwnershipMode",
  "waRegion",
  "qldConcessionPath",
  "saReliefPath",
  "dependentChildrenCount",
  "ntHouseAndLandEligiblePath",
];

function uniqueFieldIds(fieldIds: DutyTier2FieldId[]) {
  return [...new Set(fieldIds)];
}

function isComplexPropertyType(propertyType: HomeownerPathwayInput["propertyTypeDetailed"]) {
  return (
    propertyType === "vacant-land" ||
    propertyType === "off-the-plan-home" ||
    propertyType === "house-and-land-package"
  );
}

function isSupportedTier2StatePath(input: HomeownerPathwayInput) {
  const state = input.homeState ?? "nsw";
  const propertyType = input.propertyTypeDetailed ?? "established-home";

  if (propertyType === "off-the-plan-home") {
    return false;
  }

  if (propertyType === "house-and-land-package") {
    return state === "wa" || state === "qld" || state === "sa" || state === "nt";
  }

  if (propertyType === "vacant-land") {
    return state === "wa" || state === "qld" || state === "sa";
  }

  return true;
}

function hasTier2Value(input: HomeownerPathwayInput, fieldId: DutyTier2FieldId) {
  const value = input[fieldId];

  if (typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0;
  }

  return typeof value === "string" && value.length > 0;
}

export function getSavedDutyTier2FieldIds(input: Partial<HomeownerPathwayInput>) {
  return ADVANCED_FIELD_IDS.filter((fieldId) => hasTier2Value(input as HomeownerPathwayInput, fieldId));
}

export function deriveDutyIntakeState(input: Partial<HomeownerPathwayInput>): DutyIntakeState {
  const normalizedInput = input as HomeownerPathwayInput;
  const state = normalizedInput.homeState ?? "nsw";
  const propertyType = normalizedInput.propertyTypeDetailed ?? "established-home";
  const visibleTier2Fields: DutyTier2FieldId[] = [];

  const stateNeedsTier2 = state === "wa" || state === "qld" || state === "sa" || state === "act" || state === "nt";
  const structureNeedsTier2 = normalizedInput.buyingSoloOrJoint === "joint";
  const foreignNeedsTier2 = normalizedInput.foreignBuyer === true;
  const propertyNeedsTier2 = isComplexPropertyType(propertyType);

  const needsTier2 = stateNeedsTier2 || structureNeedsTier2 || foreignNeedsTier2 || propertyNeedsTier2;

  if (needsTier2) {
    visibleTier2Fields.push("buyerEntityType");
  }

  if (normalizedInput.buyingSoloOrJoint === "joint") {
    visibleTier2Fields.push("jointEligibilityAligned");
  }

  if (normalizedInput.foreignBuyer) {
    visibleTier2Fields.push("foreignOwnershipMode");
  }

  if (state === "wa") {
    visibleTier2Fields.push("waRegion");
  }

  if (state === "qld") {
    visibleTier2Fields.push("qldConcessionPath");
  }

  if (state === "sa") {
    visibleTier2Fields.push("saReliefPath");
  }

  if (state === "act") {
    visibleTier2Fields.push("dependentChildrenCount");
  }

  if (state === "nt") {
    visibleTier2Fields.push("ntHouseAndLandEligiblePath");
  }

  const requiredTier2Fields = uniqueFieldIds(visibleTier2Fields);
  const tier2Complete =
    !needsTier2 || requiredTier2Fields.every((fieldId) => hasTier2Value(normalizedInput, fieldId));

  const hasUnsupportedStatePath = needsTier2 && !isSupportedTier2StatePath(normalizedInput);
  const hasTier3EdgeCase =
    normalizedInput.buyerEntityType !== undefined && normalizedInput.buyerEntityType !== "individuals"
      ? true
      : normalizedInput.jointEligibilityAligned === false
        ? true
        : normalizedInput.foreignOwnershipMode === "partial"
          ? true
          : propertyType === "off-the-plan-home"
            ? true
            : hasUnsupportedStatePath;

  const reasons: string[] = [];

  if (needsTier2 && !tier2Complete) {
    reasons.push("Advanced duty questions are still incomplete, so duty outputs stay on broad assumptions.");
  }

  if (normalizedInput.buyerEntityType !== undefined && normalizedInput.buyerEntityType !== "individuals") {
    reasons.push("Broad assumption used because the buyer structure is not all individuals.");
  }

  if (normalizedInput.jointEligibilityAligned === false) {
    reasons.push("Broad assumption used because joint buyers do not share the same duty eligibility profile.");
  }

  if (normalizedInput.foreignOwnershipMode === "partial") {
    reasons.push("Broad assumption used because foreign ownership is only partial.");
  }

  if (propertyType === "off-the-plan-home") {
    reasons.push("Broad assumption used because off-the-plan duty treatment stays in the Tier 3 edge-case bucket.");
  }

  if (hasUnsupportedStatePath) {
    reasons.push("Broad assumption used because this state and property path is outside the supported Tier 2 set.");
  }

  return {
    needsTier2,
    visibleTier2Fields: requiredTier2Fields,
    tier2Complete,
    hasTier3EdgeCase,
    uncertaintyActive: (needsTier2 && !tier2Complete) || hasTier3EdgeCase,
    reasons,
  };
}
