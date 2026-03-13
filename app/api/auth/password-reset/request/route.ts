import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/src/server/services/password-reset-service";

const requestSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const body = requestSchema.parse(await request.json());

  try {
    await sendPasswordResetEmail(body.email);
  } catch (error) {
    console.error("Failed to send password reset email", error);
  }

  return NextResponse.json({
    requested: true,
  });
}
