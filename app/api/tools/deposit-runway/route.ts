import { NextResponse } from "next/server";
import { buildDepositToolOutput } from "@/src/server/services/tools-service";

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json(buildDepositToolOutput(body));
}
