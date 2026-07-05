import { defineConfig, devices } from "@playwright/test";

// The full stack (frontend + backend + Postgres) is expected to already be
// running, e.g. via `docker compose up` — Playwright's webServer can't easily
// stand up the whole thing, so tests just point at a running instance.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      // Chromium-based mobile emulation (not an iOS/WebKit device) so the
      // suite only needs the Chromium browser binary in CI/sandboxes.
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
