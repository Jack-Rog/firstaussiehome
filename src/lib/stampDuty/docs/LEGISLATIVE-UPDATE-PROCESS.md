# Legislative Update Process for Stamp Duty Rules

This process should be followed whenever a state or territory changes duty rates, concessions, or foreign surcharge settings.

## 1. Source Capture

1. Capture the primary source URL from the relevant state revenue office.
2. Record the source publication or effective date.
3. Save representative examples (if provided by the authority) for test fixtures.

## 2. Rule Versioning

1. In `src/lib/stampDuty/rules/current/<state>.json`, add a new rule with a new `id` and `effective_from`.
2. Set `effective_to` on superseded rules so date-based selection stays deterministic.
3. Keep historical rules in `src/lib/stampDuty/rules/history/` when they are no longer current.

## 3. Resolution Policy

1. If the full formula is known, encode it with `brackets`, `formula_piecewise`, `lookup_table`, or `flat_percent`.
2. If only partial detail is known, use `unresolved` or `informational_only` and provide:
   - `fallback_url`
   - `unresolved_reason`
   - `todo`
3. Never infer unpublished thresholds or rates.

## 4. Validation Gates

1. Run `npm run validate:stamp-duty-rules`.
2. Run `npm run test` and ensure stamp-duty fixture tests pass.
3. Run `npm run lint` and `npm run typecheck`.

## 5. Review Checklist

1. Effective dates and rule priority are correct.
2. Source URLs are official and reachable.
3. `appliedRules` and `explanations` remain deterministic.
4. Unresolved segments are clearly flagged.

## 6. Release Notes

For each duty rules update, include in changelog/release notes:

1. jurisdictions changed
2. old vs new effective dates
3. formulas/rates changed
4. unresolved areas still pending extraction
