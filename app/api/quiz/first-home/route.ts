import { NextResponse } from "next/server";
import { z } from "zod";
import { buildDefaultHomeownerPathwaySelections } from "@/src/lib/analysis/homeowner-pathway-defaults";
import { deriveDutyIntakeState } from "@/src/lib/analysis/homeowner-duty-intake";
import {
  buildFirstHomeQuizQuestionResponses,
  sanitizeStoredFirstHomeQuizDisplay,
  sanitizeStoredFirstHomeQuizInput,
} from "@/src/lib/first-home-quiz";
import { buildHomeownerPathwayOutput } from "@/src/lib/analysis/homeowner-pathway-analysis";
import { createHomeownerDashboardSnapshot } from "@/src/lib/homeowner-dashboard-storage";
import type { HomeownerPathwayInput } from "@/src/lib/types";
import { getRepository } from "@/src/server/repositories/repository";

const firstHomeQuizSubmissionSchema = z.object({
  anonymousId: z.string().min(1),
  sessionId: z.string().min(1),
  stage: z.enum(["tier1", "tier2"]),
  input: z.record(z.string(), z.unknown()),
  tier1Answers: z.record(z.string(), z.union([z.boolean(), z.string()])).default({}),
  display: z
    .object({
      targetPropertyPrice: z.string(),
      actHouseholdIncome: z.string(),
      currentSavings: z.string(),
      dependentChildrenCount: z.string(),
    })
    .default({
      targetPropertyPrice: "",
      actHouseholdIncome: "",
      currentSavings: "",
      dependentChildrenCount: "",
    }),
});

export async function POST(request: Request) {
  const body = firstHomeQuizSubmissionSchema.parse(await request.json());
  const input = body.input as HomeownerPathwayInput;
  const selections = buildDefaultHomeownerPathwaySelections(input);
  const preview = buildHomeownerPathwayOutput(input, selections);
  const dutyIntake = deriveDutyIntakeState(input);
  const dashboardSnapshot = createHomeownerDashboardSnapshot(input, selections);
  const questionResponses = buildFirstHomeQuizQuestionResponses({
    input,
    tier1Answers: body.tier1Answers,
    display: body.display,
    visibleTier2Fields: dutyIntake.visibleTier2Fields,
  });
  const storedInput = sanitizeStoredFirstHomeQuizInput({
    input,
    tier1Answers: body.tier1Answers,
    display: body.display,
    visibleTier2Fields: dutyIntake.visibleTier2Fields,
  });
  const storedDisplay = sanitizeStoredFirstHomeQuizDisplay(body.display);

  const submission = await getRepository().saveQuizSubmission({
    userId: null,
    anonymousId: body.anonymousId,
    sessionId: body.sessionId,
    quizType: "first-home",
    answers: {
      stage: body.stage,
      input: storedInput,
      tier1Answers: body.tier1Answers,
      display: storedDisplay,
      questionResponses,
    },
    result: {
      dutyIntake,
      dashboardSnapshot: {
        ...dashboardSnapshot,
        input: storedInput,
      },
      preview,
    },
  });

  return NextResponse.json({
    saved: true,
    submissionId: submission.id,
  });
}
