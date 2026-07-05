# End-to-end tests

Playwright tests covering the settings preferences (currency + language
switchers), authentication, and the core wallets/transactions flow. Each
test registers its own throwaway user, so the suite is safe to run against
a shared dev/staging backend.

## Running

The full stack (frontend, backend, Postgres) must already be running —
e.g. via `docker compose up` from the repo root, or a one-off preview
container built from `frontend/Dockerfile`. Playwright does not start the
stack itself.

```bash
# from frontend/
npx playwright install chromium   # first time only
npx playwright test               # defaults to http://localhost:3000

# against a different URL (e.g. a preview container):
PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test
```

Tests run against two projects: `desktop` (1440x900 Chromium) and `mobile`
(Chromium's Pixel 5 emulation — deliberately not a WebKit/iOS device, so
the suite only needs the Chromium browser binary).

## Screenshots for PRs

Screenshots are off by default. Set `PR_SCREENSHOTS=1` to have key
checkpoints (settings in each currency/language, dashboard after a
currency switch, etc.) saved to `docs/pr-screenshots/e2e/` — one file per
project per checkpoint (e.g. `desktop-settings-es.png`,
`mobile-settings-es.png`) — for embedding in a PR description:

```bash
PR_SCREENSHOTS=1 PLAYWRIGHT_BASE_URL=http://localhost:3005 npx playwright test
```

Override the output directory with `PR_SCREENSHOTS_DIR` if needed.
