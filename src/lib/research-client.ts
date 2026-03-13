"use client";

import {
  DASHBOARD_RESEARCH_SUBMITTED_AT_KEY,
} from "@/src/lib/research";
import type { ResearchEventName, ResearchSurface } from "@/src/lib/types";

const ANONYMOUS_ID_KEY = "aussiesfirsthome:anonymous-id";
const SESSION_ID_KEY = "aussiesfirsthome:research-session-id";
const EVENT_CACHE_KEY = "aussiesfirsthome:recent-research-events";

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function getEventDedupeWindowMs(eventName: ResearchEventName) {
  if (eventName === "dashboard_viewed" || eventName === "research_module_viewed" || eventName === "eoi_viewed") {
    return 30_000;
  }

  if (eventName === "research_started") {
    return 15_000;
  }

  return 5_000;
}

function shouldSkipRecentEvent(signature: string, eventName: ResearchEventName, storage: Storage) {
  const now = Date.now();
  const windowMs = getEventDedupeWindowMs(eventName);

  try {
    const raw = storage.getItem(EVENT_CACHE_KEY);
    const cache = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const filteredCache = Object.fromEntries(
      Object.entries(cache).filter(([, timestamp]) => Number.isFinite(timestamp) && now - timestamp < 60_000),
    );
    const previousTimestamp = filteredCache[signature];

    filteredCache[signature] = now;
    storage.setItem(EVENT_CACHE_KEY, JSON.stringify(filteredCache));

    return typeof previousTimestamp === "number" && now - previousTimestamp < windowMs;
  } catch {
    return false;
  }
}

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

  const eventSignature = stableSerialize([input.surface, input.eventName, input.properties ?? {}]);
  if (shouldSkipRecentEvent(eventSignature, input.eventName, window.sessionStorage)) {
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
