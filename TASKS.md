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

## Phase 1 — Scaffold

Goal: create the technical skeleton only.

Tasks:

- [ ] Create Next.js application with TypeScript.
- [ ] Configure pnpm.
- [ ] Add Tailwind CSS.
- [ ] Add shadcn/ui setup.
- [ ] Add Dockerfile.
- [ ] Add docker-compose.yml with app + postgres.
- [ ] Add Prisma.
- [ ] Add initial Prisma schema.
- [ ] Add `.env.example`.
- [ ] Add `/api/health`.
- [ ] Add placeholder landing page `/`.
- [ ] Add placeholder report page `/audit/[id]`.
- [ ] Add placeholder admin page `/admin`.
- [ ] Add recommended folder structure:
  - `src/modules/audit`
  - `src/modules/scraping`
  - `src/modules/ai`
  - `src/modules/export`
  - `src/modules/admin`
  - `src/db`
- [ ] Add basic README commands.

Do not implement:

- AI generation.
- Scraping.
- Admin auth.
- Report UI.
- Payments/billing.
- Production deployment.

Acceptance criteria:

- `pnpm install` works.
- `docker compose up --build` starts app and postgres.
- `/` renders.
- `/admin` renders placeholder.
- `/api/health` returns OK.
- Prisma client can be generated.

---

## Phase 2 — Database Schema

Goal: add database models and Prisma workflow.

Tasks:

- [ ] Add `Audit` model.
- [ ] Add `RateLimitEvent` model.
- [ ] Add `AuditStatus` enum.
- [ ] Add `BusinessType` enum.
- [ ] Add Prisma migration.
- [ ] Add `src/db/prisma.ts`.
- [ ] Add basic audit repository.

Acceptance criteria:

- `pnpm prisma:migrate` works.
- `pnpm prisma:generate` works.
- App can connect to local Postgres.
- Repository can create and read an audit.

---

## Phase 3 — Landing and Audit Form

Goal: build the user input flow.

Tasks:

- [ ] Build landing page.
- [ ] Add `AuditForm`.
- [ ] Add URL input.
- [ ] Add business type selector.
- [ ] Add optional manual context textarea.
- [ ] Add Zod validation.
- [ ] Add loading state.
- [ ] Add user-friendly validation errors.

Acceptance criteria:

- User can submit valid form data.
- Invalid URLs show validation error.
- Manual context length is limited.
- No report generation yet; form can call placeholder API.

---

## Phase 4 — Safe Website Extraction

Goal: fetch and extract text from homepage safely.

Tasks:

- [ ] Implement safe URL validation.
- [ ] Implement SSRF protection.
- [ ] Block localhost/private/link-local/metadata IPs.
- [ ] Implement redirect validation.
- [ ] Add fetch timeout.
- [ ] Add response size limit.
- [ ] Require `text/html`.
- [ ] Extract readable text with HTML parser.
- [ ] Add fallback for low text extraction.

Acceptance criteria:

- Public HTML sites can be fetched.
- Unsafe URLs are blocked.
- Empty extraction returns useful error.
- Extracted text is stored on audit.

---

## Phase 5 — AI Report Generation

Goal: generate structured report JSON from extracted text.

Tasks:

- [ ] Create LLM provider adapter.
- [ ] Add prompt template.
- [ ] Add clarity category data.
- [ ] Add JSON schema validation.
- [ ] Generate report JSON.
- [ ] Build Markdown report.
- [ ] Build HTML FAQ block.
- [ ] Store report in DB.
- [ ] Set audit status to READY or FAILED.

Acceptance criteria:

- Valid audit generates JSON report.
- Invalid LLM JSON is handled.
- AI does not invent unsupported facts.
- Report includes clarity score and FAQ.

---

## Phase 6 — Report UI and Exports

Goal: show the generated report and allow basic exports.

Tasks:

- [ ] Build `/audit/[id]` report page.
- [ ] Add report sections.
- [ ] Add copy buttons.
- [ ] Add Markdown download route.
- [ ] Add HTML FAQ block route.
- [ ] Add loading, failed, and ready states.
- [ ] Hide raw JSON from public UI.

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

- [ ] Add `/admin` password form.
- [ ] Add signed HTTP-only admin session cookie.
- [ ] Add audit table.
- [ ] Add filters by status.
- [ ] Add `/admin/audits/[id]`.
- [ ] Show audit details.
- [ ] Show error messages.
- [ ] Add delete action.
- [ ] Add mark-as-failed action.

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
