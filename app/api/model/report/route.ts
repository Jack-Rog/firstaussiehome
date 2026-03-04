import { NextResponse } from "next/server";
import { getActiveUserId } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";
import { calculateDepositRunway } from "@/src/server/calculators/deposit-runway";
import { buildReadinessReport } from "@/src/server/services/report-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    depositInput?: {
      targetPropertyPrice?: number;
      currentSavings?: number;
      monthlySavings?: number;
      annualSavingsRate?: number;
    };
  };
  const userId = await getActiveUserId();
  const repository = getRepository();
  const latestImport = await repository.getLatestBankImport(userId);
  const depositInput = {
    targetPropertyPrice: body.depositInput?.targetPropertyPrice ?? 700000,
    currentSavings: body.depositInput?.currentSavings ?? 40000,
    monthlySavings: body.depositInput?.monthlySavings ?? 1800,
    annualSavingsRate: body.depositInput?.annualSavingsRate ?? 3,
  };
  const depositOutput = calculateDepositRunway(depositInput);
  const report = buildReadinessReport({
    depositOutput,
    importSummary: latestImport?.summary ?? null,
  });
  const saved = await repository.saveScenario({
    userId,
    name: body.name ?? "Latest readiness report",
    inputs: depositInput,
    outputs: depositOutput,
    report,
  });

  return NextResponse.json(saved.report);
}
