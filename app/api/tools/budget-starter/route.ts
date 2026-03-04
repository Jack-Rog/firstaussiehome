import { NextResponse } from "next/server";
import { buildBudgetToolOutput } from "@/src/server/services/tools-service";

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json(buildBudgetToolOutput(body));
}
