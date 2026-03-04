import { NextResponse } from "next/server";
import { isMemoryMode, isPaymentsDemoMode } from "@/src/lib/demo-mode";

export async function GET() {
  return NextResponse.json({
    mode: isMemoryMode() ? "demo-memory" : "postgres",
    payments: isPaymentsDemoMode() ? "demo" : "stripe",
    buildVersion: "0.1.0",
  });
}
