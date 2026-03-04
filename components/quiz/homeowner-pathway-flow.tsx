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
import { formatCurrencyInput, parseMoneyInput } from "@/src/lib/utils";

type StepId = 1 | 2 | 3;

type NumericDraft = {
  age: string;
  annualSalary: string;
  privateDebt: string;
  hecsDebt: string;
  currentSavings: string;
  averageMonthlyExpenses: string;
  targetPropertyPrice: string;
};

type QualitativeTouched = {
  firstHomeBuyer: boolean;
  livingInNsw: boolean;
  buyingNewHome: boolean;
  australianCitizenOrResident: boolean;
  buyingSoloOrJoint: boolean;
  paygOnly: boolean;
  dependants: boolean;
  businessIncome: boolean;
  existingProperty: boolean;
};

const STORAGE_KEY = "aussiesfirsthome:homeowner-pathway-flow";

function getInitialTouched(allTouched: boolean): QualitativeTouched {
  return {
    firstHomeBuyer: allTouched,
    livingInNsw: allTouched,
    buyingNewHome: allTouched,
    australianCitizenOrResident: allTouched,
    buyingSoloOrJoint: allTouched,
    paygOnly: allTouched,
    dependants: allTouched,
    businessIncome: allTouched,
    existingProperty: allTouched,
  };
}

function toNumericDraft(input: HomeownerPathwayInput): NumericDraft {
  return {
    age: String(input.age),
    annualSalary: formatCurrencyInput(input.annualSalary),
    privateDebt: formatCurrencyInput(input.privateDebt),
    hecsDebt: formatCurrencyInput(input.hecsDebt),
    currentSavings: formatCurrencyInput(input.currentSavings),
    averageMonthlyExpenses: formatCurrencyInput(input.averageMonthlyExpenses),
    targetPropertyPrice: formatCurrencyInput(input.targetPropertyPrice),
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
      | "paygOnly"
      | "dependants"
      | "businessIncome"
      | "existingProperty",
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

  function updateChoiceField(value: "solo" | "joint") {
    setInput((current) => ({
      ...current,
      buyingSoloOrJoint: value,
    }));

    setQualitativeTouched((current) => ({
      ...current,
      buyingSoloOrJoint: true,
    }));
  }

  function updateNumericDraft(key: keyof NumericDraft, raw: string) {
    const sanitized = key === "age" ? raw.replace(/[^0-9]/g, "") : raw;

    setNumericDraft((current) => ({
      ...current,
      [key]: sanitized,
    }));

    const nextValue = key === "age" ? Number(sanitized || "0") : parseMoneyInput(sanitized);

    setInput((current) => ({
      ...current,
      [key]: nextValue,
    }));
  }

  function formatNumericField(key: keyof NumericDraft) {
    const nextValue =
      key === "age"
        ? String(input.age)
        : key === "annualSalary"
          ? formatCurrencyInput(input.annualSalary)
          : key === "privateDebt"
            ? formatCurrencyInput(input.privateDebt)
            : key === "hecsDebt"
              ? formatCurrencyInput(input.hecsDebt)
              : key === "currentSavings"
                ? formatCurrencyInput(input.currentSavings)
                : key === "averageMonthlyExpenses"
                  ? formatCurrencyInput(input.averageMonthlyExpenses)
                  : formatCurrencyInput(input.targetPropertyPrice);

    setNumericDraft((current) => ({
      ...current,
      [key]: nextValue,
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
            ["PAYG", input.paygOnly, "paygOnly"],
            ["Dependants", input.dependants, "dependants"],
            ["Business", input.businessIncome, "businessIncome"],
            ["Property", input.existingProperty, "existingProperty"],
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
                    | "paygOnly"
                    | "dependants"
                    | "businessIncome"
                    | "existingProperty",
                  !Boolean(value),
                )
              }
            >
              {label}
            </button>
          ))}
          <div className="rounded-2xl bg-surface p-3 text-sm font-semibold text-foreground">
            {input.buyingSoloOrJoint === "solo" ? "Solo" : "Joint"}
          </div>
        </div>
      ) : null}

      {editorSegment === "numbers" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {(
            [
              ["age", "Age"],
              ["annualSalary", "Annual salary"],
              ["privateDebt", "Private debt"],
              ["hecsDebt", "HECS / HELP"],
              ["currentSavings", "Current savings"],
              ["averageMonthlyExpenses", "Monthly expenses"],
              ["targetPropertyPrice", "Desired property price"],
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
          onChoiceChange={updateChoiceField}
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
