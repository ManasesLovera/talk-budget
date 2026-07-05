import type { Page } from "@playwright/test";

export interface TestUser {
  username: string;
  email: string;
  password: string;
}

export function makeTestUser(prefix: string): TestUser {
  const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const username = `${prefix}${unique}`;
  return {
    username,
    email: `${username}@example.com`,
    password: "Passw0rd!23",
  };
}

/**
 * Registers a fresh user via the UI and waits until the app navigates away
 * from /register (the post-login landing route differs by viewport — mobile
 * stays on the chat page, desktop redirects to /dashboard — so callers
 * should navigate explicitly to whatever page the test needs next).
 */
export async function registerAndLogin(page: Page, user: TestUser): Promise<void> {
  await page.goto("/register");
  await page.getByTestId("register-username").fill(user.username);
  await page.getByTestId("register-email").fill(user.email);
  await page.getByTestId("register-password").fill(user.password);
  await page.getByTestId("register-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/register"), { timeout: 15_000 });
  await waitForAuthedShell(page);
}

export async function login(page: Page, user: Pick<TestUser, "username" | "password">): Promise<void> {
  await page.goto("/login");
  await page.getByTestId("login-username").fill(user.username);
  await page.getByTestId("login-password").fill(user.password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
  await waitForAuthedShell(page);
}

/**
 * The authenticated (app) layout shows a "Loading…" placeholder until
 * getMe() resolves. Wait for the app shell (only rendered once a user is
 * loaded) before navigating further, otherwise a `page.goto` immediately
 * after login can race the auth check and bounce back to /login.
 */
async function waitForAuthedShell(page: Page): Promise<void> {
  await page.getByTestId("app-shell").waitFor({ timeout: 15_000 });
}
