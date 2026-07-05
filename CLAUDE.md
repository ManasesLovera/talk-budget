# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Talk Budget is a mobile-first, AI-native personal finance app: a FastAPI backend (SQLAlchemy ORM + JWT auth + AI Agent Gateway) and a Next.js 14 (App Router) frontend, backed by Postgres and Redis, orchestrated with Docker Compose.

## Commands

### Running the stack

```bash
cp example.env .env          # first time only; edit and add OPENCODE_API_KEY
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend → http://localhost:8000 (Swagger docs at `/docs`)
- Postgres → localhost:5433 (mapped off 5432 to avoid host clashes)
- Redis → localhost:6380 (mapped off 6379)

The stack works without a `.env` file — safe defaults live in `backend/app/core/config.py`. Without `OPENCODE_API_KEY` set, the AI chat gateway responds with a "not configured" message instead of erroring.

### Backend (FastAPI)

Run from `backend/` with a Python 3.11 virtualenv, or via `docker compose exec fastapi-backend <cmd>`.

```bash
uvicorn app.main:app --reload          # local dev server (needs DB/Redis reachable)
alembic revision --autogenerate -m "message"
alembic upgrade head
```

Tables are also auto-created on app startup (`init_db()` in `app/services/seed.py`) for dev convenience — Alembic is the production migration path.

### Frontend (Next.js / Bun)

Run from `frontend/`:

```bash
bun install       # or npm install
bun dev           # or npm run dev
bun run build
bun run lint
```

There is no backend test suite configured at present. The frontend has a Playwright end-to-end suite under `frontend/e2e/` (see `frontend/e2e/README.md`) covering auth, the settings currency/language switchers, and the wallets/transactions flow, run against an already-running stack (`docker compose up` or a preview container) via `npx playwright test` from `frontend/`.

## Architecture

### Backend layout (`backend/app/`)

- `core/` — `config.py` (pydantic-settings `Settings`, env-driven, cached via `get_settings`), `database.py` (SQLAlchemy engine/session), `security.py` (password hashing, JWT encode/decode).
- `models/` — SQLAlchemy ORM: `User` (role: `admin`/`user`), `Wallet`, `Category`, `Transaction`, `ChatMessage`. Categories can be global (`owner_id=None`, seeded defaults) or user-owned.
- `schemas/` — Pydantic request/response models, one file per resource.
- `api/` — route modules registered in `main.py`, all mounted under `API_V1_PREFIX` (`/api/v1`): `auth`, `users`, `wallets`, `categories`, `transactions`, `agent`, `chat_history`. `deps.py` provides `get_current_user` and `require_admin` dependencies used for auth/RBAC.
- `services/` — `seed.py` (creates tables + seeds the one admin user + default categories on startup, idempotent) and `ai_gateway.py` (the conversational AI engine, see below).

### Auth & RBAC

JWT-based (`python-jose`), OAuth2 password flow. Two roles: `admin` and `user`.

- Exactly one admin is seeded on startup from `ADMIN_USERNAME`/`ADMIN_PASSWORD`/`ADMIN_EMAIL` env vars (skipped if it already exists).
- `POST /api/v1/auth/register` self-registers plain `user` accounts (no admin registration path).
- `GET /api/v1/users` is gated by `require_admin`.
- Frontend stores the JWT in `localStorage` (`frontend/src/lib/api.ts`) and attaches it as a Bearer token on every request; `auth-context.tsx` wraps the app for client-side auth state.

### AI Agent Gateway (`backend/app/services/ai_gateway.py`)

This is **not** OpenAI or Anthropic — it talks to OpenAI-compatible providers via the `openai` Python SDK. Two providers are supported: **OpenCode** (model `deepseek-v4-flash`) and **Ollama** (model `gemma4:31b-cloud`). `AI_PROVIDER` selects the primary ("opencode" or "ollama"); the other provider is used as an automatic fallback if it has an API key configured (and the primary is unconfigured or its request fails). Config keys: `AI_PROVIDER`, `OPENCODE_API_KEY`/`OPENCODE_BASE_URL`/`OPENCODE_MODEL`, `OLLAMA_API_KEY`/`OLLAMA_BASE_URL`/`OLLAMA_MODEL` (base URLs and models are pinned in `docker-compose.yml` so they can't drift from `.env`).

- `AIGateway.chat()` runs a bounded tool-calling loop (`MAX_TOOL_ROUNDS = 4`) against the user's own financial data.
- Tools are plain Python methods dispatched via `_dispatch_tool`, each scoped to `self.user.id`: `list_transactions`, `create_transaction`, `create_category`, `list_categories`, `list_wallets`. Add new capabilities by adding a function to `TOOLS` and a matching `_tool_*` handler + dispatch entry.
- Reached through `api/agent.py` (`POST /api/v1/agent/chat`); the frontend's `ChatPanel`/`ChatWidget` components call `sendChatMessage`.

### Chat history sync (offline-first)

`frontend/src/lib/db.ts` keeps an IndexedDB cache (via `idb`) of chat messages per `conversationId`, marking each as `synced` or not. `use-chat-history.ts` drives writing locally first, then syncing unsynced messages to the backend (`api/chat_history.py`, `POST /chat-history/sync`) so chat works offline and reconciles when connectivity returns.

### Frontend structure (`frontend/src/`)

- `app/` — App Router pages; `(app)/` is a route group for authenticated pages (`dashboard`, `transactions`, `wallets`, `settings`) sharing `(app)/layout.tsx`, versus `login`/`register` outside it.
- `components/` — `Sidebar`/`BottomNav`/`TopBar` provide responsive navigation (desktop sidebar vs. mobile bottom nav, gated by `lib/use-is-desktop.ts`), `DonutChart` for spending breakdown, `AccountCard`, `ChatPanel`/`ChatWidget` for the AI assistant.
- `lib/api.ts` — single source of truth for backend calls; typed request/response interfaces per resource live here alongside the fetch wrapper.

### Data model notes

- `Wallet.balance` is mutated directly (not derived) when transactions are created — see `_tool_create_transaction` in the AI gateway and the equivalent path in `api/transactions.py` for the pattern of updating wallet balance alongside transaction inserts.
- `Category` rows with `owner_id=None` are global/shared defaults seeded once; user-created categories are scoped to `owner_id`.

## Background session behavior

For background agents working on this project:
- When creating pull requests, use `gh pr create` (open) instead of `gh pr create --draft`. PRs should be open/ready for review, not in draft state.
- When UI changes are made, use the **Playwright MCP** (`mcp__playwright__*`) — not `claude-in-chrome` — to exercise the change and take screenshots in both mobile and desktop viewports, and include them in the pull request description to demonstrate responsiveness. Playwright is the default/first choice for this repo because it drives its own browser and doesn't depend on a Chrome extension being installed/connected; only fall back to `claude-in-chrome` if Playwright is genuinely unavailable.
- Otherwise follow standard background session behavior (use worktrees, commit, push, open PR without asking).

## PR screenshots (required for all frontend changes)

Every PR that touches frontend code MUST include screenshots in both mobile and desktop viewports, embedded as a table in the PR description. Follow this workflow:

1. **Ensure the stack is running** (`docker compose up --build` from the repo root).

2. **Run e2e tests with screenshots enabled** from `frontend/`:
   ```bash
   PR_SCREENSHOTS=1 npx playwright test
   ```
   This saves screenshots to `docs/pr-screenshots/e2e/` — one file per project per checkpoint (e.g. `desktop-modal-income-form.png`, `mobile-modal-income-form.png`).

3. **If the e2e suite doesn't already exercise the new UI**, add test cases that use `maybeScreenshot(page, testInfo, "name")` at key checkpoints so the feature is captured. See `frontend/e2e/wallets-transactions.spec.ts` for examples.

4. **Commit the screenshots** together with the feature changes so raw GitHub URLs are available:
   ```bash
   git add docs/pr-screenshots/e2e/ && git commit -m "docs: add PR screenshots"
   ```

5. **Build a markdown table** in the PR description with side-by-side desktop and mobile screenshots:
   ```markdown
   ## Screenshots

   | Desktop | Mobile |
   |---|---|
   | ![desktop-feature](https://raw.githubusercontent.com/OWNER/REPO/BRANCH/docs/pr-screenshots/e2e/desktop-feature.png) | ![mobile-feature](https://raw.githubusercontent.com/OWNER/REPO/BRANCH/docs/pr-screenshots/e2e/mobile-feature.png) |
   ```

   Raw GitHub URLs follow the pattern:
   `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/docs/pr-screenshots/e2e/{project}-{name}.png`

6. **Update the PR description** via the GitHub API if `gh pr edit` doesn't work reliably:
   ```bash
   gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f body="$(cat /tmp/pr-body.md)"
   ```
