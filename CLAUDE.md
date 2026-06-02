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

## Working Style

When asked to implement a phase:

```text
1. Read the relevant docs.
2. Summarize the phase briefly.
3. Implement only that phase.
4. Do not implement future phases.
5. Mention what files changed.
6. Mention how to run/test it.
```

If the requested change conflicts with the architecture, ask before changing it.
