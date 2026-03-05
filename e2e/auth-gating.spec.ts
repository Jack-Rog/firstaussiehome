import { expect, test } from "@playwright/test";

test("demo sign-in works and model remains gated until pro is enabled", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: "Demo sign-in" }).click();
  await page.waitForURL(/\/model/);
  await expect(page.getByRole("heading", { name: "Tier 2 modelling is currently EOI only" })).toBeVisible();
});
