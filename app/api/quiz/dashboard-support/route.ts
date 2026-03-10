import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { isMemoryMode } from "@/src/lib/demo-mode";
import { getActiveUserId } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";

const CHALLENGE_LABELS = {
  "deposit-need": "Figuring out how much deposit I actually need",
  "saving-consistently": "Saving consistently for the deposit",
  "invest-or-save": "Deciding whether to invest or save",
  "debt-vs-saving": "Paying off debt vs saving",
  "understanding-schemes": "Understanding government schemes",
  "affordable-price-range": "Knowing what price range I can afford",
  "long-term-plan": "Building a long-term financial plan",
  "something-else": "Something else",
} as const;

type ChallengeKey = keyof typeof CHALLENGE_LABELS;

const VALID_CHALLENGES = new Set<ChallengeKey>(Object.keys(CHALLENGE_LABELS) as ChallengeKey[]);
const VALID_FRUSTRATION = new Set([1, 2, 3, 4, 5]);

let prisma: PrismaClient | null = null;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

function toChallengeKey(value: unknown): ChallengeKey | null {
  if (typeof value !== "string") {
    return null;
  }

  return VALID_CHALLENGES.has(value as ChallengeKey) ? (value as ChallengeKey) : null;
}

function toFrustrationLevel(value: unknown): 1 | 2 | 3 | 4 | 5 | null {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }

  return VALID_FRUSTRATION.has(value) ? (value as 1 | 2 | 3 | 4 | 5) : null;
}

function frustrationBand(level: 1 | 2 | 3 | 4 | 5 | null) {
  if (!level) {
    return "unknown";
  }

  if (level <= 2) {
    return "minor";
  }

  if (level === 3) {
    return "moderate";
  }

  return "high";
}

async function ensureAnonymousUser(userId: string) {
  if (isMemoryMode() || userId !== "anonymous-user") {
    return;
  }

  await getPrismaClient().user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: "Anonymous Quiz User",
      email: null,
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    challenge?: unknown;
    frustrationLevel?: unknown;
    name?: unknown;
    email?: unknown;
    comment?: unknown;
    sourcePage?: unknown;
  };

  const challenge = toChallengeKey(body.challenge);
  const frustrationLevel = toFrustrationLevel(body.frustrationLevel);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const comment = typeof body.comment === "string" ? body.comment.trim() : "";
  const sourcePage = typeof body.sourcePage === "string" ? body.sourcePage : "unknown";
  const challengeLabel = challenge ? CHALLENGE_LABELS[challenge] : "";
  const userId = await getActiveUserId();

  const tags = [
    `challenge:${challenge ?? "none"}`,
    `challenge_label:${challengeLabel || "none"}`,
    `frustration:${frustrationLevel ?? "none"}`,
    `frustration_band:${frustrationBand(frustrationLevel)}`,
    `name_provided:${name.length > 0}`,
    `email_provided:${email.length > 0}`,
    `comment_provided:${comment.length > 0}`,
    `source:${sourcePage}`,
  ];

  await ensureAnonymousUser(userId);

  await getRepository().saveQuizSubmission({
    userId,
    quizType: "dashboard-support",
    answers: {
      name,
      email,
      challenge: challenge ?? "",
      challengeLabel,
      frustrationLevel: frustrationLevel ?? "",
      comment,
      sourcePage,
    },
    result: {
      structuredTags: tags,
      trackedAt: new Date().toISOString(),
    },
  });

  console.warn(
    `[dashboard-support] user=${userId} challenge=${challenge ?? "none"} frustration=${frustrationLevel ?? "none"} tags=${tags.join(",")}`,
  );

  return NextResponse.json({
    tracked: true,
    persisted: true,
    structuredTags: tags,
  });
}

