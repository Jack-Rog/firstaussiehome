import { expect, test } from "@playwright/test";

test("demo checkout enables gated model access", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Enable Pro demo access" }).click();
  await expect(page).toHaveURL(/\/model/);
  await expect(page.getByText("Pro modelling dashboard")).toBeVisible();
});
