import { NextResponse } from "next/server";
import { buildHecsToolOutput } from "@/src/server/services/tools-service";

export async function POST(request: Request) {
  const body = (await request.json()) as { annualIncome?: number };
  return NextResponse.json(buildHecsToolOutput(body.annualIncome ?? 78000));
}
