import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthPrisma } from "@/src/lib/auth-db";
import {
  hashPassword,
  hashPasswordResetToken,
  isStrongEnoughPassword,
  normalizeAuthEmail,
} from "@/src/lib/password-auth";

const confirmSchema = z.object({
  email: z.string().trim().email(),
  token: z.string().min(10),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = confirmSchema.parse(await request.json());

  if (!isStrongEnoughPassword(body.password)) {
    return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(body.token);
  const resetToken = await getAuthPrisma().passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date() ||
    normalizeAuthEmail(resetToken.user.email ?? "") !== normalizeAuthEmail(body.email)
  ) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password);

  await getAuthPrisma().$transaction([
    getAuthPrisma().user.update({
      where: { id: resetToken.user.id },
      data: { passwordHash },
    }),
    getAuthPrisma().passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    reset: true,
  });
}
