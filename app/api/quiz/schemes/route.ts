import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";
import { buildSchemeScreeningResult } from "@/src/server/services/quiz-service";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await getCurrentUser();
  const result = buildSchemeScreeningResult(body);

  await getRepository().saveQuizSubmission({
    userId: user?.id ?? null,
    quizType: "schemes",
    answers: body,
    result,
  });

  return NextResponse.json(result);
}
