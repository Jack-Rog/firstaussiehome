import { NextRequest, NextResponse } from "next/server";
import { searchLearnArticles } from "@/src/lib/content";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const data = await searchLearnArticles({
    q: searchParams.get("q") ?? undefined,
    tag: searchParams.get("tag") ?? undefined,
    path: (searchParams.get("path") as never) ?? undefined,
  });

  return NextResponse.json(data);
}
