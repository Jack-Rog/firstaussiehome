import { AdminPasswordGate } from "@/components/admin/admin-password-gate";
import { AdminSessionControls } from "@/components/admin/admin-session-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { hasAdminPasswordConfigured } from "@/src/lib/admin";
import { getStoredFirstHomeQuizQuestionResponses } from "@/src/lib/first-home-quiz";
import { getAdminAccessState } from "@/src/lib/route-guards";
import type { QuizSubmissionRecord, ResearchEventRecord, ResearchSubmissionRecord } from "@/src/lib/types";
import { formatCurrency } from "@/src/lib/utils";
import { getRepository } from "@/src/server/repositories/repository";

export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    : [];
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMaybeCurrency(value: unknown) {
  const amount = asNumber(value);
  return amount === null ? "N/A" : formatCurrency(amount);
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCapturedUser(input: {
  userName?: string | null;
  userEmail?: string | null;
  userId?: string | null;
}) {
  if (input.userName && input.userEmail) {
    return `${input.userName} (${input.userEmail})`;
  }

  if (input.userEmail) {
    return input.userEmail;
  }

  if (input.userName) {
    return input.userName;
  }

  return input.userId ?? "Anonymous";
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card className="space-y-2 bg-[linear-gradient(180deg,#ffffff,#f6f7f3)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-strong">{label}</p>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <CardText>{note}</CardText>
    </Card>
  );
}

function SurveySubmissionCard({ submission }: { submission: ResearchSubmissionRecord }) {
  const response = asRecord(submission.response);
  const result = asRecord(submission.result);
  const tags = asStringArray(result.tags);
  const followUpEmail = submission.userEmail ?? null;

  return (
    <article className="rounded-[1.15rem] border border-border bg-white p-5 shadow-[0_10px_22px_rgba(33,47,37,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{submission.surface}</Badge>
        <Badge className="bg-[#eef4ea] text-foreground-soft">{formatTimestamp(submission.createdAt)}</Badge>
        {asBoolean(result.interviewQualified) ? (
          <Badge className="bg-[#e8f6ea] text-[#29623a]">Interview Qualified</Badge>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2 text-sm text-foreground-soft md:grid-cols-2">
        <p>
          <span className="font-semibold text-foreground">Category:</span>{" "}
          {titleCase(asString(response.category) ?? "unknown")}
        </p>
        <p>
          <span className="font-semibold text-foreground">Detail band:</span>{" "}
          {titleCase(asString(result.detailBand) ?? "unknown")}
        </p>
        <p>
          <span className="font-semibold text-foreground">Interview opt-in:</span>{" "}
          {asBoolean(response.interviewOptIn) ? "Yes" : "No"}
        </p>
        <p>
          <span className="font-semibold text-foreground">Account:</span>{" "}
          {formatCapturedUser(submission)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Follow-up email:</span>{" "}
          {asBoolean(response.interviewOptIn) ? followUpEmail ?? "Account email unavailable" : "No follow-up requested"}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Problem</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-foreground-soft">
            {asString(response.problemText) ?? "No response supplied."}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Already tried</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-foreground-soft">
            {asString(response.attemptedSolutions) ?? "No response supplied."}
          </p>
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} className="bg-[#f3f4ef] text-foreground-soft">
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function FirstHomeQuizCard({ submission }: { submission: QuizSubmissionRecord }) {
  const answers = asRecord(submission.answers);
  const input = asRecord(answers.input);
  const result = asRecord(submission.result);
  const dashboardSnapshot = asRecord(result.dashboardSnapshot);
  const selections = asRecord(dashboardSnapshot.selections);
  const questionResponses = getStoredFirstHomeQuizQuestionResponses({
    answers: submission.answers,
    result: submission.result,
  });

  return (
    <article className="rounded-[1.15rem] border border-border bg-white p-5 shadow-[0_10px_22px_rgba(33,47,37,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>first-home</Badge>
        <Badge className="bg-[#eef4ea] text-foreground-soft">{formatTimestamp(submission.createdAt)}</Badge>
        <Badge className="bg-[#f3f4ef] text-foreground-soft">{titleCase(asString(answers.stage) ?? "tier1")}</Badge>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-foreground-soft md:grid-cols-2">
        <p>
          <span className="font-semibold text-foreground">State:</span>{" "}
          {(asString(input.homeState) ?? "unknown").toUpperCase()}
        </p>
        <p>
          <span className="font-semibold text-foreground">Target price:</span>{" "}
          {formatMaybeCurrency(input.targetPropertyPrice)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Current savings:</span>{" "}
          {formatMaybeCurrency(input.currentSavings)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Active scenario:</span>{" "}
          {titleCase(asString(selections.activeDepositScenario) ?? "baseline-20")}
        </p>
        <p>
          <span className="font-semibold text-foreground">Account:</span> {formatCapturedUser(submission)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Anonymous/session:</span>{" "}
          {(submission.anonymousId ?? "N/A").slice(0, 8)} / {(submission.sessionId ?? "N/A").slice(0, 8)}
        </p>
      </div>

      <details className="mt-4 rounded-[1rem] border border-border bg-[#f8f8f5] p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-foreground">
          <span>Captured question answers</span>
          <Badge className="bg-white text-foreground-soft">{questionResponses.length} saved</Badge>
        </summary>

        <div className="mt-4 grid gap-3">
          {questionResponses.length === 0 ? (
            <p className="text-sm text-foreground-soft">No question-level answers were captured for this submission.</p>
          ) : (
            questionResponses.map((response) => (
              <div key={response.id} className="rounded-[0.9rem] border border-border bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-strong">
                  {response.stage}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{response.prompt}</p>
                <p className="mt-1 text-sm leading-6 text-foreground-soft">{response.answer}</p>
              </div>
            ))
          )}
        </div>
      </details>
    </article>
  );
}

function EventSummary({ events }: { events: ResearchEventRecord[] }) {
  const counts = events.reduce<Record<string, number>>((accumulator, event) => {
    accumulator[event.eventName] = (accumulator[event.eventName] ?? 0) + 1;
    return accumulator;
  }, {});

  const orderedEntries = Object.entries(counts).sort((left, right) => right[1] - left[1]);

  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <CardTitle>Recent event mix</CardTitle>
        <CardText>Event telemetry captured from recent quiz, dashboard, and research interactions.</CardText>
      </div>
      {orderedEntries.length === 0 ? (
        <CardText>No events recorded yet.</CardText>
      ) : (
        <div className="flex flex-wrap gap-2">
          {orderedEntries.map(([eventName, count]) => (
            <Badge key={eventName} className="bg-[#f3f4ef] text-foreground">
              {eventName}: {count}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

export default async function AdminResearchPage() {
  const adminAccess = await getAdminAccessState();
  const passwordConfigured = hasAdminPasswordConfigured();

  if (!adminAccess.authorized) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center px-6 py-10">
        <AdminPasswordGate passwordConfigured={passwordConfigured} />
      </div>
    );
  }

  const repository = getRepository();
  const [submissions, quizSubmissions, events] = await Promise.all([
    repository.listResearchSubmissions({ limit: 50 }),
    repository.listQuizSubmissions({ quizType: "first-home", limit: 50 }),
    repository.listResearchEvents({ limit: 200 }),
  ]);

  const interviewOptIns = submissions.filter((submission) =>
    asBoolean(asRecord(submission.response).interviewOptIn),
  ).length;
  const interviewQualified = submissions.filter((submission) =>
    asBoolean(asRecord(submission.result).interviewQualified),
  ).length;
  const quizCompleted = quizSubmissions.length;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="space-y-3">
        <Badge>Admin</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Research and quiz responses</h1>
        <p className="max-w-3xl text-lg text-foreground-soft">
          Review survey responses, public quiz submissions, and recent telemetry in one place.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-foreground-soft">
            {adminAccess.method === "email"
              ? `Signed in as ${adminAccess.user?.email ?? adminAccess.user?.id}`
              : "Unlocked with the admin password"}
          </p>
          <AdminSessionControls canLock={adminAccess.method === "password"} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Survey responses"
          value={String(submissions.length)}
          note="Recent saved responses from the dashboard and EOI surfaces."
        />
        <MetricCard
          label="Interview opt-ins"
          value={String(interviewOptIns)}
          note="People who asked to be contacted for a short follow-up chat."
        />
        <MetricCard
          label="Qualified chats"
          value={String(interviewQualified)}
          note="Responses with enough detail to count as interview qualified."
        />
        <MetricCard
          label="Quiz completions"
          value={String(quizCompleted)}
          note="Recent persisted public quiz submissions linked to the public first-home flow."
        />
      </section>

      <EventSummary events={events} />

      <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="space-y-2">
            <CardTitle>Recent survey submissions</CardTitle>
            <CardText>
              Stored in Supabase as `ResearchSubmission` records. Follow-up emails are included when a respondent opted
              in.
            </CardText>
          </div>
          <div className="grid gap-4">
            {submissions.length === 0 ? (
              <CardText>No survey submissions yet.</CardText>
            ) : (
              submissions.map((submission) => (
                <SurveySubmissionCard key={submission.id} submission={submission} />
              ))
            )}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="space-y-2">
            <CardTitle>Recent first-home quiz submissions</CardTitle>
            <CardText>
              These are the public `/First-Home-Quiz` completions now being persisted to Supabase for later review.
            </CardText>
          </div>
          <div className="grid gap-4">
            {quizSubmissions.length === 0 ? (
              <CardText>No public quiz submissions yet.</CardText>
            ) : (
              quizSubmissions.map((submission) => (
                <FirstHomeQuizCard key={submission.id} submission={submission} />
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
