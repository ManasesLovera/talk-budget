import fs from "fs";
import path from "path";
import type { Page, TestInfo } from "@playwright/test";

// Screenshots are opt-in: set PR_SCREENSHOTS=1 when running the suite to
// additionally capture named checkpoints for embedding in a PR description
// (see docs/pr-screenshots/). Normal test runs skip this entirely.
const ENABLED = process.env.PR_SCREENSHOTS === "1";
const OUT_DIR =
  process.env.PR_SCREENSHOTS_DIR ??
  path.join(__dirname, "..", "..", "..", "docs", "pr-screenshots", "e2e");

export async function maybeScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  if (!ENABLED) return;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const project = testInfo.project.name; // "desktop" | "mobile"
  await page.screenshot({ path: path.join(OUT_DIR, `${project}-${name}.png`) });
}
