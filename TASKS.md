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
- Do not add chat, widget, PDF upload, or crawling in the MVP.
- RAG and vector search only as scoped in Phase 10 (see AGENTS.md).
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
- [x] Cover the SSRF validator (together with Phase 4).
- [x] Cover LLM JSON validation (together with Phase 5).
- [x] Cover Markdown/HTML export (together with Phase 5) — point assertions,
      not strict golden-file comparison; revisit if export format churns.
- [ ] Add a Playwright e2e test for the audit happy path (after Phase 6).
      Deferred 2026-09-23: the happy path needs a real scrape + real LLM
      call, and Playwright can only intercept browser network traffic, not
      the server-side fetch inside generateReport(). A real e2e run either
      costs money and depends on the network every time, or needs a mocked
      LLM provider reachable from CI - neither fits this project's scope
      right now. Revisit once there's a concrete reason (e.g. a CI budget,
      or a test double for the LLM provider already exists for other work).

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
- [x] Add `RateLimitEvent` model. (Added in Phase 8, alongside the rate
      limiter code that actually writes to it — YAGNI deferral from Phase 2.)
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

- [x] Add rate limiting.
- [x] Add user-friendly error states.
- [x] Add mobile polish.
- [x] Add Terms page.
- [x] Add Privacy page.
- [x] Add basic metadata/SEO.
- [x] Add production env checks.
- [x] Add lint/typecheck scripts.
- [x] Clean README.

Acceptance criteria:

- App looks production-like.
- Common errors are handled.
- No secrets in repo.
- Build, lint, and typecheck pass.

---

## Phase 9 — Async Audit Worker (Redis + BullMQ, with Go Worker Spike)

Goal: move audit generation from the synchronous POST request into a
background worker communicating through a Redis queue.

> **Architecture Decision (ADR, 2026-10-26):** We prototyped a standalone Go
> worker (`BLPOP` + `pgxpool` + graceful shutdown) in `experiments/go-worker`.
> After completing Phases 10 (pgvector RAG) and 11 (MCP server), we chose
> **TypeScript + BullMQ** (`src/worker`) for the production worker so that
> `scraping`, `knowledge` (RAG), `ai` (prompts, Zod schemas, provider fallback),
> and `export` remain a single source of truth shared across Next.js, the MCP
> server, and the background worker without cross-language duplication.

### Architecture change

- `POST /api/audits` no longer runs scraping/AI inline. It validates input,
  creates the audit with status `PROCESSING`, enqueues a job in Redis (`BullMQ`),
  and returns `201 Created` immediately.
- The report page polls `GET /api/audits/[id]` until status is `READY` or `FAILED`.
- A separate worker process (`src/worker`, started via `pnpm worker`) consumes
  jobs from Redis and runs the existing `src/modules/*` pipeline:
  fetch homepage → extract text → retrieve RAG tips → call LLM → validate JSON → write report to Postgres.
- The Go consumer spike lives in `experiments/go-worker` with its own unit tests and ADR.

### Constraints

- Redis + `BullMQ` (`ioredis`) for queue management.
- Reuse existing `src/modules/*` domain logic and Prisma schema (single source of truth).
- Retry policy: max 2 attempts (1 initial + 1 retry) with backoff, then mark audit `FAILED` with `statusMessage`.
- Graceful shutdown on `SIGINT` / `SIGTERM`: wait for in-flight jobs before closing the worker.
- Docker: `docker-compose.yml` provides `redis` for local development (Postgres stays on Supabase).

### Tasks

- [x] Update ARCHITECTURE.md (Stage 3 diagram becomes current).
- [x] Add `redis` service to docker-compose.yml.
- [x] Build Go worker spike (`experiments/go-worker`: config, `BLPOP` consumer, `pgxpool` DB client, graceful shutdown, unit tests).
- [ ] Add `bullmq` and `ioredis` dependencies and configure Redis queue in `src/modules/queue` (or `src/worker`).
- [ ] Implement BullMQ worker process in `src/worker` reusing `src/modules/*` pipeline + retry & graceful shutdown.
- [ ] Change `POST /api/audits` (and `createAuditService`) to enqueue jobs instead of running inline generation.
- [ ] Add `GET /api/audits/[id]` endpoint and polling on `/audit/[id]` report page.
- [ ] Unit tests for queue producer/worker handler.
- [ ] Update README (how to run app + Redis + worker locally).

### Acceptance criteria

- Submitting an audit returns instantly with `PROCESSING`.
- Worker picks up the job and the report page flips to `READY` without a full
  reload (via polling).
- Killing the worker mid-job or failing an attempt retries once and then marks
  the audit `FAILED` cleanly.
- All unit tests pass (`pnpm test` and `go test ./...` inside `experiments/go-worker`).

---

## Phase 10 — Tips Knowledge Base (pgvector + RAG)

Goal: ground each report in curated tips for that kind of business. Tips live
in Postgres (pgvector); before the LLM call only the most relevant ones are
retrieved and added to the prompt.

> **Added 2026-10-02, done before Phase 9** (see the pause note there). RAG runs
> over the curated tips only, never over the scraped page — the page text
> already fits in the prompt.

### Design

- Tips are hand-written Markdown, one file per `BusinessType`, kept in the repo.
- `BusinessType` is coarse (a plumber and a dentist are both `LOCAL_SERVICE`).
  Retrieval filters by business type, then ranks by similarity to the page —
  similarity is what picks plumbing tips over dental ones.
- Embeddings come from Gemini (same API key as the LLM). Groq has no embeddings
  API, so there is no embeddings fallback.
- 768 dimensions: pgvector's HNSW index supports at most 2,000 dimensions for
  the `vector` type.
- Prisma can't read or write `vector` columns, so similarity search uses
  `$queryRaw` with bound parameters — never string-built SQL.
- If retrieval fails, the report is generated without tips (graceful
  degradation). Tips improve a report; they are not required for one.

### Tasks

- [x] Update AGENTS.md, SPEC.md and ARCHITECTURE.md.
- [x] Enable the `vector` extension in a Prisma migration.
- [x] Add a `KnowledgeChunk` model: business type, source file, content,
      content hash, `vector(768)` embedding.
- [x] Add an HNSW index on the embedding (cosine distance).
- [x] Write the tips files (`src/modules/knowledge/tips/*.md`).
- [x] Add an embeddings adapter (same pattern as the LLM providers).
- [x] Add `pnpm knowledge:ingest`: split files into chunks → embed → save.
      Unchanged chunks are skipped (content hash), so re-runs are cheap.
- [x] Add retrieval: embed page text + manual context (trimmed to the
      embedding input limit), return top-k chunks by cosine distance,
      filtered by business type.
- [x] Pass retrieved tips into the user prompt as reference data, clearly
      separated from instructions.
- [x] Generate the report without tips when retrieval fails.
- [x] Run `EXPLAIN ANALYZE` on the similarity query. Note whether the HNSW
      index is used — on a small table Postgres may pick a sequential scan.
- [x] Tests: chunking, prompt with and without tips, fallback path.

### Acceptance criteria

- `pnpm knowledge:ingest` fills the table; a second run adds no duplicates.
- A plumber's site gets trade tips, not dental tips.
- Reports still generate when the embeddings API is down.

---

## Phase 11 — MCP Server

Goal: let MCP clients (Claude Code, Claude Desktop) use sitegap-ai's features
as tools.

> **Added 2026-10-02, done before Phase 9** (see the pause note there).

### Design

- A second entry point next to the route handlers, not a new service. Tools are
  thin: validate input with Zod, call an existing `src/modules/*` service,
  return the result. No business logic in the MCP layer.
- Runs outside Next.js, so the modules it calls must not import `next/*`.
- Transport: stdio. The client starts the server as a local process; there is
  no network port, so no auth in this phase.
- Only read and create actions. Admin actions (delete, mark as failed) are not
  exposed: least privilege.
- Rate limiting is per IP and does not apply over stdio. Acceptable while the
  server is local-only.

### Tasks

- [x] Add `@modelcontextprotocol/sdk` and a `pnpm mcp` script (stdio server).
- [x] Tool `search_tips` → Phase 10 retrieval.
- [x] Tool `create_audit` → the same audit service as `POST /api/audits`.
- [x] Tool `get_audit` → status and report for an audit id.
- [x] Validate tool inputs with Zod, reusing existing schemas where they exist.
- [x] Return failures as MCP tool errors with a safe message, no stack traces.
- [x] Register the server in Claude Code (`.mcp.json`) and run each tool from
      a real client.
- [x] Tests: input validation and error mapping for each tool.
- [x] Update README: how to connect a client.

### Acceptance criteria

- Claude Code lists the three tools after connecting.
- `create_audit` with a private-IP URL is blocked, same as the web form.
- `get_audit` with an unknown id returns a clear tool error, not a crash.
- No admin or destructive actions are exposed.
