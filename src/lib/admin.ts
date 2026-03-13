import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isDevelopmentLike } from "@/src/lib/demo-mode";
import type { SessionUser } from "@/src/lib/types";

const ADMIN_SESSION_COOKIE_NAME = "afh_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

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

function isExplicitlyDisabled(value: string | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized === "off" || normalized === "false" || normalized === "disabled" || normalized === "none";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? null;
}

function getAdminSigningSecret() {
  return process.env.AUTH_SECRET?.trim() ?? getAdminPassword();
}

function createDigest(value: string) {
  const signingSecret = getAdminSigningSecret();
  if (!signingSecret) {
    return null;
  }

  return createHmac("sha256", signingSecret).update(value).digest();
}

function signAdminSessionPayload(payload: string) {
  const signingSecret = getAdminSigningSecret();
  if (!signingSecret) {
    return null;
  }

  return createHmac("sha256", signingSecret).update(payload).digest("hex");
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
  if (isExplicitlyDisabled(process.env.RESEARCH_ALERT_TO)) {
    return [];
  }

  const configured = parseEmailList(process.env.RESEARCH_ALERT_TO);
  if (configured.length > 0) {
    return configured;
  }

  return getAdminEmails();
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE_NAME;
}

export function hasAdminPasswordConfigured() {
  return typeof getAdminPassword() === "string" && getAdminPassword()!.length > 0;
}

export function verifyAdminPassword(candidate: string) {
  const expected = getAdminPassword();
  if (!expected) {
    return false;
  }

  const left = createDigest(candidate);
  const right = createDigest(expected);
  return Boolean(left && right && timingSafeEqual(left, right));
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  const nonce = randomBytes(12).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const signature = signAdminSessionPayload(payload);

  if (!signature) {
    throw new Error("Admin session signing secret is not configured.");
  }

  return `${payload}.${signature}`;
}

export function hasValidAdminSessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const [expiresAtRaw, nonce, signature] = token.split(".");
  if (!expiresAtRaw || !nonce || !signature) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expectedSignature = signAdminSessionPayload(`${expiresAtRaw}.${nonce}`);
  if (!expectedSignature) {
    return false;
  }

  const left = Buffer.from(signature, "hex");
  const right = Buffer.from(expectedSignature, "hex");

  return left.length === right.length && timingSafeEqual(left, right);
}

export function getAdminSessionMaxAgeSeconds() {
  return ADMIN_SESSION_TTL_SECONDS;
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
