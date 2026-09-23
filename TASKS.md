# TASKS.md — Website Content Audit Tool

This file is the implementation roadmap for AI coding agents and manual development.

Important rule: implement one phase at a time. Do not skip ahead.

---

## Global Rules

- Read `/docs/SPEC.md` before implementation.
- Read `/docs/ARCHITECTURE.md` before implementation.
- Keep route handlers thin.
- Put business logic inside `src/modules/*`.
- Do not add features that are not listed in the current phase.
- Do not add payments, pricing, Stripe, subscriptions, or billing.
- Do not add public authentication in the MVP.
- Do not add RAG, vector DB, chat, widget, PDF upload, or crawling in the MVP.
- Do not commit secrets.
- Use pnpm.
- Use Tailwind CSS + shadcn/ui.
- Ask before changing architecture.

---

## Phase 0 — Testing and CI (ongoing)

Goal: keep the codebase verifiable at every step.

> **Note:** Added 2026-08-12, after Phases 1–3 were already built. Tests and CI
> are not a product feature but a foundation, so this phase does not "finish" —
> each later phase adds the tests for the code it introduces.

Tasks:

- [x] Add Vitest (`pnpm test`, `pnpm test:watch`).
- [x] Cover the audit input schema.
- [x] Add GitHub Actions CI running lint, typecheck and tests on every PR.
- [ ] Cover the SSRF validator (together with Phase 4).
- [ ] Cover LLM JSON validation (together with Phase 5).
- [ ] Cover Markdown/HTML export with golden-file tests (together with Phase 5).
- [ ] Add a Playwright e2e test for the audit happy path (after Phase 6).

Acceptance criteria:

- `pnpm test` runs the unit suite locally.
- CI fails a pull request when lint, typecheck or tests fail.
- New modules with branching logic ship with tests in the same phase.

---

## Phase 1 — Scaffold

Goal: create the technical skeleton only.

Tasks:

- [x] Create Next.js application with TypeScript.
- [x] Configure pnpm.
- [x] Add Tailwind CSS.
- [x] Add shadcn/ui setup.
- [x] Add Dockerfile.
- [x] Connect a hosted Supabase Postgres database. (Superseded the local
      `docker-compose.yml` + postgres container — see SPEC §24.)
- [x] Add Prisma.
- [x] Add initial Prisma schema.
- [x] Add `.env.example`.
- [x] Add `/api/health`.
- [x] Add placeholder landing page `/`.
- [x] Add placeholder report page `/audit/[id]`.
- [x] Add placeholder admin page `/admin`.
- [x] Add recommended folder structure:
  - `src/modules/audit`
  - `src/modules/scraping`
  - `src/modules/ai`
  - `src/modules/export`
  - `src/modules/admin`
  - `src/db`
- [x] Add basic README commands.

Do not implement:

- AI generation.
- Scraping.
- Admin auth.
- Report UI.
- Payments/billing.
- Production deployment.

Acceptance criteria:

- `pnpm install` works.
- `pnpm dev` starts the app against the Supabase database.
- `/` renders.
- `/admin` renders placeholder.
- `/api/health` returns OK.
- Prisma client can be generated.

---

## Phase 2 — Database Schema

Goal: add database models and Prisma workflow.

Tasks:

- [x] Add `Audit` model.
- [ ] Add `RateLimitEvent` model.
- [x] Add `AuditStatus` enum.
- [x] Add `BusinessType` enum.
- [x] Add Prisma migration.
- [x] Add `src/db/prisma.ts`.
- [x] Add basic audit repository.

Acceptance criteria:

- `pnpm prisma:migrate` works.
- `pnpm prisma:generate` works.
- App can connect to local Postgres.
- Repository can create and read an audit.

---

## Phase 3 — Landing and Audit Form

Goal: build the user input flow.

> **Status note:** The `POST /api/audits` scaffold already exists (route → service →
> repository, Zod-validated) — it currently only inserts an audit row with status
> `PROCESSING` (no scrape/AI yet, those arrive in Phases 4–5, so audits created now
> stay `PROCESSING`). Phase 3 is therefore now **frontend only**: build the landing
> page and form that call this existing endpoint.

Tasks:

- [x] Build landing page.
- [x] Add `AuditForm`.
- [x] Add URL input.
- [x] Add business type selector.
- [x] Add optional manual context textarea.
- [x] Add Zod validation.
- [x] Add loading state.
- [x] Add user-friendly validation errors.

Acceptance criteria:

- User can submit valid form data.
- Invalid URLs show validation error.
- Manual context length is limited.
- No report generation yet; form can call placeholder API.

---

## Phase 4 — Safe Website Extraction

Goal: fetch and extract text from homepage safely.

Tasks:

- [x] Implement safe URL validation.
- [x] Implement SSRF protection.
- [x] Block localhost/private/link-local/metadata IPs.
- [x] Implement redirect validation.
- [x] Add fetch timeout.
- [x] Add response size limit.
- [x] Require `text/html`.
- [x] Extract readable text with HTML parser.
- [x] Add fallback for low text extraction.

Acceptance criteria:

- Public HTML sites can be fetched.
- Unsafe URLs are blocked.
- Empty extraction returns useful error.
- Extracted text is stored on audit.

---

## Phase 5 — AI Report Generation

Goal: generate structured report JSON from extracted text.

Tasks:

- [x] Create LLM provider adapter.
- [x] Add prompt template.
- [x] Add clarity category data.
- [x] Add JSON schema validation.
- [x] Generate report JSON.
- [x] Build Markdown report.
- [x] Build HTML FAQ block.
- [x] Store report in DB.
- [x] Set audit status to READY or FAILED.

Acceptance criteria:

- Valid audit generates JSON report.
- Invalid LLM JSON is handled.
- AI does not invent unsupported facts.
- Report includes clarity score and FAQ.

---

## Phase 6 — Report UI and Exports

Goal: show the generated report and allow basic exports.

Tasks:

- [x] Build `/audit/[id]` report page.
- [x] Add report sections.
- [x] Add copy buttons.
- [x] Add Markdown download route.
- [x] Add HTML FAQ block route.
- [x] Add loading, failed, and ready states.
- [x] Hide raw JSON from public UI.

Acceptance criteria:

- User can view report.
- User can copy FAQ.
- User can download Markdown.
- User can copy/download HTML FAQ block.
- Failed audits show useful error.

---

## Phase 7 — Internal Admin

Goal: add simple internal monitoring UI.

Tasks:

- [x] Add `/admin` password form.
- [x] Add signed HTTP-only admin session cookie.
- [x] Add audit table.
- [x] Add filters by status.
- [x] Add `/admin/audits/[id]`.
- [x] Show audit details.
- [x] Show error messages.
- [x] Add delete action.
- [x] Add mark-as-failed action.

Acceptance criteria:

- Admin area requires password.
- Admin can see audit list.
- Admin can inspect audit details.
- Admin can delete audit.
- Secrets are never shown in browser.

---

## Phase 8 — Polish and Hardening

Goal: make the prototype stable and presentable.

Tasks:

- [ ] Add rate limiting.
- [ ] Add user-friendly error states.
- [ ] Add mobile polish.
- [ ] Add Terms page.
- [ ] Add Privacy page.
- [ ] Add basic metadata/SEO.
- [ ] Add production env checks.
- [ ] Add lint/typecheck scripts.
- [ ] Clean README.

Acceptance criteria:

- App looks production-like.
- Common errors are handled.
- No secrets in repo.
- Build, lint, and typecheck pass.

---

## Phase 9 — Go Audit Worker (post-MVP)

Goal: move audit generation from the synchronous POST request into a
background worker written in Go, communicating through a Redis queue.

> **Do not start this phase before Phase 6 is complete and deployed.**
> This phase intentionally changes the architecture described in
> ARCHITECTURE.md §8 (Stage 2 → Stage 3). Update ARCHITECTURE.md first.

### Architecture change

- `POST /api/audits` no longer runs scraping/AI inline. It validates input,
  creates the audit with status `PROCESSING`, pushes a job to Redis,
  and returns immediately.
- The report page polls `GET /api/audits/[id]` until status is `READY` or `FAILED`.
- A separate Go service (`/worker`) consumes jobs from Redis:
  fetch homepage → extract text → call LLM → validate JSON → write report to Postgres.

### Constraints

- Go 1.22+, standard project layout (`cmd/worker`, `internal/...`).
- Redis as the queue (simple `BLPOP`/stream consumer, no heavy frameworks).
- Reuse the existing Postgres schema; the worker writes to the same `Audit` table.
- Reimplement SSRF validation in Go with the same rules as the Node version
  (same blocked ranges, redirect revalidation, timeouts, size limits).
- LLM call goes through a provider adapter, configurable via env vars
  (same env var names as the Next.js app where possible).
- Graceful shutdown: finish the current job, mark stale jobs as FAILED.
- Retry policy: max 1 retry per job, then status FAILED with errorCode.
- Docker: introduce a `docker-compose.yml` with `worker` and `redis` services
  (Postgres stays on Supabase).

### Tasks

- [ ] Update ARCHITECTURE.md (Stage 3 diagram becomes current).
- [ ] Add `redis` service to docker-compose.yml.
- [ ] Scaffold Go module in `/worker` (cmd/worker, internal/queue, internal/scraper, internal/ai, internal/db).
- [ ] Implement Redis job consumer.
- [ ] Port SSRF-safe fetcher + HTML text extraction to Go.
- [ ] Implement LLM adapter in Go with strict JSON schema validation.
- [ ] Write results to Postgres (READY / FAILED + errorCode).
- [ ] Change `POST /api/audits` to enqueue instead of inline generation.
- [ ] Add polling on the report page.
- [ ] Unit tests: SSRF validator, JSON schema validation, queue handler.
- [ ] Update README (run app + worker locally).

### Acceptance criteria

- Submitting an audit returns instantly with `PROCESSING`.
- Worker picks up the job and the report page flips to `READY` without a full
  reload (via polling).
- Killing the worker mid-job does not corrupt data; job ends as FAILED or is
  retried once.
- All SSRF cases blocked in the Node version are blocked in the Go version.
- `docker compose up` starts app + redis + worker.
