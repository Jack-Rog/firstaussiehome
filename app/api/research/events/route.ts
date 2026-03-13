import { NextResponse } from "next/server";
import { z } from "zod";
import type { ResearchEventName, ResearchSurface } from "@/src/lib/types";
import { getCurrentUser } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";

const eventSchema = z.object({
  anonymousId: z.string().min(1),
  sessionId: z.string().min(1),
  surface: z.enum(["quiz", "dashboard", "eoi"] satisfies [ResearchSurface, ...ResearchSurface[]]),
  eventName: z.enum(
    [
      "quiz_started",
      "quiz_completed",
      "dashboard_viewed",
      "research_module_viewed",
      "research_started",
      "research_skipped",
      "research_submitted",
      "eoi_viewed",
    ] satisfies [ResearchEventName, ...ResearchEventName[]],
  ),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = eventSchema.parse(await request.json());
  const user = await getCurrentUser();

  const event = await getRepository().saveResearchEvent({
    userId: user?.id ?? null,
    anonymousId: body.anonymousId,
    sessionId: body.sessionId,
    surface: body.surface,
    eventName: body.eventName,
    properties: body.properties ?? {},
  });

  return NextResponse.json({
    saved: true,
    eventId: event.id,
  });
}
