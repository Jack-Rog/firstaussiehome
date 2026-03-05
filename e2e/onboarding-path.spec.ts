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

  await page.getByTestId("quiz-firstHomeBuyer-yes").click();
  await page.getByTestId("quiz-withoutOtherProperty-yes").click();
  await page.getByTestId("quiz-homeState-nsw").click();
  await page.getByTestId("quiz-buyingArea-state-capital").click();
  await page.getByTestId("qual-batch-continue").click();

  for (const testId of ["quiz-australianCitizenOrResident-yes", "quiz-withoutDependants-yes"]) {
    await page.getByTestId(testId).click();
  }
  await page.getByTestId("qual-batch-continue").click();

  for (const testId of [
    "quiz-paygOnly-yes",
    "quiz-withoutBusinessTrustIncome-yes",
    "quiz-existingHome-yes",
  ]) {
    await page.getByTestId(testId).click();
  }
  await page.getByTestId("qual-batch-continue").click();

  const batchOne: Array<[string, string]> = [
    ["quiz-age", "28"],
    ["quiz-annualSalary", "95000"],
    ["quiz-averageMonthlyExpenses", "2600"],
  ];
  for (const [testId, value] of batchOne) {
    await page.getByTestId(testId).fill(value);
  }
  await page.getByTestId("quant-next").click();

  const batchTwo: Array<[string, string]> = [
    ["quiz-currentSavings", "65000"],
    ["quiz-privateDebt", "9000"],
    ["quiz-hecsDebt", "21000"],
  ];
  for (const [testId, value] of batchTwo) {
    await page.getByTestId(testId).fill(value);
  }
  await page.getByTestId("quant-next").click();

  await page.getByTestId("quiz-targetPropertyPrice").fill("790000");
  await page.getByTestId("quant-next").click();

  await expect(page.getByRole("heading", { name: "Your dashboard is ready." })).toBeVisible();
  await page.getByLabel("Name").fill("Sam");
  await page.getByLabel("Email").fill("sam@example.com");
  await page.getByLabel("Your story").fill("PAYG worker trying to figure out the first-home numbers.");
  await page.getByTestId("create-free-account").click();

  await expect(page).toHaveURL(/\/first-home-dashboard$/);
  await expect(page.getByRole("heading", { name: "Your first-home dashboard" })).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home")).toBeVisible();

  expect(consoleWarnings.some((entry) => entry.includes("Encountered two children with the same key"))).toBe(
    false,
  );
});
