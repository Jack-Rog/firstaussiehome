import { expect, test } from "@playwright/test";

test("tools and support research page captures a real submission", async ({ page }) => {
  await page.goto("/eoi/tools");

  await expect(page.getByRole("heading", { name: "Help shape future tools and support" })).toBeVisible();
  await page.getByTestId("research-eoi-problem").fill(
    "I do not know whether I should focus on saving, debt, or working out what help exists first.",
  );
  await page.getByTestId("research-eoi-attempted").fill(
    "I have read blog posts and asked friends, but I still do not know what the right next step is.",
  );
  await page.getByTestId("research-eoi-category").selectOption("making-a-plan");
  await page.getByTestId("research-eoi-time-stuck").selectOption("3-6-months");
  await page.getByTestId("research-eoi-buy-timeline").selectOption("2-5-years");
  await page.getByTestId("research-eoi-slowdown-4").click();
  await page.getByTestId("research-eoi-confidence-2").click();
  await page.getByTestId("research-eoi-career-stage").selectOption("0-2-years-working");
  await page.getByTestId("research-eoi-state").selectOption("nsw");
  await page.getByTestId("research-eoi-buying-mode").selectOption("solo");
  await page.getByTestId("research-eoi-income-band").selectOption("80k-120k");
  await page.getByTestId("research-eoi-savings-band").selectOption("20k-50k");
  await page.getByTestId("research-eoi-interview-yes").click();
  await page.getByTestId("research-eoi-email").fill("sam@example.com");
  await page.getByTestId("research-eoi-submit").click();

  await expect(page.getByText("We have your feedback.")).toBeVisible();
});
