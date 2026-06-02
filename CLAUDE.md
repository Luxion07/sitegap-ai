# CLAUDE.md / AGENTS.md

## Role

You are helping build the Website FAQ & Gap Audit MVP.

This is a small paid report-generation product, not a full AI platform.

## Required Reading Before Coding

Always read these files first:

```text
/docs/SPEC.md
/docs/ARCHITECTURE.md
/TASKS.md
```

Then implement only the requested phase from `TASKS.md`.

## Product Summary

The product lets a user enter a business website URL and optional manual text.

The app analyzes the homepage, generates a structured FAQ/gap audit report, shows a free preview, and unlocks the full report after a one-time Stripe payment.

## MVP Boundaries

Do not implement these unless explicitly requested later:

```text
- user accounts
- subscriptions
- RAG
- vector database
- chat widget
- PDF upload
- multi-page crawling
- Firecrawl integration
- NestJS or separate Express backend
- microservices
- teams/workspaces
```

## Architecture Rules

Use a Next.js fullstack modular monolith.

Keep route handlers thin.

Business logic belongs in modules:

```text
src/modules/audit
src/modules/scraping
src/modules/ai
src/modules/billing
src/modules/export
src/modules/admin
```

Database access should go through repository/service functions, not random Prisma calls everywhere.

## Coding Rules

```text
- Use TypeScript.
- Prefer clear code over clever abstractions.
- Validate inputs at API boundaries.
- Handle errors explicitly.
- Keep functions small and readable.
- Do not hardcode secrets.
- Do not expose server-only environment variables to the browser.
- Do not commit .env or .env.local.
- Update .env.example when adding required env vars.
```

## Security Rules

```text
- Block scraping of localhost, private IPs, internal network addresses, and file URLs.
- Do not trust success URLs for payment fulfillment.
- Stripe unlock must happen through webhook confirmation.
- Admin routes must be protected.
- Admin password and session secret must come from env vars.
```

## Git Rules

Use a private GitHub repository.

Never commit:

```text
.env
.env.local
OpenAI API keys
Stripe secret keys
Stripe webhook secrets
production DATABASE_URL
admin passwords
```

Commit:

```text
.env.example
README.md
SPEC.md
ARCHITECTURE.md
TASKS.md
```

## Commit & Branch Conventions

Help the user with correct branch names and commit messages following
Conventional Commits. Propose them; only actually commit when asked.

Commit message format:

```text
type(scope): short imperative summary
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`,
`build`, `ci`.
Scope = the module/area: `audit`, `scraping`, `ai`, `billing`, `admin`,
`export`, `db`, `spec`.

Examples:

```text
feat(scraping): add SSRF-safe homepage fetcher
fix(billing): unlock report only after webhook confirmation
docs(spec): add clarity scorecard criteria
```

Rules:

```text
- Subject in imperative mood ("add", not "added"), under ~72 chars.
- Optional body explains WHY, not what.
- Keep the required Co-Authored-By footer.
```

Branch naming: `type/short-kebab-description`, tied to the phase when relevant.

```text
feat/phase-4-scraping
fix/webhook-signature
```

Never commit directly to `main` — branch first, then open a PR.

## Working Style

When asked to implement a phase:

```text
1. Read the relevant docs.
2. Summarize the phase briefly.
3. Check the phase's "Recommended model" in TASKS.md. If the active session
   model is lower than recommended (e.g. Sonnet while the phase wants Opus),
   remind the user to switch with /model before starting. If they proceed
   anyway, respect that and continue.
4. Implement only that phase.
5. Do not implement future phases.
6. Mention what files changed.
7. Mention how to run/test it.
```

If the requested change conflicts with the architecture, ask before changing it.

## Project Memory

Treat this CLAUDE.md as the project's persistent memory. Durable, project-level
preferences and conventions go here (it travels with the repo). Do not store
notes for this project in the global `~/.claude` memory profile — that profile
belongs to a separate work context and must not be mixed with this personal
project.

## Teaching Mode

This is a learning project. When writing or changing code, explain it like a
teacher so the user follows the system design and does not get lost:

```text
- For each new class/module/file: say what it is and why it exists (its role).
- Name design patterns explicitly when used (facade, adapter, repository,
  singleton, factory, strategy, etc.) and explain why that pattern fits here.
- For non-trivial algorithms: walk through how they work step by step.
- Connect each change to the bigger architecture: which module, which layer,
  how it talks to the rest of the system.
- Define jargon the first time it appears; prefer plain language.
```

Keep explanations concise and tied to the code just written — teach the "why"
behind this project's choices, not a generic textbook lecture.
