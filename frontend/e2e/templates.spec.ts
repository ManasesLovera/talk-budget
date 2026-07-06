import { test, expect } from "@playwright/test";
import { makeTestUser, registerAndLogin } from "./support/auth";
import { maybeScreenshot } from "./support/screenshots";

test.describe("transaction templates", () => {
  test.beforeEach(async ({ page }) => {
    const user = makeTestUser("tmpl");
    await registerAndLogin(page, user);

    await page.goto("/wallets");
    await page.getByRole("button", { name: /wallet|loan/i }).click();
    await page.getByPlaceholder(/name/i).fill("Main Wallet");
    await page.locator('input[type="number"]').fill("100");
    await page.getByRole("button", { name: /save|guardar/i }).click();
    await expect(page.getByText("Main Wallet")).toBeVisible();
  });

  test("creating a template shows it in the templates list", async ({ page }, testInfo) => {
    await page.goto("/templates");
    await page.getByRole("button", { name: /add template/i }).click();
    await page.getByPlaceholder(/template name/i).fill("Coffee");
    await page.getByRole("button", { name: /^expense$/i }).click();
    await page.locator('input[type="number"]').fill("4.5");
    await page.locator("select").first().selectOption({ label: "Main Wallet" });
    await maybeScreenshot(page, testInfo, "modal-new-template");
    await page.getByRole("button", { name: /^save$/i }).click();

    await expect(page.getByText("Coffee")).toBeVisible();
    await maybeScreenshot(page, testInfo, "templates-list");
  });

  test("using a template prefills the new transaction form", async ({ page }, testInfo) => {
    await page.goto("/templates");
    await page.getByRole("button", { name: /add template/i }).click();
    await page.getByPlaceholder(/template name/i).fill("Coffee");
    await page.getByRole("button", { name: /^expense$/i }).click();
    await page.locator('input[type="number"]').fill("4.5");
    await page.locator("select").first().selectOption({ label: "Main Wallet" });
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("Coffee")).toBeVisible();

    await page.goto("/transactions");
    await page.getByRole("button", { name: /add transaction/i }).first().click();
    const heading = page.getByRole("heading", { name: /new transaction/i });
    await expect(heading).toBeVisible();
    const modal = heading.locator("xpath=ancestor::*[contains(@class, 'flex-col')][1]");

    await modal.locator("select").first().selectOption({ label: "Coffee" });
    const amountInput = modal.locator('input[type="number"]').first();
    await expect(amountInput).toHaveValue("4.50");
    await maybeScreenshot(page, testInfo, "modal-transaction-from-template");

    await modal.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("4.50").first()).toBeVisible();
  });

  test("deleting a template removes it from the list", async ({ page }) => {
    await page.goto("/templates");
    await page.getByRole("button", { name: /add template/i }).click();
    await page.getByPlaceholder(/template name/i).fill("Coffee");
    await page.getByRole("button", { name: /^expense$/i }).click();
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText("Coffee")).toBeVisible();

    await page.getByLabel(/delete template/i).click();
    await expect(page.getByText("Coffee")).not.toBeVisible();
  });
});
