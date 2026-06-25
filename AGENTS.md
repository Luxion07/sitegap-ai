<!-- BEGIN:nextjs-agent-rules -->
# Next.js Project Rules

This project may use a newer Next.js version with APIs and conventions that differ from older training data.

Before writing or changing Next.js-specific code:
- Check the installed Next.js docs available in `node_modules/next/dist/docs/` when possible.
- Follow current App Router conventions.
- Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Instructions for AI Agents

Read these files before implementation:

1. `/docs/SPEC.md`
2. `/docs/ARCHITECTURE.md`
3. `/TASKS.md`

## Scope

This is a technical prototype for website content analysis and FAQ/content-gap report generation.

Do not add:

- Payments
- Pricing
- Stripe
- Billing
- Subscriptions
- Public user accounts
- RAG
- Vector database
- Chat widget
- PDF upload
- Multi-page crawling
- CRM integrations

unless explicitly requested and the docs are updated first.

## Implementation Rules

- Use pnpm.
- Use Next.js App Router.
- Use TypeScript.
- Use Tailwind CSS + shadcn/ui.
- Use PostgreSQL + Prisma.
- Keep route handlers thin.
- Put business logic in `src/modules/*`.
- Keep provider-specific LLM logic behind an adapter.
- Never commit secrets.
- Ask before changing architecture.

## Task Discipline

Implement only the current phase from `TASKS.md`.

If a requested change touches future phases, stop and ask for confirmation.
