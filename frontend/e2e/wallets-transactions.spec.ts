import { test, expect } from "@playwright/test";
import { makeTestUser, registerAndLogin } from "./support/auth";
import { maybeScreenshot } from "./support/screenshots";

async function createWallet(page: import("@playwright/test").Page, name: string, balance: string) {
  await page.goto("/wallets");
  await page.getByRole("button", { name: /wallet|loan/i }).click();
  await page.getByPlaceholder(/name/i).fill(name);
  await page.locator('input[type="number"]').fill(balance);
  await page.getByRole("button", { name: /save|guardar/i }).click();
  await expect(page.getByText(name)).toBeVisible();
}

async function openAddTransaction(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /add transaction|agregar transacción/i }).first().click();
  await expect(page.getByRole("heading", { name: /new transaction|nueva transacción/i })).toBeVisible();
  const saveBtn = page.getByRole("button", { name: /^save$|^guardar$/i });
  await saveBtn.waitFor({ state: "visible" });
  await expect(saveBtn).not.toBeDisabled({ timeout: 5000 });
}

test.describe("wallets and transactions", () => {
  test.beforeEach(async ({ page }) => {
    const user = makeTestUser("wt");
    await registerAndLogin(page, user);
  });

  test("creating a wallet shows it in the wallets list", async ({ page }, testInfo) => {
    await createWallet(page, "Everyday Checking", "250");
    await expect(page.getByText("US$250")).toBeVisible();
    await maybeScreenshot(page, testInfo, "wallets-created");
  });

  test("recording an income transaction updates the wallet balance and shows in the list", async ({ page }, testInfo) => {
    await createWallet(page, "Main Wallet", "0");

    await page.goto("/transactions");
    await openAddTransaction(page);
    await page.getByRole("button", { name: /^income$|^ingreso$/i }).click();
    await page.locator('input[type="number"]').first().fill("50");
    await page.getByPlaceholder(/description/i).fill("Freelance payment");
    await maybeScreenshot(page, testInfo, "modal-income-form");
    await page.getByRole("button", { name: /^save$|^guardar$/i }).click();

    await expect(page.getByText("Freelance payment")).toBeVisible();
    await expect(page.getByText("+US$50.00")).toBeVisible();
    await maybeScreenshot(page, testInfo, "transactions-list-after-income");

    await page.goto("/wallets");
    await expect(page.getByText("US$50")).toBeVisible();
  });

  test("recording an expense transaction is reflected in the dashboard summary", async ({ page }, testInfo) => {
    await createWallet(page, "Spending Wallet", "100");

    await page.goto("/transactions");
    await openAddTransaction(page);
    await page.getByRole("button", { name: /^expense$|^gasto$/i }).click();
    await page.locator('input[type="number"]').first().fill("30");
    await page.getByPlaceholder(/description/i).fill("Groceries run");
    await maybeScreenshot(page, testInfo, "modal-expense-form");
    await page.getByRole("button", { name: /^save$|^guardar$/i }).click();
    await expect(page.getByText("Groceries run")).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByTestId("summary-expense")).toContainText("US$30");
  });

  test("deleting a transaction removes it from the list", async ({ page }, testInfo) => {
    await createWallet(page, "Temp Wallet", "0");

    await page.goto("/transactions");
    await openAddTransaction(page);
    await page.getByRole("button", { name: /^income$|^ingreso$/i }).click();
    await page.locator('input[type="number"]').first().fill("20");
    await page.getByPlaceholder(/description/i).fill("Refund");
    await page.getByRole("button", { name: /^save$|^guardar$/i }).click();
    await expect(page.getByText("Refund")).toBeVisible();

    await maybeScreenshot(page, testInfo, "transactions-list-before-delete");
    await page.getByLabel(/delete transaction|eliminar transacción/i).click();
    await expect(page.getByText("Refund")).not.toBeVisible();
  });

  test("recording a transfer between wallets updates both balances", async ({ page }, testInfo) => {
    await createWallet(page, "Checking", "500");
    await createWallet(page, "Savings", "0");

    await page.goto("/transactions");
    await openAddTransaction(page);
    await page.getByRole("button", { name: /^transfer$|^transferencia$/i }).click();
    await page.locator('input[type="number"]').first().fill("200");
    await page.locator("select").nth(3).selectOption({ label: "Savings" });

    await maybeScreenshot(page, testInfo, "modal-transfer-form");
    await page.getByRole("button", { name: /^save$|^guardar$/i }).click();

    await page.waitForTimeout(2000);
    await expect(page.getByText("US$200.00")).toBeVisible({ timeout: 10000 });
    await maybeScreenshot(page, testInfo, "transactions-list-after-transfer");

    await page.goto("/wallets");
    await expect(page.getByText("US$300")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("US$200")).toBeVisible({ timeout: 5000 });
  });
});
