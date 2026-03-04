import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const NO_INDEX_PREFIXES = ["/model", "/progress", "/bookmarks"];

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (NO_INDEX_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
