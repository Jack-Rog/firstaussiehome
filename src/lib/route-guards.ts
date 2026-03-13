import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  getAdminSessionCookieName,
  hasAdminAccess,
  hasValidAdminSessionToken,
} from "@/src/lib/admin";
import { auth } from "@/src/lib/auth";
import { isMemoryMode } from "@/src/lib/demo-mode";
import { getProDemoCookieName, hasValidProDemoCookie } from "@/src/lib/stripe";
import type { SessionUser } from "@/src/lib/types";
import { getRepository } from "@/src/server/repositories/repository";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (session?.user && "id" in session.user) {
    return session.user as SessionUser;
  }

  if (isMemoryMode()) {
    return {
      id: "demo-user",
      email: "demo@aussiesfirsthome.local",
      name: "Aussies First Home Demo User",
      tier: "free",
      subscriptionStatus: "inactive",
      demoMode: true,
    };
  }

  return null;
}

export async function getActiveUserId() {
  const user = await getCurrentUser();
  return user?.id ?? "anonymous-user";
}

export async function hasProAccess() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(getProDemoCookieName())?.value;
  if (hasValidProDemoCookie(cookieValue)) {
    return true;
  }

  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const subscription = await getRepository().getSubscription(user.id);
  return subscription.status === "active" || subscription.status === "trialing" || subscription.status === "demo";
}

export async function requireAdminUser(callbackUrl = "/admin/research") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!hasAdminAccess(user)) {
    notFound();
  }

  return user;
}

export async function getAdminAccessState() {
  const user = await getCurrentUser();

  if (hasAdminAccess(user)) {
    return {
      authorized: true as const,
      method: "email" as const,
      user,
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(getAdminSessionCookieName())?.value;

  if (hasValidAdminSessionToken(token)) {
    return {
      authorized: true as const,
      method: "password" as const,
      user: null,
    };
  }

  return {
    authorized: false as const,
    method: null,
    user,
  };
}
