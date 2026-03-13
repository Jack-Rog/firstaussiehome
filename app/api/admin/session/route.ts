import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAdminSessionToken,
  getAdminSessionCookieName,
  getAdminSessionMaxAgeSeconds,
  hasAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/src/lib/admin";

export const runtime = "nodejs";

const adminSessionSchema = z.object({
  password: z.string().min(1).max(256),
});

function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: getAdminSessionCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function POST(request: Request) {
  if (!hasAdminPasswordConfigured()) {
    return NextResponse.json(
      { authenticated: false, error: "Admin password is not configured." },
      { status: 503 },
    );
  }

  const parsed = adminSessionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { authenticated: false, error: "Enter the admin password." },
      { status: 400 },
    );
  }

  if (!verifyAdminPassword(parsed.data.password)) {
    return NextResponse.json(
      { authenticated: false, error: "Incorrect admin password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set({
    name: getAdminSessionCookieName(),
    value: createAdminSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getAdminSessionMaxAgeSeconds(),
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminSessionCookie(response);
  return response;
}
