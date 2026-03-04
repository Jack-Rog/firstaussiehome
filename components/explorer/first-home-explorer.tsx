"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalysisStack } from "@/components/explorer/analysis-stack";
import { InputDock } from "@/components/explorer/input-dock";
import { MiniMetricStrip } from "@/components/explorer/mini-metric-strip";
import { useDisclosure } from "@/components/compliance/disclosure-context";
import {
  buildFirstHomeExplorerOutput,
  DEFAULT_FIRST_HOME_EXPLORER_INPUT,
} from "@/src/lib/analysis/first-home-analysis";
import type {
  ExplorerCategoryId,
  FirstHomeExplorerInput,
} from "@/src/lib/types";

const STORAGE_KEY = "aussiesfirsthome:first-home-explorer";
const CATEGORY_IDS: ExplorerCategoryId[] = [
  "scheme-fit",
  "stamp-duty",
  "deposit",
  "time-to-save",
  "borrowing",
  "peer-position",
];

function isCategoryId(value: string): value is ExplorerCategoryId {
  return CATEGORY_IDS.includes(value as ExplorerCategoryId);
}

function getInitialInputState(initialInput?: Partial<FirstHomeExplorerInput>) {
  const base = {
    ...DEFAULT_FIRST_HOME_EXPLORER_INPUT,
    ...initialInput,
  };

  if (typeof window === "undefined") {
    return base;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return base;
  }

  try {
    const saved = JSON.parse(raw) as Partial<FirstHomeExplorerInput>;
    return {
      ...base,
      ...saved,
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return base;
  }
}

function getInitialExpandedCategory(initialExpandedCategory: ExplorerCategoryId) {
  if (typeof window === "undefined") {
    return initialExpandedCategory;
  }

  const hash = window.location.hash.replace("#", "");
  return isCategoryId(hash) ? hash : initialExpandedCategory;
}

export function FirstHomeExplorer({
  initialInput,
  initialExpandedCategory = "scheme-fit",
}: {
  initialInput?: Partial<FirstHomeExplorerInput>;
  initialExpandedCategory?: ExplorerCategoryId;
}) {
  const [activeSegment, setActiveSegment] = useState<"situation" | "numbers">("situation");
  const [input, setInput] = useState<FirstHomeExplorerInput>(() => getInitialInputState(initialInput));
  const [expandedCategory, setExpandedCategory] = useState<ExplorerCategoryId>(() =>
    getInitialExpandedCategory(initialExpandedCategory),
  );
  const { setDisclosure } = useDisclosure();

  const output = useMemo(() => buildFirstHomeExplorerOutput(input), [input]);

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

    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [input]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = expandedCategory === "scheme-fit" ? "explorer" : expandedCategory;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${nextHash}`);
  }, [expandedCategory]);

  function updateField<Key extends keyof FirstHomeExplorerInput>(
    key: Key,
    value: FirstHomeExplorerInput[Key],
  ) {
    setInput((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <section id="explorer" className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <InputDock
        input={input}
        activeSegment={activeSegment}
        onSegmentChange={setActiveSegment}
        onChange={updateField}
      />
      <div className="space-y-4">
        <MiniMetricStrip summary={output.summary} />
        <AnalysisStack
          categories={output.categories}
          expandedCategory={expandedCategory}
          onExpand={setExpandedCategory}
        />
      </div>
    </section>
  );
}
