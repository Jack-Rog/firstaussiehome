import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npm run start -- --port 3001",
    port: 3001,
    timeout: 180000,
    reuseExistingServer: false,
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3001",
      AUTH_SECRET: "test-secret",
      USE_MEMORY_DB: "true",
      ENABLE_TEST_AUTH: "true",
      ENABLE_ALT_HOME_HERO: "false",
      ENABLE_ALT_ONBOARDING_RESULTS: "false",
      ENABLE_MONTH1_REPORT_EXPORTS: "false",
      STRIPE_PRO_PRICE_ID: "price_test",
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
