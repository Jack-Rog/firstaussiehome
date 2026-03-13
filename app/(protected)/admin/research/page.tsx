import { AdminPasswordGate } from "@/components/admin/admin-password-gate";
import { AdminSessionControls } from "@/components/admin/admin-session-controls";
import { hasAdminPasswordConfigured } from "@/src/lib/admin";
import { getStoredFirstHomeQuizQuestionResponses, type FirstHomeQuizQuestionResponse } from "@/src/lib/first-home-quiz";
import { getAdminAccessState } from "@/src/lib/route-guards";
import type { QuizSubmissionRecord, ResearchEventRecord, ResearchSubmissionRecord } from "@/src/lib/types";
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

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSessionKey(input: { id: string; anonymousId?: string | null; sessionId?: string | null }) {
  return input.sessionId || input.anonymousId || input.id;
}

function countUniqueSessions<T extends { id: string; anonymousId?: string | null; sessionId?: string | null }>(entries: T[]) {
  return new Set(entries.map((entry) => getSessionKey(entry))).size;
}

function formatPercent(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function average(values: number[]) {
  if (values.length === 0) {
    return "0.0";
  }

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function buildDistribution(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) {
      continue;
    }

    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildQuestionDistributions(quizSubmissions: QuizSubmissionRecord[]) {
  const order = new Map<string, number>();
  const grouped = new Map<
    string,
    {
      id: string;
      prompt: string;
      stage: string;
      total: number;
      answers: Map<string, number>;
    }
  >();

  for (const submission of quizSubmissions) {
    const questionResponses = getStoredFirstHomeQuizQuestionResponses({
      answers: submission.answers,
      result: submission.result,
    });

    for (const response of questionResponses) {
      if (!order.has(response.id)) {
        order.set(response.id, order.size);
      }

      const existing =
        grouped.get(response.id) ??
        {
          id: response.id,
          prompt: response.prompt,
          stage: response.stage,
          total: 0,
          answers: new Map<string, number>(),
        };

      existing.total += 1;
      existing.answers.set(response.answer, (existing.answers.get(response.answer) ?? 0) + 1);
      grouped.set(response.id, existing);
    }
  }

  return [...grouped.values()]
    .sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0))
    .map((question) => ({
      ...question,
      answers: [...question.answers.entries()]
        .map(([label, count]) => ({
          label,
          count,
          share: formatPercent(count, question.total),
        }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    }));
}

function findQuestionAnswer(questionResponses: FirstHomeQuizQuestionResponse[], id: string) {
  return questionResponses.find((response) => response.id === id)?.answer ?? "N/A";
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-soft">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-foreground">{value}</div>
      <p className="mt-2 text-sm text-foreground-soft">{note}</p>
    </div>
  );
}

function DistributionTable({
  title,
  subtitle,
  entries,
}: {
  title: string;
  subtitle: string;
  entries: Array<{ label: string; count: number }>;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-foreground-soft">{subtitle}</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-foreground-soft">
              <th className="px-2 py-2 font-medium">Value</th>
              <th className="px-2 py-2 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td className="px-2 py-3 text-foreground-soft" colSpan={2}>
                  No data yet.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.label} className="border-b border-border/70 last:border-b-0">
                  <td className="px-2 py-3">{entry.label}</td>
                  <td className="px-2 py-3 font-semibold">{entry.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
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
  const [surveySubmissions, quizSubmissions, events] = await Promise.all([
    repository.listResearchSubmissions({ limit: 250 }),
    repository.listQuizSubmissions({ quizType: "first-home", limit: 250 }),
    repository.listResearchEvents({ limit: 1000 }),
  ]);

  const dashboardSurveySubmissions = surveySubmissions.filter((submission) => submission.surface === "dashboard");
  const quizStartEvents = events.filter((event) => event.eventName === "quiz_started");
  const quizCompletionEvents = events.filter((event) => event.eventName === "quiz_completed");
  const dashboardViewEvents = events.filter((event) => event.eventName === "dashboard_viewed");
  const dashboardResearchStartEvents = events.filter(
    (event) => event.surface === "dashboard" && event.eventName === "research_started",
  );

  const uniqueQuizStarts = countUniqueSessions(quizStartEvents);
  const uniqueQuizCompletions = countUniqueSessions(quizCompletionEvents);
  const uniqueDashboardViews = countUniqueSessions(dashboardViewEvents);
  const uniqueSurveyStarts = countUniqueSessions(dashboardResearchStartEvents);
  const uniqueSurveySubmissions = countUniqueSessions(dashboardSurveySubmissions);

  const linkedQuizCount = dashboardSurveySubmissions.filter(
    (submission) => asString(asRecord(asRecord(submission.result).linkedQuiz).submissionId) !== null,
  ).length;
  const interviewOptInCount = dashboardSurveySubmissions.filter((submission) =>
    asBoolean(asRecord(submission.response).interviewOptIn),
  ).length;
  const followUpEmailsCollected = dashboardSurveySubmissions.filter((submission) =>
    asString(asRecord(submission.response).followUpEmail),
  ).length;
  const qualifiedResearchCount = dashboardSurveySubmissions.filter((submission) =>
    asBoolean(asRecord(submission.result).interviewQualified),
  ).length;
  const slowdownValues = dashboardSurveySubmissions
    .map((submission) => asNumber(asRecord(submission.response).slowdownLevel))
    .filter((value): value is number => value !== null);
  const confidenceValues = dashboardSurveySubmissions
    .map((submission) => asNumber(asRecord(submission.response).confidenceLevel))
    .filter((value): value is number => value !== null);

  const questionDistributions = buildQuestionDistributions(quizSubmissions);
  const blockerCategoryDistribution = buildDistribution(
    dashboardSurveySubmissions.map((submission) => {
      const category = asString(asRecord(submission.response).category);
      return category ? titleCase(category) : null;
    }),
  );
  const timeStuckDistribution = buildDistribution(
    dashboardSurveySubmissions.map((submission) => {
      const value = asString(asRecord(submission.response).timeStuck);
      return value ? titleCase(value) : null;
    }),
  );
  const buyTimelineDistribution = buildDistribution(
    dashboardSurveySubmissions.map((submission) => {
      const value = asString(asRecord(submission.response).buyTimeline);
      return value ? titleCase(value) : null;
    }),
  );

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-6 py-8">
      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-soft">Admin / research</div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Quiz analytics and survey responses</h1>
        <p className="text-sm text-foreground-soft">
          {adminAccess.method === "email"
            ? `Signed in as ${adminAccess.user?.email ?? adminAccess.user?.id}`
            : "Unlocked with the admin password"}
        </p>
        <AdminSessionControls canLock={adminAccess.method === "password"} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Quiz start rate"
          value={`${uniqueQuizStarts}`}
          note={`${uniqueQuizCompletions} completions, ${formatPercent(uniqueQuizCompletions, uniqueQuizStarts)} completion rate`}
        />
        <MetricCard
          label="Dashboard engagement"
          value={`${uniqueDashboardViews}`}
          note={`${formatPercent(uniqueDashboardViews, uniqueQuizCompletions)} of completers reached the dashboard`}
        />
        <MetricCard
          label="Survey conversion"
          value={`${uniqueSurveySubmissions}`}
          note={`${formatPercent(uniqueSurveySubmissions, uniqueQuizCompletions)} of quiz completers submitted the dashboard survey`}
        />
        <MetricCard
          label="Interview leads"
          value={`${interviewOptInCount}`}
          note={`${followUpEmailsCollected} emails captured, ${qualifiedResearchCount} qualified responses`}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Survey starts"
          value={`${uniqueSurveyStarts}`}
          note={`${formatPercent(uniqueSurveySubmissions, uniqueSurveyStarts)} submit rate once the form is started`}
        />
        <MetricCard
          label="Linked quiz rows"
          value={`${linkedQuizCount}`}
          note={`${formatPercent(linkedQuizCount, dashboardSurveySubmissions.length)} of dashboard surveys have a linked quiz payload`}
        />
        <MetricCard
          label="Average slowdown"
          value={average(slowdownValues)}
          note="Mean self-reported friction score from dashboard surveys"
        />
        <MetricCard
          label="Average confidence"
          value={average(confidenceValues)}
          note="Mean self-reported confidence score from dashboard surveys"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DistributionTable
          title="Top blocker categories"
          subtitle="What users say they are struggling with most often"
          entries={blockerCategoryDistribution}
        />
        <DistributionTable
          title="How long people have been stuck"
          subtitle="Useful for validating urgency and depth of pain"
          entries={timeStuckDistribution}
        />
        <DistributionTable
          title="Buying timeline distribution"
          subtitle="Shows whether the current audience is near-term or exploratory"
          entries={buyTimelineDistribution}
        />
      </section>

      <section className="rounded-lg border border-border bg-white p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Quiz answer distributions</h2>
          <p className="text-sm text-foreground-soft">
            Counts below come from persisted `/First-Home-Quiz` submissions and show how each question is being answered.
          </p>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {questionDistributions.length === 0 ? (
            <p className="text-sm text-foreground-soft">No quiz submissions yet.</p>
          ) : (
            questionDistributions.map((question) => (
              <div key={question.id} className="rounded-lg border border-border bg-[#fbfbf9] p-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-soft">
                    {question.stage}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{question.prompt}</h3>
                  <p className="text-sm text-foreground-soft">{question.total} captured answers</p>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-foreground-soft">
                        <th className="px-2 py-2 font-medium">Answer</th>
                        <th className="px-2 py-2 font-medium">Count</th>
                        <th className="px-2 py-2 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {question.answers.map((answer) => (
                        <tr key={`${question.id}-${answer.label}`} className="border-b border-border/70 last:border-b-0">
                          <td className="px-2 py-3">{answer.label}</td>
                          <td className="px-2 py-3 font-semibold">{answer.count}</td>
                          <td className="px-2 py-3">{answer.share}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-white p-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Survey response table</h2>
          <p className="text-sm text-foreground-soft">
            One row per dashboard survey response. Scroll sideways to review the linked quiz context, opt-in email, and
            response detail together.
          </p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-foreground-soft">
                <th className="px-2 py-2 font-medium">Submitted</th>
                <th className="px-2 py-2 font-medium">Opt in</th>
                <th className="px-2 py-2 font-medium">Follow-up email</th>
                <th className="px-2 py-2 font-medium">Category</th>
                <th className="px-2 py-2 font-medium">Time stuck</th>
                <th className="px-2 py-2 font-medium">Timeline</th>
                <th className="px-2 py-2 font-medium">Slowdown</th>
                <th className="px-2 py-2 font-medium">Confidence</th>
                <th className="px-2 py-2 font-medium">Detail band</th>
                <th className="px-2 py-2 font-medium">Linked quiz</th>
                <th className="px-2 py-2 font-medium">Linked state</th>
                <th className="px-2 py-2 font-medium">Linked target price</th>
                <th className="px-2 py-2 font-medium">Linked savings</th>
                <th className="px-2 py-2 font-medium">Problem</th>
                <th className="px-2 py-2 font-medium">Already tried</th>
              </tr>
            </thead>
            <tbody>
              {dashboardSurveySubmissions.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-foreground-soft" colSpan={15}>
                    No dashboard survey responses yet.
                  </td>
                </tr>
              ) : (
                dashboardSurveySubmissions.map((submission) => {
                  const response = asRecord(submission.response);
                  const result = asRecord(submission.result);
                  const linkedQuiz = asRecord(result.linkedQuiz);
                  const questionResponses = Array.isArray(linkedQuiz.questionResponses)
                    ? (linkedQuiz.questionResponses as FirstHomeQuizQuestionResponse[])
                    : [];

                  return (
                    <tr key={submission.id} className="border-b border-border/70 align-top last:border-b-0">
                      <td className="px-2 py-3">{formatTimestamp(submission.createdAt)}</td>
                      <td className="px-2 py-3">{asBoolean(response.interviewOptIn) ? "Yes" : "No"}</td>
                      <td className="px-2 py-3">{asString(response.followUpEmail) ?? "N/A"}</td>
                      <td className="px-2 py-3">{titleCase(asString(response.category) ?? "unknown")}</td>
                      <td className="px-2 py-3">{titleCase(asString(response.timeStuck) ?? "unknown")}</td>
                      <td className="px-2 py-3">{titleCase(asString(response.buyTimeline) ?? "unknown")}</td>
                      <td className="px-2 py-3">{asNumber(response.slowdownLevel) ?? "N/A"}</td>
                      <td className="px-2 py-3">{asNumber(response.confidenceLevel) ?? "N/A"}</td>
                      <td className="px-2 py-3">{titleCase(asString(result.detailBand) ?? "unknown")}</td>
                      <td className="px-2 py-3">{asString(linkedQuiz.submissionId) ?? "Missing"}</td>
                      <td className="px-2 py-3">{findQuestionAnswer(questionResponses, "homeState")}</td>
                      <td className="px-2 py-3">{findQuestionAnswer(questionResponses, "targetPropertyPrice")}</td>
                      <td className="px-2 py-3">{findQuestionAnswer(questionResponses, "currentSavings")}</td>
                      <td className="max-w-[340px] px-2 py-3 whitespace-pre-wrap">{asString(response.problemText) ?? "N/A"}</td>
                      <td className="max-w-[340px] px-2 py-3 whitespace-pre-wrap">
                        {asString(response.attemptedSolutions) ?? "N/A"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
