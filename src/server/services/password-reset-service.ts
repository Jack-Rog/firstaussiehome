import { Resend } from "resend";
import { getAuthPrisma } from "@/src/lib/auth-db";
import { isDevelopmentLike } from "@/src/lib/demo-mode";
import {
  createPasswordResetToken,
  getPasswordResetExpiryDate,
  hashPasswordResetToken,
  normalizeAuthEmail,
} from "@/src/lib/password-auth";

export async function sendPasswordResetEmail(email: string) {
  const normalizedEmail = normalizeAuthEmail(email);
  const user = await getAuthPrisma().user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user?.email) {
    return false;
  }

  const rawToken = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expiresAt = getPasswordResetExpiryDate();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(user.email)}`;

  await getAuthPrisma().passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      OR: [{ usedAt: null }, { expiresAt: { lt: new Date() } }],
    },
  });

  await getAuthPrisma().passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Reset your First Aussie Home password",
      text: [
        `Hi ${user.name ?? "there"},`,
        "",
        "We received a request to reset your First Aussie Home password.",
        `Reset it here: ${resetUrl}`,
        "",
        "This link expires in 1 hour.",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <p>Hi ${user.name ?? "there"},</p>
          <p>We received a request to reset your First Aussie Home password.</p>
          <p><a href="${resetUrl}">Reset your password</a></p>
          <p>This link expires in 1 hour.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    return true;
  }

  if (isDevelopmentLike()) {
    console.warn(`[password-reset] ${user.email}: ${resetUrl}`);
    return true;
  }

  return false;
}
