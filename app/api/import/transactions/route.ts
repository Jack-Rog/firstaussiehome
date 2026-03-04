import { NextResponse } from "next/server";
import { getActiveUserId } from "@/src/lib/route-guards";
import { getRepository } from "@/src/server/repositories/repository";
import { importTransactions } from "@/src/server/services/csv-import-service";

export async function POST(request: Request) {
  const userId = await getActiveUserId();
  const body = (await request.json()) as { fileName: string; csvText: string };
  const summary = importTransactions(body.csvText);

  await getRepository().saveBankImport({
    userId,
    fileName: body.fileName,
    summary,
  });

  return NextResponse.json(summary);
}
