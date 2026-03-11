import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getAnonymousId,
  getSessionId,
  hasRecentDashboardResearchSubmission,
  setDashboardResearchSubmittedAt,
} from "@/src/lib/research-client";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

describe("research client helpers", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: createStorage(),
        sessionStorage: createStorage(),
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("reuses anonymous and session ids across calls", () => {
    const anonymousId = getAnonymousId();
    const sessionId = getSessionId();

    expect(anonymousId).toBeTruthy();
    expect(getAnonymousId()).toBe(anonymousId);
    expect(sessionId).toBeTruthy();
    expect(getSessionId()).toBe(sessionId);
  });

  it("suppresses dashboard research once a recent submission exists", () => {
    expect(hasRecentDashboardResearchSubmission()).toBe(false);
    setDashboardResearchSubmittedAt(new Date().toISOString());
    expect(hasRecentDashboardResearchSubmission()).toBe(true);
  });
});
