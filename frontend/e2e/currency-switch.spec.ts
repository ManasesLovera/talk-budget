import { test, expect } from "@playwright/test";
import { makeTestUser, registerAndLogin } from "./support/auth";
import { maybeScreenshot } from "./support/screenshots";

test.describe("currency switch", () => {
  test.beforeEach(async ({ page }) => {
    const user = makeTestUser("currency");
    await registerAndLogin(page, user);
  });

  test("defaults to US$ and persists RD$ after switching and reloading", async ({ page }, testInfo) => {
    await page.goto("/settings");
    const select = page.getByTestId("currency-select");
    await expect(select).toHaveValue("USD");
    await maybeScreenshot(page, testInfo, "settings-usd");

    await select.selectOption("DOP");
    await expect(select).toHaveValue("DOP");
    await maybeScreenshot(page, testInfo, "settings-dop");

    // Persists across a full reload (localStorage-backed).
    await page.reload();
    await expect(page.getByTestId("currency-select")).toHaveValue("DOP");
  });

  test("switching currency updates the symbol on the dashboard", async ({ page }, testInfo) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("net-worth")).toContainText("US$");

    await page.goto("/settings");
    await page.getByTestId("currency-select").selectOption("DOP");

    await page.goto("/dashboard");
    await expect(page.getByTestId("net-worth")).toContainText("RD$");
    await expect(page.getByTestId("opening-balance")).toContainText("RD$");
    await expect(page.getByTestId("ending-balance")).toContainText("RD$");
    await maybeScreenshot(page, testInfo, "dashboard-dop");
  });

  test("switching currency updates wallet balances", async ({ page }) => {
    await page.goto("/wallets");
    await page.getByRole("button", { name: /wallet|loan/i }).click();
    await page.getByPlaceholder(/name/i).fill("Test Checking");
    await page.locator('input[type="number"]').fill("100");
    await page.getByRole("button", { name: /save|guardar/i }).click();

    await expect(page.getByText("US$100")).toBeVisible();

    await page.goto("/settings");
    await page.getByTestId("currency-select").selectOption("DOP");

    await page.goto("/wallets");
    await expect(page.getByText("RD$100")).toBeVisible();
  });
});
