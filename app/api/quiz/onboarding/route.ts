import { NextResponse } from "next/server";
import { getActiveUserId } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";
import { buildOnboardingResult } from "@/src/server/services/quiz-service";
import { saveProgress } from "@/src/server/services/progress-service";

export async function POST(request: Request) {
  const body = await request.json();
  const userId = await getActiveUserId();
  const result = buildOnboardingResult(body);
  const repository = getRepository();

  await repository.saveQuizSubmission({
    userId,
    quizType: "onboarding",
    answers: body,
    result,
  });

  await saveProgress({
    userId,
    kind: "path",
    key: result.learningPathId,
    value: {
      completedItems: 1,
      totalItems: 4,
    },
    completed: false,
  });

  return NextResponse.json(result);
}
