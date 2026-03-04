import { NextResponse } from "next/server";
import { getActiveUserId } from "@/src/lib/route-guards";
import { listBookmarks, toggleBookmark } from "@/src/server/services/progress-service";

export async function GET() {
  const userId = await getActiveUserId();
  return NextResponse.json(await listBookmarks(userId));
}

export async function POST(request: Request) {
  const userId = await getActiveUserId();
  const body = (await request.json()) as { slug: string; label: string };

  return NextResponse.json(
    await toggleBookmark({
      userId,
      slug: body.slug,
      label: body.label,
    }),
  );
}
