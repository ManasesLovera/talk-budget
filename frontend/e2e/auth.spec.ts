import { test, expect } from "@playwright/test";
import { login, makeTestUser, registerAndLogin } from "./support/auth";
import { maybeScreenshot } from "./support/screenshots";

test.describe("authentication", () => {
  test("registering a new account logs the user in", async ({ page }, testInfo) => {
    const user = makeTestUser("auth");
    await registerAndLogin(page, user);

    await page.goto("/settings");
    await expect(page.getByTestId("settings-username")).toHaveValue(user.username);
    await maybeScreenshot(page, testInfo, "settings-after-register");
  });

  test("logging out returns to the login page and blocks protected routes", async ({ page }) => {
    const user = makeTestUser("logout");
    await registerAndLogin(page, user);

    await page.goto("/settings");
    await page.getByRole("button", { name: /log out|cerrar sesión/i }).click();
    await page.waitForURL(/\/login$/);

    await page.goto("/dashboard");
    await page.waitForURL(/\/login$/);
  });

  test("a logged-out user can log back in with the same credentials", async ({ page }) => {
    const user = makeTestUser("relogin");
    await registerAndLogin(page, user);

    await page.goto("/settings");
    await page.getByRole("button", { name: /log out|cerrar sesión/i }).click();
    await page.waitForURL(/\/login$/);

    await login(page, user);
    await page.goto("/settings");
    await expect(page.getByTestId("settings-username")).toHaveValue(user.username);
  });

  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-username").fill("no-such-user");
    await page.getByTestId("login-password").fill("wrong-password");
    await page.getByTestId("login-submit").click();

    await expect(
      page.getByText(/incorrect username or password|login failed|error al iniciar sesión/i)
    ).toBeVisible();
  });
});
