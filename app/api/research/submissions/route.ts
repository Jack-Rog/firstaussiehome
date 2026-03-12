import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildResearchTags,
  countWords,
  deriveResearchDetailBand,
  RESEARCH_PROMPT_VERSION,
} from "@/src/lib/research";
import type {
  ResearchBuyTimeline,
  ResearchBuyingMode,
  ResearchCareerStage,
  ResearchCategory,
  ResearchIncomeBand,
  ResearchPropertyPriceBand,
  ResearchSavingsBand,
  ResearchState,
  ResearchSubmissionSurface,
  ResearchTimeStuck,
} from "@/src/lib/types";
import { getCurrentUser } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";
import { sendResearchSubmissionAlert } from "@/src/server/services/research-alert-service";

const submissionSchema = z
  .object({
    anonymousId: z.string().min(1),
    sessionId: z.string().min(1),
    surface: z.enum(["dashboard", "eoi"] satisfies [ResearchSubmissionSurface, ...ResearchSubmissionSurface[]]),
    promptVersion: z.string().min(1).default(RESEARCH_PROMPT_VERSION),
    problemText: z.string().trim().min(1),
    attemptedSolutions: z.string().trim().min(1),
    category: z.enum(
      [
        "options-and-schemes",
        "affordability",
        "deposit-and-cash",
        "save-vs-invest-vs-debt",
        "making-a-plan",
        "something-else",
      ] satisfies [ResearchCategory, ...ResearchCategory[]],
    ),
    timeStuck: z.enum(
      ["lt-1-month", "1-3-months", "3-6-months", "gt-6-months"] satisfies [
        ResearchTimeStuck,
        ...ResearchTimeStuck[],
      ],
    ),
    slowdownLevel: z.number().int().min(1).max(5),
    buyTimeline: z.enum(
      ["lt-12-months", "1-2-years", "2-5-years", "not-sure"] satisfies [ResearchBuyTimeline, ...ResearchBuyTimeline[]],
    ),
    confidenceLevel: z.number().int().min(1).max(5),
    interviewOptIn: z.boolean(),
    interviewEmail: z.string().trim().email().nullable().optional(),
    careerStage: z
      .enum(
        [
          "still-studying",
          "0-2-years-working",
          "3-5-years-working",
          "5-plus-years-working",
          "other",
        ] satisfies [ResearchCareerStage, ...ResearchCareerStage[]],
      )
      .nullable()
      .optional(),
    context: z
      .object({
        state: z
          .enum(["nsw", "vic", "qld", "wa", "sa", "tas", "act", "nt", "unknown"] satisfies [
            ResearchState,
            ...ResearchState[],
          ])
          .nullable()
          .optional(),
        incomeBand: z
          .enum(["lt-80k", "80k-120k", "120k-160k", "gt-160k", "unknown"] satisfies [
            ResearchIncomeBand,
            ...ResearchIncomeBand[],
          ])
          .nullable()
          .optional(),
        savingsBand: z
          .enum(["lt-20k", "20k-50k", "50k-100k", "gt-100k", "unknown"] satisfies [
            ResearchSavingsBand,
            ...ResearchSavingsBand[],
          ])
          .nullable()
          .optional(),
        buyingMode: z
          .enum(["solo", "joint", "unknown"] satisfies [ResearchBuyingMode, ...ResearchBuyingMode[]])
          .nullable()
          .optional(),
        propertyPriceBand: z
          .enum(["lt-600k", "600k-800k", "800k-1m", "gt-1m", "unknown"] satisfies [
            ResearchPropertyPriceBand,
            ...ResearchPropertyPriceBand[],
          ])
          .nullable()
          .optional(),
      })
      .partial()
      .nullable()
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.interviewOptIn && !value.interviewEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interviewEmail"],
        message: "Interview email is required when interview opt-in is selected.",
      });
    }
  });

export async function POST(request: Request) {
  const body = submissionSchema.parse(await request.json());
  const user = await getCurrentUser();
  const problemWordCount = countWords(body.problemText);
  const attemptedSolutionsWordCount = countWords(body.attemptedSolutions);
  const detailBand = deriveResearchDetailBand(body.problemText, body.attemptedSolutions);
  const interviewQualified = body.interviewOptIn && detailBand !== "thin";
  const tags = buildResearchTags({
    surface: body.surface,
    category: body.category,
    timeStuck: body.timeStuck,
    slowdownLevel: body.slowdownLevel,
    buyTimeline: body.buyTimeline,
    confidenceLevel: body.confidenceLevel,
    interviewOptIn: body.interviewOptIn,
    detailBand,
    careerStage: body.careerStage ?? null,
    context: body.context ?? null,
  });

  const result = {
    promptVersion: body.promptVersion,
    problemWordCount,
    attemptedSolutionsWordCount,
    detailBand,
    interviewQualified,
    trackedAt: new Date().toISOString(),
    tags,
  };

  const submission = await getRepository().saveResearchSubmission({
    userId: user?.id ?? null,
    anonymousId: body.anonymousId,
    sessionId: body.sessionId,
    surface: body.surface,
    promptVersion: body.promptVersion,
    response: {
      problemText: body.problemText,
      attemptedSolutions: body.attemptedSolutions,
      category: body.category,
      timeStuck: body.timeStuck,
      slowdownLevel: body.slowdownLevel,
      buyTimeline: body.buyTimeline,
      confidenceLevel: body.confidenceLevel,
      interviewOptIn: body.interviewOptIn,
      interviewEmail: body.interviewEmail ?? null,
      careerStage: body.careerStage ?? null,
      context: body.context ?? null,
    },
    result,
  });

  try {
    await sendResearchSubmissionAlert(submission);
  } catch (error) {
    console.error("Failed to send research submission alert", error);
  }

  return NextResponse.json({
    saved: true,
    submissionId: submission.id,
    detailBand,
    interviewQualified,
    tags,
  });
}
