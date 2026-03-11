import { isMemoryMode } from "@/src/lib/demo-mode";
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
import { MemoryRepository } from "@/src/server/repositories/memory-repository";
import { PrismaRepository } from "@/src/server/repositories/prisma-repository";

export type AppRepository = {
  listProgress(userId: string): Promise<ProgressEntryRecord[]>;
  upsertProgress(input: {
    userId: string;
    kind: ProgressKind;
    key: string;
    value: Record<string, unknown>;
    completed: boolean;
  }): Promise<ProgressEntryRecord>;
  listBookmarks(userId: string): Promise<BookmarkRecord[]>;
  toggleBookmark(input: {
    userId: string;
    slug: string;
    label: string;
  }): Promise<BookmarkRecord[]>;
  saveQuizSubmission(input: {
    userId: string;
    quizType: QuizSubmissionRecord["quizType"];
    answers: Record<string, unknown>;
    result: Record<string, unknown>;
  }): Promise<QuizSubmissionRecord>;
  saveResearchSubmission(input: {
    userId?: string | null;
    anonymousId: string;
    sessionId: string;
    surface: ResearchSubmissionSurface;
    promptVersion: string;
    response: Record<string, unknown>;
    result: Record<string, unknown>;
  }): Promise<ResearchSubmissionRecord>;
  saveResearchEvent(input: {
    userId?: string | null;
    anonymousId: string;
    sessionId: string;
    surface: ResearchEventRecord["surface"];
    eventName: ResearchEventName;
    properties?: Record<string, unknown>;
  }): Promise<ResearchEventRecord>;
  listSavedScenarios(userId: string): Promise<SavedScenarioRecord[]>;
  saveScenario(input: {
    userId: string;
    name: string;
    inputs: Record<string, unknown>;
    outputs: Record<string, unknown>;
    report: ReadinessReportModel;
  }): Promise<SavedScenarioRecord>;
  saveBankImport(input: {
    userId: string;
    fileName: string;
    summary: CsvImportResult;
  }): Promise<BankImportRecord>;
  getLatestBankImport(userId: string): Promise<BankImportRecord | null>;
  getSubscription(userId: string): Promise<SubscriptionRecord>;
  setSubscription(input: {
    userId: string;
    status: SubscriptionRecord["status"];
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    priceId?: string | null;
    currentPeriodEnd?: string | null;
  }): Promise<SubscriptionRecord>;
};

let prismaRepository: PrismaRepository | null = null;
let memoryRepository: MemoryRepository | null = null;

export function getRepository(): AppRepository {
  if (isMemoryMode()) {
    memoryRepository ??= new MemoryRepository();
    return memoryRepository;
  }

  prismaRepository ??= new PrismaRepository();
  return prismaRepository;
}
