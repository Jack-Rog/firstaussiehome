import { expect, test } from "@playwright/test";

test("scheme screening shows may be eligible and official links", async ({ page }) => {
  await page.goto("/quiz/schemes");
  await page.getByRole("button", { name: "Check broad indicators" }).click();
  await expect(page.getByText("May be eligible", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Revenue NSW First Home Buyers Assistance Scheme/i })).toBeVisible();
});
