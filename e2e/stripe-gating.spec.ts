import { expect, test } from "@playwright/test";

test("eoi tools page is the primary pro/advice route", async ({ page }) => {
  await page.goto("/eoi/tools");
  await expect(page.getByRole("heading", { name: "First Aussie Home Pro + Advice EOI" })).toBeVisible();
  await expect(page.getByText("Potential pro tools checklist")).toBeVisible();
  await expect(page.getByText("Potential professional advice checklist")).toBeVisible();
});
