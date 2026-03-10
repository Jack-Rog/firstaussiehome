import { expect, test } from "@playwright/test";

test("landing routes into the first-home quiz and unlocks the dashboard", async ({ page }) => {
  const consoleWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleWarnings.push(message.text());
    }
  });

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

  await expect(page.getByTestId("tier2-continue")).toHaveCount(0);

  await expect(page.getByRole("heading", { name: "What is the hardest part of saving for your first home?" })).toBeVisible();
  await page.getByLabel("Name").fill("Sam");
  await expect(page.getByText("Tell us what you struggle with most so we can build the right tools")).toBeVisible();
  await page.getByLabel("Understanding government schemes").check();
  await page.getByTestId("quiz-support-frustration-4").click();
  await page.getByLabel("Leave your email if you'd like early access to tools that solve this").fill("sam@example.com");
  await page.getByLabel("What have you already tried to solve this").fill("Mostly spreadsheets so far.");
  await page.getByTestId("create-free-account").click();

  await expect(page).toHaveURL(/\/first-home-dashboard$/);
  await expect(page.getByRole("heading", { name: "Your first-home dashboard" })).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home")).toBeVisible();
  await expect(page.getByText(/vs\. \$[\d,]+ without eligible schemes/)).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home").getByText("Stamp duty").first()).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home").getByText("Transfer duty")).toHaveCount(0);
  await expect(page.getByText("What do you want next?")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText("Scheme tracker").first()).toBeVisible();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("heading", { name: "Scheme tracker" })).toBeVisible();

  await expect(page.getByRole("heading", { name: "What is the hardest part of saving for your first home?" })).toHaveCount(0);

  expect(consoleWarnings.some((entry) => entry.includes("Encountered two children with the same key"))).toBe(
    false,
  );
});
