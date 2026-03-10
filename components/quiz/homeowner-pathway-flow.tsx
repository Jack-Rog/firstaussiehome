"use client";

import { useEffect, useMemo, useState } from "react";
import { CashOutlayOverlay } from "@/components/pathways/cash-outlay-overlay";
import { PathwayQualitativeStep } from "@/components/quiz/pathway-qualitative-step";
import { PathwayQuantitativeStep } from "@/components/quiz/pathway-quantitative-step";
import { PathwayResultsStage } from "@/components/quiz/pathway-results-stage";
import { PathwayStepper } from "@/components/quiz/pathway-stepper";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDisclosure } from "@/components/compliance/disclosure-context";
import {
  buildHomeownerPathwayOutput,
  DEFAULT_HOMEOWNER_PATHWAY_INPUT,
  DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
} from "@/src/lib/analysis/homeowner-pathway-analysis";
import type {
  HomeownerPathwayInput,
  HomeownerPathwaySelections,
} from "@/src/lib/types";
import { formatCurrency, formatCurrencyInput, parseMoneyInput } from "@/src/lib/utils";

type StepId = 1 | 2 | 3;

type NumericDraft = {
  currentSavings: string;
  targetPropertyPrice: string;
  actHouseholdIncome: string;
};

type QualitativeTouched = {
  firstHomeBuyer: boolean;
  livingInNsw: boolean;
  buyingNewHome: boolean;
  australianCitizenOrResident: boolean;
  existingProperty: boolean;
  dependants: boolean;
};

const STORAGE_KEY = "aussiesfirsthome:homeowner-pathway-flow";
const TARGET_PRICE_SLIDER_MIN = 200000;
const TARGET_PRICE_SLIDER_MAX = 2500000;
const TARGET_PRICE_SLIDER_STEP = 5000;

function getInitialTouched(allTouched: boolean): QualitativeTouched {
  return {
    firstHomeBuyer: allTouched,
    livingInNsw: allTouched,
    buyingNewHome: allTouched,
    australianCitizenOrResident: allTouched,
    existingProperty: allTouched,
    dependants: allTouched,
  };
}

function toNumericDraft(input: HomeownerPathwayInput): NumericDraft {
  return {
    currentSavings: formatCurrencyInput(input.currentSavings),
    targetPropertyPrice: formatCurrencyInput(input.targetPropertyPrice),
    actHouseholdIncome: formatCurrencyInput(input.actHouseholdIncome),
  };
}

function getBaseState(
  initialInput?: Partial<HomeownerPathwayInput>,
  initialSelections?: Partial<HomeownerPathwaySelections>,
  initialStep: StepId = 1,
) {
  const baseInput = {
    ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
    ...initialInput,
  };
  const baseSelections = {
    ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
    ...initialSelections,
  };

  return {
    input: baseInput,
    selections: baseSelections,
    currentStep: initialStep,
    unlockedStep: initialStep,
    numericDraft: toNumericDraft(baseInput),
    touched: getInitialTouched(initialStep === 3),
  };
}

export function HomeownerPathwayFlow({
  initialInput,
  initialSelections,
  initialStep = 1,
}: {
  initialInput?: Partial<HomeownerPathwayInput>;
  initialSelections?: Partial<HomeownerPathwaySelections>;
  initialStep?: StepId;
}) {
  const initialState = getBaseState(initialInput, initialSelections, initialStep);
  const [input, setInput] = useState<HomeownerPathwayInput>(initialState.input);
  const [selections, setSelections] = useState<HomeownerPathwaySelections>(initialState.selections);
  const [currentStep, setCurrentStep] = useState<StepId>(initialState.currentStep);
  const [unlockedStep, setUnlockedStep] = useState<StepId>(initialState.unlockedStep);
  const [numericDraft, setNumericDraft] = useState<NumericDraft>(initialState.numericDraft);
  const [qualitativeTouched, setQualitativeTouched] = useState<QualitativeTouched>(initialState.touched);
  const [editorSegment, setEditorSegment] = useState<"situation" | "numbers">("situation");
  const [storageReady, setStorageReady] = useState(false);
  const { setDisclosure } = useDisclosure();

  const output = useMemo(
    () => buildHomeownerPathwayOutput(input, selections),
    [input, selections],
  );

  useEffect(() => {
    setDisclosure({
      sources: output.sources,
      assumptions: output.assumptions,
      reviewDate: output.reviewDate,
    });
  }, [output, setDisclosure]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setStorageReady(true);
      return;
    }

    try {
      const saved = JSON.parse(raw) as {
        input?: Partial<HomeownerPathwayInput>;
        selections?: Partial<HomeownerPathwaySelections>;
        currentStep?: StepId;
        unlockedStep?: StepId;
        touched?: Partial<QualitativeTouched>;
      };

      const restoredInput: HomeownerPathwayInput = {
        ...DEFAULT_HOMEOWNER_PATHWAY_INPUT,
        ...saved.input,
        ...initialInput,
      };

      setInput(restoredInput);
      setSelections({
        ...DEFAULT_HOMEOWNER_PATHWAY_SELECTIONS,
        ...saved.selections,
        ...initialSelections,
      });
      setCurrentStep(Math.max(initialStep, saved.currentStep ?? initialStep) as StepId);
      setUnlockedStep(Math.max(initialStep, saved.unlockedStep ?? initialStep) as StepId);
      setNumericDraft(toNumericDraft(restoredInput));
      setQualitativeTouched({
        ...getInitialTouched(initialStep === 3),
        ...saved.touched,
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setStorageReady(true);
    }
  }, [initialInput, initialSelections, initialStep]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!storageReady) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input,
          selections,
          currentStep,
          unlockedStep,
          touched: qualitativeTouched,
        }),
      );
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [input, selections, currentStep, unlockedStep, qualitativeTouched, storageReady]);

  useEffect(() => {
    if (typeof window === "undefined" || currentStep !== 3) {
      return;
    }

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#pathway-${selections.expandedPathway}`,
    );
  }, [currentStep, selections.expandedPathway]);

  function updateBooleanField(
    key:
      | "firstHomeBuyer"
      | "livingInNsw"
      | "buyingNewHome"
      | "australianCitizenOrResident"
      | "existingProperty"
      | "dependants",
    value: boolean,
  ) {
    setInput((current) => ({
      ...current,
      [key]: value,
      ...(key === "firstHomeBuyer" ? { existingProperty: value ? false : current.existingProperty } : {}),
      ...(key === "existingProperty" ? { firstHomeBuyer: value ? false : current.firstHomeBuyer } : {}),
    }));

    setQualitativeTouched((current) => ({
      ...current,
      [key]: true,
    }));
  }

  function updateNumericDraft(key: keyof NumericDraft, raw: string) {
    setNumericDraft((current) => ({
      ...current,
      [key]: raw,
    }));

    const nextValue = parseMoneyInput(raw);

    setInput((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  function formatNumericField(key: keyof NumericDraft) {
    const nextValue =
      key === "currentSavings"
        ? formatCurrencyInput(input.currentSavings)
        : key === "targetPropertyPrice"
          ? formatCurrencyInput(input.targetPropertyPrice)
          : formatCurrencyInput(input.actHouseholdIncome);

    setNumericDraft((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  function updateTargetPriceSlider(raw: string) {
    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      return;
    }

    const clamped = Math.min(TARGET_PRICE_SLIDER_MAX, Math.max(TARGET_PRICE_SLIDER_MIN, parsed));
    const formatted = formatCurrencyInput(clamped);

    setNumericDraft((current) => ({
      ...current,
      targetPropertyPrice: formatted,
    }));
    setInput((current) => ({
      ...current,
      targetPropertyPrice: clamped,
    }));
  }

  function openStep(step: StepId) {
    if (unlockedStep >= step) {
      setCurrentStep(step);
    }
  }

  function advanceToNumbers() {
    setUnlockedStep(2);
    setCurrentStep(2);
  }

  function advanceToPathways() {
    setUnlockedStep(3);
    setCurrentStep(3);
  }

  function togglePathwaySelection(key: "includeGuaranteeComparison" | "includeFhssConcept") {
    setSelections((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };

      if (
        key === "includeGuaranteeComparison" &&
        !next.includeGuaranteeComparison &&
        (next.activeDepositScenario === "guarantee-5" || next.activeDepositScenario === "shared-equity-2")
      ) {
        next.activeDepositScenario = "baseline-20";
      }

      return next;
    });
  }

  const compactEditor = (
    <Card className="space-y-4 bg-white/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Your snapshot</p>
        <div className="flex gap-2">
          <button
            type="button"
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              editorSegment === "situation" ? "bg-primary text-white" : "bg-surface text-foreground ring-1 ring-border"
            }`}
            onClick={() => setEditorSegment("situation")}
          >
            Situation
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-2 text-xs font-semibold ${
              editorSegment === "numbers" ? "bg-primary text-white" : "bg-surface text-foreground ring-1 ring-border"
            }`}
            onClick={() => setEditorSegment("numbers")}
          >
            Numbers
          </button>
        </div>
      </div>

      {editorSegment === "situation" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["First home", input.firstHomeBuyer, "firstHomeBuyer"],
            ["NSW", input.livingInNsw, "livingInNsw"],
            ["New build", input.buyingNewHome, "buyingNewHome"],
            ["Resident", input.australianCitizenOrResident, "australianCitizenOrResident"],
            ["Property", input.existingProperty, "existingProperty"],
            ["Dependants", input.dependants, "dependants"],
          ].map(([label, value, key]) => (
            <button
              key={`compact-${String(key)}`}
              type="button"
              className={`rounded-2xl px-3 py-3 text-left text-sm font-semibold ${
                value ? "bg-primary/10 text-primary-strong" : "bg-surface text-foreground-soft ring-1 ring-border"
              }`}
              onClick={() =>
                updateBooleanField(
                  key as
                    | "firstHomeBuyer"
                    | "livingInNsw"
                    | "buyingNewHome"
                    | "australianCitizenOrResident"
                    | "existingProperty"
                    | "dependants",
                  !Boolean(value),
                )
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {editorSegment === "numbers" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {(
            [
              ["currentSavings", "Current savings"],
              ["targetPropertyPrice", "Desired property price"],
              ["actHouseholdIncome", "Household income (previous FY)"],
            ] as const
          ).map(([key, label]) => (
            <label key={`compact-${key}`} className="grid gap-2 text-sm font-semibold">
              <span>{label}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={numericDraft[key]}
                onChange={(event) => updateNumericDraft(key, event.currentTarget.value)}
                onBlur={() => formatNumericField(key)}
              />
            </label>
          ))}
          <div className="md:col-span-2 rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-soft">
              <span>{formatCurrency(TARGET_PRICE_SLIDER_MIN)}</span>
              <span>Slide property value</span>
              <span>{formatCurrency(TARGET_PRICE_SLIDER_MAX)}</span>
            </div>
            <input
              data-testid="pathway-targetPropertyPrice-slider"
              type="range"
              min={TARGET_PRICE_SLIDER_MIN}
              max={TARGET_PRICE_SLIDER_MAX}
              step={TARGET_PRICE_SLIDER_STEP}
              value={Math.min(
                TARGET_PRICE_SLIDER_MAX,
                Math.max(
                  TARGET_PRICE_SLIDER_MIN,
                  Number(numericDraft.targetPropertyPrice.replace(/[^0-9]/g, "") || TARGET_PRICE_SLIDER_MIN),
                ),
              )}
              onChange={(event) => updateTargetPriceSlider(event.currentTarget.value)}
              className="mt-3 w-full accent-primary"
            />
          </div>
        </div>
      ) : null}
    </Card>
  );

  return (
    <div className="space-y-6">
      <PathwayStepper currentStep={currentStep} unlockedStep={unlockedStep} onSelectStep={openStep} />

      {currentStep === 1 ? (
        <PathwayQualitativeStep
          input={input}
          touched={qualitativeTouched}
          onBooleanChange={updateBooleanField}
          onContinue={advanceToNumbers}
        />
      ) : null}

      {currentStep === 2 ? (
        <PathwayQuantitativeStep
          values={numericDraft}
          onChange={updateNumericDraft}
          onBlur={formatNumericField}
          onContinue={advanceToPathways}
        />
      ) : null}

      {currentStep === 3 ? (
        <>
          <PathwayResultsStage
            output={output}
            selections={selections}
            editor={compactEditor}
            onExpand={(id) =>
              setSelections((current) => ({
                ...current,
                expandedPathway: id,
              }))
            }
            onScenarioSelect={(id) =>
              setSelections((current) => ({
                ...current,
                activeDepositScenario: id,
              }))
            }
            onToggleSelection={togglePathwaySelection}
            onToggleCashOverlay={() =>
              setSelections((current) => ({
                ...current,
                showCashOverlay: !current.showCashOverlay,
              }))
            }
          />

          <CashOutlayOverlay
            open={selections.showCashOverlay}
            model={output.cashOutlayOverlay}
            onClose={() =>
              setSelections((current) => ({
                ...current,
                showCashOverlay: false,
              }))
            }
          />
        </>
      ) : null}
    </div>
  );
}
