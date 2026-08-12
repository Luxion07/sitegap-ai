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
- Cover branching logic, validation, and security code with Vitest tests in the
  same phase that introduces it. Do not test thin wrappers around Prisma.

## Commit Convention

Follow Conventional Commits:

```text
<type>(<scope>): <subject>

<body — why, not what>
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`,
`style`.

Rules:

- Imperative mood: `add`, not `added` or `adds`.
- Lowercase subject, no trailing period, max 72 characters.
- One commit, one idea. An `and` in the subject usually means two commits.
- The body explains **why** the change was needed — the diff already shows what
  changed.

## Task Discipline

Implement only the current phase from `TASKS.md`.

If a requested change touches future phases, stop and ask for confirmation.
