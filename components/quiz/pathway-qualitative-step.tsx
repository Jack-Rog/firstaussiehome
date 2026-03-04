"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GlossaryPopover } from "@/components/ui/glossary-popover";
import type { HomeownerPathwayInput } from "@/src/lib/types";

type BooleanFieldKey =
  | "firstHomeBuyer"
  | "livingInNsw"
  | "buyingNewHome"
  | "australianCitizenOrResident"
  | "paygOnly"
  | "dependants"
  | "businessIncome"
  | "existingProperty";

type TouchedMap = Record<BooleanFieldKey | "buyingSoloOrJoint", boolean>;

const BOOLEAN_FIELDS: Array<{
  key: BooleanFieldKey;
  label: string;
  glossary?: {
    term: string;
    body: string;
  };
}> = [
  { key: "firstHomeBuyer", label: "First home buyer" },
  { key: "livingInNsw", label: "Buying in NSW first" },
  { key: "buyingNewHome", label: "New build" },
  { key: "australianCitizenOrResident", label: "Citizen / permanent resident" },
  { key: "paygOnly", label: "PAYG only" },
  { key: "dependants", label: "Dependants" },
  { key: "businessIncome", label: "Business income" },
  { key: "existingProperty", label: "Existing property ownership" },
];

function ChoiceButton({
  active,
  tone,
  children,
  onClick,
}: {
  active: boolean;
  tone: "positive" | "negative";
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? tone === "positive"
            ? "bg-primary text-white"
            : "bg-[#d7dfd4] text-foreground"
          : "bg-white text-foreground-soft ring-1 ring-border"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function PathwayQualitativeStep({
  input,
  touched,
  onBooleanChange,
  onChoiceChange,
  onContinue,
}: {
  input: HomeownerPathwayInput;
  touched: TouchedMap;
  onBooleanChange: (key: BooleanFieldKey, value: boolean) => void;
  onChoiceChange: (value: "solo" | "joint") => void;
  onContinue: () => void;
}) {
  const canContinue = Object.values(touched).every(Boolean);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {BOOLEAN_FIELDS.map((field) => {
          const isTouched = touched[field.key];
          const currentValue = input[field.key];

          return (
            <Card key={field.key} data-testid={`qual-field-${field.key}`} className="space-y-4 bg-white/90 p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{field.label}</span>
                {field.glossary ? (
                  <GlossaryPopover term={field.glossary.term} body={field.glossary.body} />
                ) : null}
              </div>
              <div className="flex gap-2">
                <ChoiceButton
                  active={isTouched && currentValue}
                  tone="positive"
                  onClick={() => onBooleanChange(field.key, true)}
                >
                  <span data-testid={`qual-${field.key}-yes`}>Yes</span>
                </ChoiceButton>
                <ChoiceButton
                  active={isTouched && !currentValue}
                  tone="negative"
                  onClick={() => onBooleanChange(field.key, false)}
                >
                  <span data-testid={`qual-${field.key}-no`}>No</span>
                </ChoiceButton>
              </div>
            </Card>
          );
        })}

        <Card data-testid="qual-field-buyingSoloOrJoint" className="space-y-4 bg-white/90 p-5 md:col-span-2">
          <span className="text-sm font-semibold">Buying solo or joint</span>
          <div className="flex gap-2">
            <ChoiceButton
              active={touched.buyingSoloOrJoint && input.buyingSoloOrJoint === "solo"}
              tone="positive"
              onClick={() => onChoiceChange("solo")}
            >
              <span data-testid="qual-buyingSoloOrJoint-solo">Solo</span>
            </ChoiceButton>
            <ChoiceButton
              active={touched.buyingSoloOrJoint && input.buyingSoloOrJoint === "joint"}
              tone="negative"
              onClick={() => onChoiceChange("joint")}
            >
              <span data-testid="qual-buyingSoloOrJoint-joint">Joint</span>
            </ChoiceButton>
          </div>
        </Card>
      </div>

      <Button data-testid="qual-continue" type="button" onClick={onContinue} disabled={!canContinue}>
        Continue
      </Button>
    </div>
  );
}
