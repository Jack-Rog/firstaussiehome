import { NextResponse } from "next/server";
import { buildHomeownerPathwayOutput } from "@/src/lib/analysis/homeowner-pathway-analysis";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    input?: Record<string, unknown>;
    selections?: Record<string, unknown>;
  };

  return NextResponse.json(
    buildHomeownerPathwayOutput(body.input ?? {}, body.selections ?? {}),
  );
}
