import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthPrisma } from "@/src/lib/auth-db";
import { isMemoryMode } from "@/src/lib/demo-mode";
import {
  hashPassword,
  isStrongEnoughPassword,
  normalizeAuthEmail,
  normalizeProfileName,
} from "@/src/lib/password-auth";

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  if (isMemoryMode()) {
    return NextResponse.json({ error: "Account registration is disabled in demo mode." }, { status: 400 });
  }

  const body = registerSchema.parse(await request.json());
  const email = normalizeAuthEmail(body.email);
  const name = normalizeProfileName(body.name);

  if (!name) {
    return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  }

  if (!isStrongEnoughPassword(body.password)) {
    return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  }

  const existingUser = await getAuthPrisma().user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account already exists for that email. Log in or reset the password instead." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(body.password);

  const user = await getAuthPrisma().user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return NextResponse.json({
    created: true,
    user,
  });
}
