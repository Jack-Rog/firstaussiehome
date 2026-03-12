import { isDevelopmentLike } from "@/src/lib/demo-mode";
import type { SessionUser } from "@/src/lib/types";

function normalizeEmailAddress(value: string) {
  const matched = value.match(/<([^>]+)>/);
  const email = matched?.[1] ?? value;
  return email.trim().toLowerCase();
}

function parseEmailList(value: string | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => normalizeEmailAddress(entry));
}

export function getAdminEmails() {
  const configured = parseEmailList(process.env.ADMIN_EMAILS);
  if (configured.length > 0) {
    return configured;
  }

  if (!process.env.EMAIL_FROM) {
    return [];
  }

  return [normalizeEmailAddress(process.env.EMAIL_FROM)];
}

export function getResearchAlertRecipients() {
  const configured = parseEmailList(process.env.RESEARCH_ALERT_TO);
  if (configured.length > 0) {
    return configured;
  }

  return getAdminEmails();
}

export function hasAdminAccess(user: SessionUser | null) {
  if (!user) {
    return false;
  }

  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) {
    return isDevelopmentLike() && user.demoMode;
  }

  if (!user.email) {
    return false;
  }

  return adminEmails.includes(normalizeEmailAddress(user.email));
}
