import { test, expect } from "@playwright/test";
import { makeTestUser, registerAndLogin } from "./support/auth";
import { maybeScreenshot } from "./support/screenshots";

test.describe("language switch", () => {
  test.beforeEach(async ({ page }) => {
    const user = makeTestUser("lang");
    await registerAndLogin(page, user);
  });

  test("defaults to English and switches to Spanish", async ({ page }, testInfo) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Profile", { exact: true })).toBeVisible();
    await maybeScreenshot(page, testInfo, "settings-en");

    await page.getByTestId("language-option-es").click();

    await expect(page.getByRole("heading", { name: "Ajustes" })).toBeVisible();
    await expect(page.getByText("Perfil", { exact: true })).toBeVisible();
    await maybeScreenshot(page, testInfo, "settings-es");
  });

  test("persists the selected language across reload and other pages", async ({ page }) => {
    await page.goto("/settings");
    await page.getByTestId("language-option-es").click();
    await expect(page.getByText("Perfil", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText("Perfil", { exact: true })).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText("Patrimonio neto", { exact: false })).toBeVisible();

    await page.goto("/wallets");
    await expect(page.getByRole("button", { name: /billetera o préstamo/i })).toBeVisible();
  });

  test("switching back to English restores English copy", async ({ page }) => {
    await page.goto("/settings");
    await page.getByTestId("language-option-es").click();
    await expect(page.getByText("Perfil", { exact: true })).toBeVisible();

    await page.getByTestId("language-option-en").click();
    await expect(page.getByText("Profile", { exact: true })).toBeVisible();
  });
});
