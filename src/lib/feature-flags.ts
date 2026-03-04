import type { FeatureFlags } from "@/src/lib/types";

function readBoolean(name: string, fallback = false) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return value === "true";
}

export function getFeatureFlags(): FeatureFlags {
  return {
    enableAltHomeHero: readBoolean("ENABLE_ALT_HOME_HERO"),
    enableAltOnboardingResults: readBoolean("ENABLE_ALT_ONBOARDING_RESULTS"),
    enableMonth1ReportExports: readBoolean("ENABLE_MONTH1_REPORT_EXPORTS"),
  };
}
