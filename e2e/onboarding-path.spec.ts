import { expect, test, type Page } from "@playwright/test";

async function completeQuizToDashboard(page: Page) {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Start the quiz to find the true cost of buying your first home." }),
  ).toBeVisible();
  await page.getByTestId("start-homeowner-pathway-quiz").click();

  await expect(page).toHaveURL(/\/First-Home-Quiz$/);
  await expect(page.getByRole("heading", { name: "Let's build your buying path." })).toBeVisible();

  await page.getByTestId("quiz-homeState-nsw").click();
  await page.getByTestId("quiz-targetPropertyPrice").fill("790000");
  await page.getByTestId("quiz-firstHomeBuyer-yes").click();
  await page.getByTestId("quiz-ownerOccupier-yes").click();
  await page.getByTestId("tier1-continue").click();

  for (const testId of [
    "quiz-australianCitizenOrResident-yes",
    "quiz-buyingSoloOrJoint-solo",
    "quiz-foreignBuyer-yes",
    "quiz-propertyTypeDetailed-established-home",
    "quiz-buyingArea-state-capital",
  ]) {
    await page.getByTestId(testId).click();
  }
  await page.getByTestId("tier1-continue").click();

  const tier1NumericFields: Array<[string, string]> = [
    ["quiz-actHouseholdIncome", "120000"],
    ["quiz-dependentChildrenCount", "0"],
    ["quiz-currentSavings", "65000"],
  ];
  for (const [testId, value] of tier1NumericFields) {
    await page.getByTestId(testId).fill(value);
  }
  await page.getByTestId("tier1-continue").click();

  await expect(page).toHaveURL(/\/first-home-dashboard$/);
}

test("landing routes into the first-home quiz and opens the dashboard without a feedback gate", async ({ page }) => {
  const consoleWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleWarnings.push(message.text());
    }
  });

  await completeQuizToDashboard(page);

  await expect(page.getByRole("heading", { name: "Your first-home dashboard" })).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home")).toBeVisible();
  await expect(page.getByText(/vs\. \$[\d,]+ without eligible schemes/)).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home").getByText("Stamp duty").first()).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home").getByText("Transfer duty")).toHaveCount(0);
  await expect(page.getByTestId("research-intake-dashboard")).toBeVisible();
  await expect(page.getByText("What still feels hardest about buying your first home?")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What is the hardest part of saving for your first home?" })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("Scheme tracker").first()).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("heading", { name: "Scheme tracker" })).toBeVisible();

  expect(consoleWarnings.some((entry) => entry.includes("Encountered two children with the same key"))).toBe(
    false,
  );
});

test("dashboard research can be submitted after the quiz", async ({ page }) => {
  await completeQuizToDashboard(page);

  await page.getByTestId("research-dashboard-problem").fill(
    "I still cannot work out which schemes actually change my deposit path and whether I can buy sooner.",
  );
  await page.getByTestId("research-dashboard-attempted").fill(
    "I have tried spreadsheets, official pages, and calculators, but I still do not know what applies to me.",
  );
  await page.getByTestId("research-dashboard-category").selectOption("options-and-schemes");
  await page.getByTestId("research-dashboard-time-stuck").selectOption("1-3-months");
  await page.getByTestId("research-dashboard-buy-timeline").selectOption("1-2-years");
  await page.getByTestId("research-dashboard-slowdown-4").click();
  await page.getByTestId("research-dashboard-confidence-2").click();
  await page.getByTestId("research-dashboard-interview-yes").click();
  await page.getByTestId("research-dashboard-email").fill("sam@example.com");
  await page.getByTestId("research-dashboard-submit").click();

  await expect(page.getByText("We have your feedback.")).toBeVisible();
  await expect(page.getByText(/We may email you about a short 10-minute research chat./)).toBeVisible();
});

test("dashboard research can be skipped without blocking the dashboard", async ({ page }) => {
  await completeQuizToDashboard(page);

  await page.getByTestId("research-dashboard-skip").click();

  await expect(page.getByRole("button", { name: "Share feedback later" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your first-home dashboard" })).toBeVisible();
});

test("dashboard research stays discoverable after recent submission suppression", async ({ page }) => {
  await page.addInitScript((storageKey: string) => {
    window.localStorage.setItem(storageKey, new Date().toISOString());
  }, "aussiesfirsthome:dashboard-research-submitted-at");

  await page.goto("/first-home-dashboard");

  await expect(page.getByText("You already shared feedback recently.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open survey again" })).toBeVisible();

  await page.getByRole("button", { name: "Open survey again" }).click();

  await expect(page.getByTestId("research-intake-dashboard")).toBeVisible();
  await expect(page.getByText("What still feels hardest about buying your first home?")).toBeVisible();
});
