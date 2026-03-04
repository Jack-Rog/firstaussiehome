import { NextResponse } from "next/server";
import { getActiveUserId } from "@/src/lib/route-guards";
import { listProgress, saveProgress } from "@/src/server/services/progress-service";

export async function GET() {
  const userId = await getActiveUserId();
  return NextResponse.json(await listProgress(userId));
}

export async function POST(request: Request) {
  const userId = await getActiveUserId();
  const body = (await request.json()) as {
    kind: "article" | "path" | "quiz" | "tool";
    key: string;
    value: Record<string, unknown>;
    completed: boolean;
  };

  const record = await saveProgress({
    userId,
    kind: body.kind,
    key: body.key,
    value: body.value,
    completed: body.completed,
  });

  return NextResponse.json(record);
}
