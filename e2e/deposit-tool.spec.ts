import { expect, test } from "@playwright/test";

test("deposit compatibility view keeps the cash comparison live", async ({ page }) => {
  const consoleWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleWarnings.push(message.text());
    }
  });

  await page.goto("/tools/deposit-runway?salary=98000&privateDebt=9000&hecsDebt=18000&savings=50000&expenses=2600&price=820000&age=29");

  await expect(page.getByRole("heading", { name: "Deposit quick view" })).toBeVisible();
  await expect(page.getByTestId("cost-of-first-home")).toBeVisible();

  const beforeCash = await page.getByTestId("current-cash-outlay").textContent();
  await page.getByRole("button", { name: "20%" }).click();
  await expect(page.getByTestId("current-cash-outlay")).not.toHaveText(beforeCash ?? "");

  await page.getByRole("button", { name: "2%" }).click();
  await expect(page.getByTestId("current-cash-outlay")).toBeVisible();
  await expect(page.getByTestId("baseline-cash-outlay")).toBeVisible();

  expect(consoleWarnings.some((entry) => entry.includes("Encountered two children with the same key"))).toBe(
    false,
  );
});
