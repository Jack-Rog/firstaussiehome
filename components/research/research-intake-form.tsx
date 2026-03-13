"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import {
  RESEARCH_BUYING_MODE_OPTIONS,
  RESEARCH_BUY_TIMELINE_OPTIONS,
  RESEARCH_CAREER_STAGE_OPTIONS,
  RESEARCH_CATEGORIES,
  RESEARCH_INCOME_BAND_OPTIONS,
  RESEARCH_PROMPT_VERSION,
  RESEARCH_SAVINGS_BAND_OPTIONS,
  RESEARCH_STATE_OPTIONS,
  RESEARCH_TIME_STUCK_OPTIONS,
} from "@/src/lib/research";
import {
  getAnonymousId,
  getSessionId,
  hasRecentDashboardResearchSubmission,
  setDashboardResearchSubmittedAt,
  trackResearchEvent,
} from "@/src/lib/research-client";
import type {
  ResearchBuyTimeline,
  ResearchBuyingMode,
  ResearchCareerStage,
  ResearchCategory,
  ResearchContext,
  ResearchIncomeBand,
  ResearchSavingsBand,
  ResearchState,
  ResearchSubmissionSurface,
  ResearchTimeStuck,
} from "@/src/lib/types";

const selectClassName =
  "w-full rounded-xl border border-border bg-[#f9f8f6] px-4 py-3 text-sm text-foreground shadow-[0_2px_10px_rgba(30,41,34,0.06)] focus:border-primary focus:bg-white focus:outline-none";

type ResearchIntakeFormProps = {
  surface: ResearchSubmissionSurface;
  title: string;
  intro: string;
  context?: ResearchContext;
};

export function ResearchIntakeForm({ surface, title, intro, context }: ResearchIntakeFormProps) {
  const problemFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const [problemText, setProblemText] = useState("");
  const [attemptedSolutions, setAttemptedSolutions] = useState("");
  const [category, setCategory] = useState<ResearchCategory | "">("");
  const [timeStuck, setTimeStuck] = useState<ResearchTimeStuck | "">("");
  const [slowdownLevel, setSlowdownLevel] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [buyTimeline, setBuyTimeline] = useState<ResearchBuyTimeline | "">("");
  const [confidenceLevel, setConfidenceLevel] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [interviewOptIn, setInterviewOptIn] = useState<boolean | null>(null);
  const [careerStage, setCareerStage] = useState<ResearchCareerStage | "">("");
  const [stateValue, setStateValue] = useState<ResearchState | "">("");
  const [incomeBand, setIncomeBand] = useState<ResearchIncomeBand | "">("");
  const [savingsBand, setSavingsBand] = useState<ResearchSavingsBand | "">("");
  const [buyingMode, setBuyingMode] = useState<ResearchBuyingMode | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSuppressed, setIsSuppressed] = useState(false);

  const isEoi = surface === "eoi";

  useEffect(() => {
    if (surface === "dashboard" && hasRecentDashboardResearchSubmission()) {
      setIsSuppressed(true);
      return;
    }

    void trackResearchEvent({
      surface,
      eventName: surface === "dashboard" ? "research_module_viewed" : "eoi_viewed",
    });
  }, [surface]);

  function markStarted() {
    if (hasTrackedStart) {
      return;
    }

    setHasTrackedStart(true);
    void trackResearchEvent({
      surface,
      eventName: "research_started",
    });
  }

  function toggleInterviewOptIn(nextValue: boolean) {
    markStarted();
    setInterviewOptIn(nextValue);
  }

  function validate() {
    if (problemText.trim().length === 0) {
      return "Tell us about a real moment that felt hard or confusing.";
    }

    if (attemptedSolutions.trim().length === 0) {
      return "Tell us what you already tried.";
    }

    if (!category) {
      return "Pick the area this mostly relates to.";
    }

    if (!timeStuck) {
      return "Tell us how long you have been stuck on this.";
    }

    if (slowdownLevel === null) {
      return "Rate how much this is slowing you down.";
    }

    if (!buyTimeline) {
      return "Tell us how soon you hope to buy.";
    }

    if (confidenceLevel === null) {
      return "Rate how confident you feel about your path right now.";
    }

    if (isEoi && !careerStage) {
      return "Choose your current career stage.";
    }

    if (isEoi && !stateValue) {
      return "Choose the state or territory you are focused on.";
    }

    if (isEoi && !incomeBand) {
      return "Choose your current income band.";
    }

    if (isEoi && !savingsBand) {
      return "Choose your current savings band.";
    }

    if (isEoi && !buyingMode) {
      return "Tell us whether you expect to buy solo or jointly.";
    }

    if (interviewOptIn === null) {
      return "Tell us whether you are open to a 10-minute chat.";
    }

    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submissionContext = isEoi
        ? {
            state: stateValue || "unknown",
            incomeBand: incomeBand || "unknown",
            savingsBand: savingsBand || "unknown",
            buyingMode: buyingMode || "unknown",
            propertyPriceBand: null,
          }
        : context ?? null;

      const response = await fetch("/api/research/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonymousId: getAnonymousId(),
          sessionId: getSessionId(),
          surface,
          promptVersion: RESEARCH_PROMPT_VERSION,
          problemText: problemText.trim(),
          attemptedSolutions: attemptedSolutions.trim(),
          category,
          timeStuck,
          slowdownLevel,
          buyTimeline,
          confidenceLevel,
          interviewOptIn,
          careerStage: careerStage || null,
          context: submissionContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit research response.");
      }

      await trackResearchEvent({
        surface,
        eventName: "research_submitted",
      });

      if (surface === "dashboard") {
        setDashboardResearchSubmittedAt(new Date().toISOString());
      }

      setIsSubmitted(true);
    } catch {
      setError("We could not save your feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSkip() {
    setIsCollapsed(true);
    void trackResearchEvent({
      surface,
      eventName: "research_skipped",
    });
  }

  function focusSurvey() {
    problemFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    problemFieldRef.current?.focus();
  }

  if (isSuppressed) {
    return (
      <Card
        data-testid={`research-intake-${surface}-suppressed`}
        className="animate-fade-up border-[#d4b06a]/40 bg-[linear-gradient(135deg,#fff8dd,#fff1c9)] p-5 shadow-[0_14px_34px_rgba(191,141,36,0.12)]"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">Quick research survey</p>
            <CardTitle className="text-lg">You already shared feedback recently.</CardTitle>
            <CardText>
              We hide the full form for 30 days after a dashboard submission so it does not vanish without explanation.
              If you want to add more detail, reopen it here.
            </CardText>
          </div>
          <Button
            type="button"
            onClick={() => {
              setIsSuppressed(false);
              setHasTrackedStart(true);
              void trackResearchEvent({
                surface,
                eventName: "research_started",
                properties: { reopened: true },
              });
              window.setTimeout(focusSurvey, 0);
            }}
          >
            Open survey again
          </Button>
        </div>
      </Card>
    );
  }

  if (surface === "dashboard" && isCollapsed) {
    return (
      <Card className="animate-fade-up border-dashed border-[#d4b06a]/50 bg-[linear-gradient(135deg,#fff9e6,#fff3cf)] p-5 shadow-[0_12px_28px_rgba(191,141,36,0.1)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">Share feedback later</CardTitle>
            <CardText>Keep exploring the dashboard and reopen this when you are ready.</CardText>
          </div>
          <Button type="button" variant="secondary" onClick={() => setIsCollapsed(false)}>
            Share feedback later
          </Button>
        </div>
      </Card>
    );
  }

  if (isSubmitted) {
    return (
      <Card className="animate-fade-up border-[#d4b06a]/40 bg-[linear-gradient(135deg,#fff8df,#fff0c7)] shadow-[0_14px_34px_rgba(191,141,36,0.12)]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a6a0a]">Thanks</p>
          <CardTitle>We have your feedback.</CardTitle>
          <CardText>
            We use these responses to decide what to build next.{" "}
            {interviewOptIn
              ? "If we follow up about a short 10-minute research chat, we will use the email on your account."
              : "You can keep exploring the dashboard now."}
          </CardText>
        </div>
      </Card>
    );
  }

  return (
      <Card
      data-testid={`research-intake-${surface}`}
      className="animate-fade-up border-[#d8c39a]/45 bg-[linear-gradient(180deg,#fffdf9,#faf4e8)] shadow-[0_16px_38px_rgba(177,142,82,0.11)]"
    >
      {surface === "dashboard" ? (
        <div className="mb-5 rounded-[1.1rem] border border-[#d8c39a]/45 bg-[linear-gradient(135deg,#f8ecd0,#f2dfb5)] p-4 shadow-[0_12px_28px_rgba(177,142,82,0.14)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6b2b]">Quick research survey</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-2xl space-y-1">
              <p className="text-lg font-semibold tracking-tight text-[#4f3f1b]">Tell us what is still blocking you.</p>
              <p className="text-sm text-[#66563a]">
                Fill in the short survey below. Early research participants may receive free credits in future rollouts.
              </p>
            </div>
            <Button type="button" className="bg-[#8b6b2b] text-white hover:bg-[#755a25]" onClick={focusSurvey}>
              Fill in the survey
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b6b2b]">
          {surface === "dashboard" ? "Help shape what comes next" : "Research survey"}
        </p>
        <CardTitle>{title}</CardTitle>
        <CardText>{intro}</CardText>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">Tell us the last real moment you got stuck</span>
          <textarea
            ref={problemFieldRef}
            data-testid={`research-${surface}-problem`}
            className="min-h-28 rounded-xl border border-border bg-[#f9f8f6] px-4 py-3 text-sm text-foreground shadow-[0_2px_10px_rgba(30,41,34,0.06)] outline-none placeholder:text-[#9aa097] focus:border-primary focus:bg-white"
            placeholder="Example: I spent hours trying to work out whether I could buy sooner with a scheme, but I still was not sure what applied to me."
            value={problemText}
            onChange={(event) => {
              markStarted();
              setProblemText(event.currentTarget.value);
            }}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">What have you already tried?</span>
          <textarea
            data-testid={`research-${surface}-attempted`}
            className="min-h-24 rounded-xl border border-border bg-[#f9f8f6] px-4 py-3 text-sm text-foreground shadow-[0_2px_10px_rgba(30,41,34,0.06)] outline-none placeholder:text-[#9aa097] focus:border-primary focus:bg-white"
            placeholder="Examples: reading government pages, asking friends, spreadsheets, calculators, mortgage broker, nothing yet."
            value={attemptedSolutions}
            onChange={(event) => {
              markStarted();
              setAttemptedSolutions(event.currentTarget.value);
            }}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">Which area does this mostly relate to?</span>
          <select
            data-testid={`research-${surface}-category`}
            className={selectClassName}
            value={category}
            onChange={(event) => {
              markStarted();
              setCategory(event.currentTarget.value as ResearchCategory | "");
            }}
          >
            <option value="">Select one</option>
            {RESEARCH_CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">How long have you been stuck on this?</span>
            <select
              data-testid={`research-${surface}-time-stuck`}
              className={selectClassName}
              value={timeStuck}
              onChange={(event) => {
                markStarted();
                setTimeStuck(event.currentTarget.value as ResearchTimeStuck | "");
              }}
            >
              <option value="">Select one</option>
              {RESEARCH_TIME_STUCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">How soon are you hoping to buy?</span>
            <select
              data-testid={`research-${surface}-buy-timeline`}
              className={selectClassName}
              value={buyTimeline}
              onChange={(event) => {
                markStarted();
                setBuyTimeline(event.currentTarget.value as typeof buyTimeline);
              }}
            >
              <option value="">Select one</option>
              {RESEARCH_BUY_TIMELINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">How much is this slowing you down?</p>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4, 5] as const).map((value) => (
                <button
                  key={`slowdown-${value}`}
                  type="button"
                  data-testid={`research-${surface}-slowdown-${value}`}
                  aria-label={`Slowdown level ${value}`}
                  className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                    slowdownLevel === value
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-foreground hover:bg-surface-muted"
                  }`}
                  onClick={() => {
                    markStarted();
                    setSlowdownLevel(value);
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-foreground-soft">1 = barely, 5 = heavily</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">How confident do you feel about your path right now?</p>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4, 5] as const).map((value) => (
                <button
                  key={`confidence-${value}`}
                  type="button"
                  data-testid={`research-${surface}-confidence-${value}`}
                  aria-label={`Confidence level ${value}`}
                  className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
                    confidenceLevel === value
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-foreground hover:bg-surface-muted"
                  }`}
                  onClick={() => {
                    markStarted();
                    setConfidenceLevel(value);
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-foreground-soft">1 = not confident, 5 = very confident</p>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold">
            Career stage {isEoi ? "" : "(optional)"}
          </span>
          <select
            data-testid={`research-${surface}-career-stage`}
            className={selectClassName}
            value={careerStage}
            onChange={(event) => {
              markStarted();
              setCareerStage(event.currentTarget.value as ResearchCareerStage | "");
            }}
          >
            <option value="">{isEoi ? "Select one" : "Optional"}</option>
            {RESEARCH_CAREER_STAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {isEoi ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">State or territory</span>
              <select
                data-testid={`research-${surface}-state`}
                className={selectClassName}
                value={stateValue}
                onChange={(event) => {
                  markStarted();
                  setStateValue(event.currentTarget.value as ResearchState | "");
                }}
              >
                <option value="">Select one</option>
                {RESEARCH_STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Buying mode</span>
              <select
                data-testid={`research-${surface}-buying-mode`}
                className={selectClassName}
                value={buyingMode}
                onChange={(event) => {
                  markStarted();
                  setBuyingMode(event.currentTarget.value as ResearchBuyingMode | "");
                }}
              >
                <option value="">Select one</option>
                {RESEARCH_BUYING_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Income band</span>
              <select
                data-testid={`research-${surface}-income-band`}
                className={selectClassName}
                value={incomeBand}
                onChange={(event) => {
                  markStarted();
                  setIncomeBand(event.currentTarget.value as ResearchIncomeBand | "");
                }}
              >
                <option value="">Select one</option>
                {RESEARCH_INCOME_BAND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">Savings band</span>
              <select
                data-testid={`research-${surface}-savings-band`}
                className={selectClassName}
                value={savingsBand}
                onChange={(event) => {
                  markStarted();
                  setSavingsBand(event.currentTarget.value as ResearchSavingsBand | "");
                }}
              >
                <option value="">Select one</option>
                {RESEARCH_SAVINGS_BAND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <div className="space-y-2 rounded-xl border border-border bg-[#f8faf6] p-4">
          <p className="text-sm font-semibold">Open to a 10-minute chat about your story and what you are struggling with?</p>
          <p className="text-xs text-foreground-soft">
            {surface === "dashboard"
              ? "If you say yes, we will use the email on your account for any follow-up."
              : "If you say yes, we will use your signed-in account email for any follow-up."}
          </p>
          <div className="flex gap-3">
            <Button
              data-testid={`research-${surface}-interview-yes`}
              type="button"
              variant={interviewOptIn === true ? "primary" : "secondary"}
              onClick={() => toggleInterviewOptIn(true)}
            >
              Yes
            </Button>
            <Button
              data-testid={`research-${surface}-interview-no`}
              type="button"
              variant={interviewOptIn === false ? "primary" : "secondary"}
              onClick={() => toggleInterviewOptIn(false)}
            >
              No
            </Button>
          </div>
        </div>

        {error ? <p className="text-sm text-[#8a2f2f]">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button data-testid={`research-${surface}-submit`} type="button" onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Send feedback"}
          </Button>
          {surface === "dashboard" ? (
            <Button
              data-testid={`research-${surface}-skip`}
              type="button"
              variant="secondary"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
