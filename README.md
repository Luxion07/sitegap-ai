# Website FAQ & Gap Audit

A small MVP that turns a business website homepage into a FAQ and customer information gap audit.

## MVP Summary

User flow:

```text
Enter website URL
  -> generate audit report
  -> show free preview
  -> pay one-time Stripe fee
  -> unlock full report
```

## Documentation

```text
/docs/SPEC.md
/docs/ARCHITECTURE.md
/TASKS.md
/CLAUDE.md or /AGENTS.md
```

## Local Development Goal

The final scaffold should support:

```bash
docker compose up
```

Then open:

```text
http://localhost:3000
```

## Environment Variables

Copy:

```bash
cp .env.example .env
```

Then fill the missing values.

## MVP Tech Stack

```text
Next.js
TypeScript
PostgreSQL
Prisma
Stripe Checkout
Docker Compose
```

## Important MVP Boundaries

Do not implement in the first version:

```text
RAG
vector database
chat widget
PDF upload
multi-page crawling
subscriptions
user accounts
microservices
```
