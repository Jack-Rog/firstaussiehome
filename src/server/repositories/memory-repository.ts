import type {
  BankImportRecord,
  BookmarkRecord,
  CsvImportResult,
  ProgressEntryRecord,
  ProgressKind,
  QuizSubmissionRecord,
  ResearchEventName,
  ResearchEventRecord,
  ResearchSubmissionRecord,
  ResearchSubmissionSurface,
  ReadinessReportModel,
  SavedScenarioRecord,
  SubscriptionRecord,
} from "@/src/lib/types";

function id() {
  return crypto.randomUUID();
}

type Store = {
  progress: ProgressEntryRecord[];
  bookmarks: BookmarkRecord[];
  quizSubmissions: QuizSubmissionRecord[];
  researchSubmissions: ResearchSubmissionRecord[];
  researchEvents: ResearchEventRecord[];
  scenarios: SavedScenarioRecord[];
  bankImports: BankImportRecord[];
  subscriptions: SubscriptionRecord[];
};

function createSeedStore(): Store {
  const demoUser = "demo-user";
  const demoReport: ReadinessReportModel = {
    snapshot: ["Seeded demo report for the modelling dashboard."],
    assumptions: ["Uses demonstration-only seeded data."],
    scenarioRanges: ["5% target range remains illustrative only."],
    schemeIndicators: ["Review official scheme pages for current details."],
    missingInformation: ["A real property range is not yet entered."],
    professionalQuestions: ["Which assumptions need updating if the income pattern changes?"],
    generatedAt: new Date().toISOString(),
  };
  const demoImport: CsvImportResult = {
    rows: [],
    totals: {
      income: 9000,
      outgoings: 5300,
      estimatedMonthlyCapacity: 1233,
    },
    categories: {
      housing: 2100,
      transport: 320,
      groceries: 780,
      dining: 290,
      utilities: 240,
      subscriptions: 90,
      health: 110,
      education: 0,
      income: 9000,
      transfers: 1370,
      uncategorized: 0,
    },
    assumptions: ["Seeded demo CSV import"],
    warnings: [],
  };

  return {
    progress: [
      {
        id: id(),
        userId: demoUser,
        kind: "path",
        key: "first-home-roadmap-nsw",
        value: { completedItems: 3, totalItems: 10 },
        completed: false,
        updatedAt: new Date().toISOString(),
      },
    ],
    bookmarks: [
      {
        id: id(),
        userId: demoUser,
        slug: "deposit-basics",
        label: "Deposit basics",
        createdAt: new Date().toISOString(),
      },
    ],
    quizSubmissions: [],
    researchSubmissions: [],
    researchEvents: [],
    scenarios: [
      {
        id: id(),
        userId: demoUser,
        name: "Starter deposit range",
        inputs: { targetPropertyPrice: 700000, currentSavings: 40000, monthlySavings: 1800 },
        outputs: { depositTarget: "5%-20%" },
        report: demoReport,
        updatedAt: new Date().toISOString(),
      },
    ],
    bankImports: [
      {
        id: id(),
        userId: demoUser,
        fileName: "transactions-simple.csv",
        rowCount: 8,
        summary: demoImport,
        createdAt: new Date().toISOString(),
      },
    ],
    subscriptions: [
      {
        id: id(),
        userId: demoUser,
        status: "inactive",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        priceId: "price_demo",
        currentPeriodEnd: null,
      },
    ],
  };
}

export class MemoryRepository {
  private readonly store = createSeedStore();

  async listProgress(userId: string) {
    return this.store.progress.filter((entry) => entry.userId === userId);
  }

  async upsertProgress(input: {
    userId: string;
    kind: ProgressKind;
    key: string;
    value: Record<string, unknown>;
    completed: boolean;
  }) {
    const existing = this.store.progress.find(
      (entry) => entry.userId === input.userId && entry.kind === input.kind && entry.key === input.key,
    );

    if (existing) {
      existing.value = input.value;
      existing.completed = input.completed;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const created: ProgressEntryRecord = {
      id: id(),
      updatedAt: new Date().toISOString(),
      ...input,
    };
    this.store.progress.push(created);
    return created;
  }

  async listBookmarks(userId: string) {
    return this.store.bookmarks.filter((entry) => entry.userId === userId);
  }

  async toggleBookmark(input: { userId: string; slug: string; label: string }) {
    const existing = this.store.bookmarks.find(
      (entry) => entry.userId === input.userId && entry.slug === input.slug,
    );

    if (existing) {
      this.store.bookmarks = this.store.bookmarks.filter((entry) => entry.id !== existing.id);
      return this.listBookmarks(input.userId);
    }

    this.store.bookmarks.push({
      id: id(),
      createdAt: new Date().toISOString(),
      ...input,
    });
    return this.listBookmarks(input.userId);
  }

  async listQuizSubmissions(input?: {
    quizType?: QuizSubmissionRecord["quizType"];
    anonymousId?: string | null;
    sessionId?: string | null;
    limit?: number;
  }) {
    const entries = [...this.store.quizSubmissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const filtered = entries
      .filter((entry) => (input?.quizType ? entry.quizType === input.quizType : true))
      .filter((entry) => (input?.anonymousId ? entry.anonymousId === input.anonymousId : true))
      .filter((entry) => (input?.sessionId ? entry.sessionId === input.sessionId : true));
    return typeof input?.limit === "number" ? filtered.slice(0, input.limit) : filtered;
  }

  async saveQuizSubmission(input: {
    userId?: string | null;
    anonymousId?: string | null;
    sessionId?: string | null;
    quizType: QuizSubmissionRecord["quizType"];
    answers: Record<string, unknown>;
    result: Record<string, unknown>;
  }) {
    const created: QuizSubmissionRecord = {
      id: id(),
      createdAt: new Date().toISOString(),
      userId: input.userId ?? null,
      userEmail: null,
      userName: null,
      anonymousId: input.anonymousId ?? null,
      sessionId: input.sessionId ?? null,
      quizType: input.quizType,
      answers: input.answers,
      result: input.result,
    };
    this.store.quizSubmissions.push(created);
    return created;
  }

  async listResearchSubmissions(input?: { limit?: number }) {
    const entries = [...this.store.researchSubmissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return typeof input?.limit === "number" ? entries.slice(0, input.limit) : entries;
  }

  async saveResearchSubmission(input: {
    userId?: string | null;
    anonymousId: string;
    sessionId: string;
    surface: ResearchSubmissionSurface;
    promptVersion: string;
    response: Record<string, unknown>;
    result: Record<string, unknown>;
  }) {
    const created: ResearchSubmissionRecord = {
      id: id(),
      createdAt: new Date().toISOString(),
      userId: input.userId ?? null,
      userEmail: null,
      userName: null,
      anonymousId: input.anonymousId,
      sessionId: input.sessionId,
      surface: input.surface,
      promptVersion: input.promptVersion,
      response: input.response,
      result: input.result,
    };
    this.store.researchSubmissions.push(created);
    return created;
  }

  async listResearchEvents(input?: {
    limit?: number;
    surface?: ResearchEventRecord["surface"];
    eventName?: ResearchEventName;
  }) {
    const entries = [...this.store.researchEvents]
      .filter((entry) => (input?.surface ? entry.surface === input.surface : true))
      .filter((entry) => (input?.eventName ? entry.eventName === input.eventName : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return typeof input?.limit === "number" ? entries.slice(0, input.limit) : entries;
  }

  async saveResearchEvent(input: {
    userId?: string | null;
    anonymousId: string;
    sessionId: string;
    surface: ResearchEventRecord["surface"];
    eventName: ResearchEventName;
    properties?: Record<string, unknown>;
  }) {
    const created: ResearchEventRecord = {
      id: id(),
      createdAt: new Date().toISOString(),
      userId: input.userId ?? null,
      userEmail: null,
      userName: null,
      anonymousId: input.anonymousId,
      sessionId: input.sessionId,
      surface: input.surface,
      eventName: input.eventName,
      properties: input.properties ?? {},
    };
    this.store.researchEvents.push(created);
    return created;
  }

  async listSavedScenarios(userId: string) {
    return this.store.scenarios.filter((entry) => entry.userId === userId);
  }

  async saveScenario(input: {
    userId: string;
    name: string;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    report: ReadinessReportModel;
  }) {
    const created: SavedScenarioRecord = {
      id: id(),
      updatedAt: new Date().toISOString(),
      ...input,
    };
    this.store.scenarios.unshift(created);
    return created;
  }

  async saveBankImport(input: { userId: string; fileName: string; summary: CsvImportResult }) {
    const created: BankImportRecord = {
      id: id(),
      rowCount: input.summary.rows.length,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.store.bankImports.unshift(created);
    return created;
  }

  async getLatestBankImport(userId: string) {
    return this.store.bankImports.find((entry) => entry.userId === userId) ?? null;
  }

  async getSubscription(userId: string) {
    return (
      this.store.subscriptions.find((entry) => entry.userId === userId) ?? {
        id: id(),
        userId,
        status: "inactive",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        priceId: null,
        currentPeriodEnd: null,
      }
    );
  }

  async setSubscription(input: {
    userId: string;
    status: SubscriptionRecord["status"];
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    priceId?: string | null;
    currentPeriodEnd?: string | null;
  }) {
    const existing = this.store.subscriptions.find((entry) => entry.userId === input.userId);

    if (existing) {
      existing.status = input.status;
      existing.stripeCustomerId = input.stripeCustomerId ?? null;
      existing.stripeSubscriptionId = input.stripeSubscriptionId ?? null;
      existing.priceId = input.priceId ?? null;
      existing.currentPeriodEnd = input.currentPeriodEnd ?? null;
      return existing;
    }

    const created: SubscriptionRecord = {
      id: id(),
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      priceId: input.priceId ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null,
      ...input,
    };
    this.store.subscriptions.push(created);
    return created;
  }
}
