import { NextResponse } from "next/server";
import { buildFirstHomeAnalysisToolOutput } from "@/src/server/services/tools-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(buildFirstHomeAnalysisToolOutput(body));
}
