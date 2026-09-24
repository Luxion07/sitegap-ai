# SiteGap AI

SiteGap AI is a technical prototype for analyzing public website content and generating structured FAQ and content-gap audit reports.

Core engineering areas covered in this repository:

- Next.js fullstack architecture
- TypeScript
- PostgreSQL and Prisma
- AI-assisted report generation
- Admin tooling

This repository does not include production credentials, customer data, or commercial deployment configuration.

---

## What it does

A visitor pastes a public website URL and picks a business type. The app:

1. Safely fetches the homepage (SSRF-protected: blocks private/loopback/link-local IPs, revalidates every redirect).
2. Extracts readable text from the page.
3. Sends that text to an LLM to generate a structured report: a clarity score, questions the site already answers, questions it's missing, a ready-to-use FAQ, and a content improvement checklist.
4. Shows the report at `/audit/[id]`, with Markdown and HTML FAQ exports.

An internal `/admin` area (password-protected, signed session cookie) lists all audits, lets an operator inspect a report's raw JSON, delete an audit, or manually mark one as failed.

Audit creation is rate-limited per IP (3/hour, 10/day) to keep LLM costs bounded.

See `docs/SPEC.md` for the full functional spec and `docs/ARCHITECTURE.md` for the system design.

---

## Tech Stack

- Next.js App Router
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- PostgreSQL (Supabase)
- Prisma
- LLM provider adapter (Gemini primary, optional Groq fallback)
- Vitest

---

## Project Docs

```text
/docs/SPEC.md
/docs/ARCHITECTURE.md
/TASKS.md
/AGENTS.md
/CLAUDE.md
```

Read these before implementation:

1. `docs/SPEC.md`
2. `docs/ARCHITECTURE.md`
3. `TASKS.md`

---

## Local Development

The database is hosted on Supabase — there is no local Postgres container.
Fill in `.env` before running migrations (see [Environment Variables](#environment-variables)).

```bash
cp env.example .env
pnpm install          # also runs prisma generate
pnpm prisma:migrate
pnpm dev
```

Prisma commands:

```bash
pnpm prisma:generate
pnpm prisma:migrate    # create + apply a migration locally
pnpm prisma:deploy     # apply existing migrations (CI/production)
pnpm prisma:studio
```

Other scripts:

```bash
pnpm test          # run the Vitest suite once
pnpm test:watch    # watch mode
pnpm lint          # ESLint
pnpm typecheck     # next typegen + tsc --noEmit
pnpm format        # Prettier, writes in place
pnpm build         # runs typecheck + lint first (prebuild), then next build
```

---

## Environment Variables

See `env.example` for the full list with comments. Grouped by what they're for:

- **Database** — `DATABASE_URL`, `DIRECT_URL` (Supabase connection strings).
- **App** — `NEXT_PUBLIC_APP_URL`, `NODE_ENV`.
- **LLM provider** (Phase 5) — `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, and an optional `LLM_FALLBACK_*` trio.
- **Admin** (Phase 7) — `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` (signs the session cookie).
- **Rate limiting** (Phase 8) — `RATE_LIMIT_SALT` (hashes client IPs before they're stored).

In production, `src/instrumentation.ts` checks that every required variable is set at server startup and fails fast if one is missing, instead of letting the server boot into a broken state.

Never commit `.env` or `.env.local`.

---

## Development Rules

- Implement one phase at a time (see `TASKS.md`).
- Keep route handlers thin.
- Put business logic in `src/modules/*`.
- Cover branching logic, validation, and security code with Vitest tests in the same phase that introduces it.
- Do not commit secrets.
- Do not add unplanned features without updating `TASKS.md`.
