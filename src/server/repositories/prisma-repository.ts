import { Prisma, PrismaClient } from "@prisma/client";
import type {
  BankImportRecord,
  BookmarkRecord,
  CsvImportResult,
  ProgressEntryRecord,
  ProgressKind,
  QuizSubmissionRecord,
  ReadinessReportModel,
  SavedScenarioRecord,
  SubscriptionRecord,
} from "@/src/lib/types";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}

export class PrismaRepository {
  private readonly prisma = getPrismaClient();

  private toJson(value: unknown) {
    return value as Prisma.InputJsonValue;
  }

  private mapProgress(entry: {
    id: string;
    userId: string;
    kind: string;
    key: string;
    value: Prisma.JsonValue;
    completed: boolean;
    updatedAt: Date;
  }): ProgressEntryRecord {
    return {
      id: entry.id,
      userId: entry.userId,
      kind: entry.kind as ProgressKind,
      key: entry.key,
      value: (entry.value ?? {}) as Record<string, unknown>,
      completed: entry.completed,
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private mapBookmark(entry: {
    id: string;
    userId: string;
    slug: string;
    label: string;
    createdAt: Date;
  }): BookmarkRecord {
    return {
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  private mapBankImport(entry: {
    id: string;
    userId: string;
    fileName: string;
    rowCount: number;
    summary: Prisma.JsonValue;
    createdAt: Date;
  }): BankImportRecord {
    return {
      ...entry,
      summary: entry.summary as CsvImportResult,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  private mapScenario(entry: {
    id: string;
    userId: string;
    name: string;
    inputs: Prisma.JsonValue;
    outputs: Prisma.JsonValue;
    report: Prisma.JsonValue;
    updatedAt: Date;
  }): SavedScenarioRecord {
    return {
      id: entry.id,
      userId: entry.userId,
      name: entry.name,
      inputs: entry.inputs as Record<string, unknown>,
      outputs: entry.outputs as Record<string, unknown>,
      report: entry.report as ReadinessReportModel,
      updatedAt: entry.updatedAt.toISOString(),
    };
  }

  private mapSubscription(entry: {
    id: string;
    userId: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    priceId: string | null;
    currentPeriodEnd: Date | null;
  }): SubscriptionRecord {
    return {
      id: entry.id,
      userId: entry.userId,
      status: entry.status as SubscriptionRecord["status"],
      stripeCustomerId: entry.stripeCustomerId,
      stripeSubscriptionId: entry.stripeSubscriptionId,
      priceId: entry.priceId,
      currentPeriodEnd: entry.currentPeriodEnd ? entry.currentPeriodEnd.toISOString() : null,
    };
  }

  async listProgress(userId: string) {
    const entries = await this.prisma.progressEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return entries.map((entry) => this.mapProgress(entry));
  }

  async upsertProgress(input: {
    userId: string;
    kind: ProgressKind;
    key: string;
    value: Record<string, unknown>;
    completed: boolean;
  }) {
    const entry = await this.prisma.progressEntry.upsert({
      where: {
        userId_kind_key: {
          userId: input.userId,
          kind: input.kind,
          key: input.key,
        },
      },
      update: {
        value: this.toJson(input.value),
        completed: input.completed,
      },
      create: {
        ...input,
        value: this.toJson(input.value),
      },
    });
    return this.mapProgress(entry);
  }

  async listBookmarks(userId: string) {
    const entries = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return entries.map((entry) => this.mapBookmark(entry));
  }

  async toggleBookmark(input: { userId: string; slug: string; label: string }) {
    const existing = await this.prisma.bookmark.findFirst({
      where: {
        userId: input.userId,
        slug: input.slug,
      },
    });

    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return this.listBookmarks(input.userId);
    }

    await this.prisma.bookmark.create({
      data: input,
    });
    return this.listBookmarks(input.userId);
  }

  async saveQuizSubmission(input: {
    userId: string;
    quizType: QuizSubmissionRecord["quizType"];
    answers: Record<string, unknown>;
    result: Record<string, unknown>;
  }) {
    const entry = await this.prisma.quizSubmission.create({
      data: {
        ...input,
        answers: this.toJson(input.answers),
        result: this.toJson(input.result),
      },
    });
    return {
      ...entry,
      answers: entry.answers as Record<string, unknown>,
      result: entry.result as Record<string, unknown>,
      quizType: entry.quizType as QuizSubmissionRecord["quizType"],
      createdAt: entry.createdAt.toISOString(),
    };
  }

  async listSavedScenarios(userId: string) {
    const entries = await this.prisma.savedScenario.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return entries.map((entry) => this.mapScenario(entry));
  }

  async saveScenario(input: {
    userId: string;
    name: string;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    report: ReadinessReportModel;
  }) {
    const entry = await this.prisma.savedScenario.create({
      data: {
        ...input,
        inputs: this.toJson(input.inputs),
        outputs: this.toJson(input.outputs),
        report: this.toJson(input.report),
      },
    });
    return this.mapScenario(entry);
  }

  async saveBankImport(input: { userId: string; fileName: string; summary: CsvImportResult }) {
    const created = await this.prisma.bankImport.create({
      data: {
        userId: input.userId,
        fileName: input.fileName,
        rowCount: input.summary.rows.length,
        summary: this.toJson(input.summary),
      },
    });

    if (input.summary.rows.length > 0) {
      await this.prisma.importedTransaction.createMany({
        data: input.summary.rows.map((row) => ({
          bankImportId: created.id,
          date: new Date(row.date),
          description: row.description,
          amount: row.amount,
          direction: row.direction,
          category: row.category,
          rawCategory: row.rawCategory,
          notes: row.notes,
        })),
      });
    }

    return this.mapBankImport(created);
  }

  async getLatestBankImport(userId: string) {
    const entry = await this.prisma.bankImport.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return entry ? this.mapBankImport(entry) : null;
  }

  async getSubscription(userId: string): Promise<SubscriptionRecord> {
    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    return existing
      ? this.mapSubscription(existing)
      : {
          id: crypto.randomUUID(),
          userId,
          status: "inactive",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          priceId: null,
          currentPeriodEnd: null,
        };
  }

  async setSubscription(input: {
    userId: string;
    status: SubscriptionRecord["status"];
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    priceId?: string | null;
    currentPeriodEnd?: string | null;
  }) {
    const entry = await this.prisma.subscription.upsert({
      where: { userId: input.userId },
      update: {
        status: input.status,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        priceId: input.priceId ?? null,
        currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
      },
      create: {
        userId: input.userId,
        status: input.status,
        stripeCustomerId: input.stripeCustomerId ?? null,
        stripeSubscriptionId: input.stripeSubscriptionId ?? null,
        priceId: input.priceId ?? null,
        currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null,
      },
    });
    return this.mapSubscription(entry);
  }
}
