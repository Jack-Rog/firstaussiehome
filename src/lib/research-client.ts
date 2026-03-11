"use client";

import {
  DASHBOARD_RESEARCH_SUBMITTED_AT_KEY,
} from "@/src/lib/research";
import type { ResearchEventName, ResearchSurface } from "@/src/lib/types";

const ANONYMOUS_ID_KEY = "aussiesfirsthome:anonymous-id";
const SESSION_ID_KEY = "aussiesfirsthome:research-session-id";

function getStorageId(key: string, storage: Storage) {
  const existing = storage.getItem(key);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}

export function getAnonymousId() {
  if (typeof window === "undefined") {
    return "";
  }

  return getStorageId(ANONYMOUS_ID_KEY, window.localStorage);
}

export function getSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  return getStorageId(SESSION_ID_KEY, window.sessionStorage);
}

export async function trackResearchEvent(input: {
  surface: ResearchSurface;
  eventName: ResearchEventName;
  properties?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await fetch("/api/research/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        anonymousId: getAnonymousId(),
        sessionId: getSessionId(),
        surface: input.surface,
        eventName: input.eventName,
        properties: input.properties ?? {},
      }),
    });
  } catch {
    // Research telemetry should never block the user flow.
  }
}

export function setDashboardResearchSubmittedAt(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DASHBOARD_RESEARCH_SUBMITTED_AT_KEY, value);
}

export function hasRecentDashboardResearchSubmission(now = new Date()) {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.localStorage.getItem(DASHBOARD_RESEARCH_SUBMITTED_AT_KEY);
  if (!raw) {
    return false;
  }

  const submittedAt = new Date(raw);
  if (Number.isNaN(submittedAt.getTime())) {
    return false;
  }

  const days = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24);
  return days < 30;
}
