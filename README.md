# SiteGap AI

SiteGap AI is a technical prototype for analyzing public website content and generating structured FAQ and content-gap audit reports.

Core engineering areas covered in this repository:

- Next.js fullstack architecture
- TypeScript
- PostgreSQL and Prisma
- AI-assisted report generation
- Admin tooling
- Docker-based local development

This repository does not include production credentials, customer data, or commercial deployment configuration.

---

## Tech Stack

- Next.js App Router
- TypeScript
- pnpm
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- Docker Compose
- LLM provider adapter

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

```bash
cp .env.example .env
pnpm install
docker compose up --build
```

Prisma commands:

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

App:

```bash
pnpm dev
```

---

## Environment Variables

See `.env.example`.

Never commit `.env` or `.env.local`.

---

## Development Rules

- Implement one phase at a time.
- Keep route handlers thin.
- Put business logic in `src/modules/*`.
- Do not commit secrets.
- Do not add unplanned features without updating `TASKS.md`.
