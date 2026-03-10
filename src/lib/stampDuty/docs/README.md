# Stamp Duty Rules Engine

This module moves stamp duty logic out of inline calculators into versioned state rules.

## Structure

- `types/stampDutyTypes.ts`: typed contract for jurisdiction rules, concessions, surcharges, and engine IO.
- `schema/stampDutyRules.schema.json`: JSON schema for one jurisdiction ruleset file.
- `rules/current/*.json`: current rules per state/territory.
- `rules/history/*.json`: historical rules kept for backdated calculations.
- `engine/calculateStampDuty.ts`: deterministic calculation flow.
- `engine/applyConcessions.ts`: concession effect handling.
- `docs/LEGISLATIVE-UPDATE-PROCESS.md`: policy for updating rule versions when law changes.

## Calculation Flow

1. Normalize input (`state`, value, flags, date).
2. Load jurisdiction rules (current + history).
3. Select active base rule by date, condition match, and priority.
4. Compute base duty from bracket/flat/piecewise/lookup/fallback method.
5. Apply matched concessions in priority order.
6. Apply matched surcharges.
7. Return deterministic output:
   - `baseDuty`
   - `finalDuty`
   - `appliedRules`
   - `explanations`
   - `sourceUrls`

## Updating Rules When Legislation Changes

1. Add or edit the relevant state file in `rules/current/`.
2. Keep old rule definitions in `rules/history/` with `effective_to` set.
3. Add new rule with a fresh `id`, `effective_from`, and source references.
4. Preserve existing IDs where behaviour must remain traceable.
5. Run tests and verify date-based selection for both old and new effective periods.

## Adding a New State Rule Variant

1. Edit `rules/current/<state>.json`.
2. Add base rules with one of:
   - `brackets`
   - `flat_percent`
   - `formula_piecewise`
   - `lookup_table`
   - `official_calculator_fallback`
   - `unresolved`
3. Add concession and surcharge hooks with explicit source URLs.
4. If formula is unknown, keep `calculation_method: "unresolved"` and include `todo` + `fallback_url`.

## Validation and QA

1. Schema-check state JSON against `schema/stampDutyRules.schema.json`.
2. Run unit tests:
   - `npm run test -- tests/unit/stamp-duty-engine.test.ts`
3. Verify migration parity against existing UI pathways:
   - `first-home-analysis`
   - `homeowner-pathway-analysis`
   - `deposit-runway`
4. For any unresolved rule, confirm source URLs and TODO notes are present.

## Current Coverage

- NSW: base duty + broad first-home model + foreign purchaser surcharge rates (date-versioned).
- VIC: general non-PPR base duty + foreign purchaser additional duty rates + first-home full exemption.
- VIC unresolved: first-home partial concession band and PPR concession band.
- QLD: general rates + owner-occupier home concession + first-home concession amount tables + AFAD surcharge rates.
- WA: general rates + owner-occupier concessional band + first-home rate schedules + foreign transfer duty surcharge.
- SA: base duty table + first-home full-relief pathways + foreign ownership surcharge.
- SA unresolved: value-scaled first-home partial relief formulas and surcharge-relief interaction details.
- TAS: base duty table + first-home established-home relief windows + FIDS surcharge rates.
- TAS unresolved: post-30 June 2026 first-home relief settings.
- ACT: owner-occupier and non-owner conveyance rates from 1 July 2025.
- ACT unresolved: income-tested home buyer concession scheme computation and foreign-buyer surcharge confirmation.
- NT: base duty formulas and date cutovers extracted from official NT calculator script.
- NT unresolved: first-home concession and foreign-buyer surcharge hooks.
