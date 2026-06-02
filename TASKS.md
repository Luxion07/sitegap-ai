# TASKS.md

## Purpose

This file breaks the Website FAQ & Gap Audit MVP into small implementation phases.

Claude/Codex must implement one phase at a time. Do not jump ahead. Do not add features that are not listed in the current phase.

---

## Global Rules for AI Coding Agents

Before coding, read:

```text
/docs/SPEC.md
/docs/ARCHITECTURE.md
/TASKS.md
/CLAUDE.md or /AGENTS.md
```

Rules:

```text
- Implement only the current phase.
- Keep route handlers thin.
- Put business logic inside /src/modules.
- Do not hardcode secrets.
- Do not commit .env or .env.local.
- Do not add RAG, vector DB, chat, PDF upload, subscriptions, or user accounts in MVP.
- Do not introduce NestJS/Express unless explicitly requested later.
- Ask before changing architecture.
- Prefer simple, readable code over clever abstractions.
```

---

## Recommended Model Per Phase

Each phase below lists a recommended Claude model.

```text
Sonnet 4.6  — default workhorse: scaffolding, CRUD, UI, configs, glue code.
Opus 4.8    — high-stakes / hard-thinking work: security, payments, prompt
              engineering, gnarly debugging. Worth the extra cost where a bug
              means a security hole, lost money, or low-quality AI output.
```

Switch with the `/model` command in the session.

Rule for the AI agent: when the user asks to implement a phase, check the
recommended model for that phase. If the active session model is lower than
recommended (e.g. Sonnet while the phase wants Opus), **remind the user to
switch before starting**. If they choose to proceed anyway, that's fine — just
flag it once.

---

# Phase 1: Project Scaffold

**Recommended model:** Sonnet 4.6 — boilerplate scaffolding, no tricky logic.

## Goal

Create the initial project skeleton.

## Scope

Implement:

```text
- Next.js app with TypeScript
- App Router
- ESLint / Prettier
- Dockerfile
- docker-compose.yml
- PostgreSQL service
- Prisma setup
- .env.example
- basic folder structure
- basic landing page placeholder
- basic /admin placeholder page
- healthcheck route
```

## Required Structure

```text
src/
  app/
    page.tsx
    admin/page.tsx
    api/health/route.ts

  modules/
    audit/
    scraping/
    ai/
    billing/
    export/
    admin/

  db/
    prisma.ts

prisma/
  schema.prisma
```

## Do Not Implement Yet

```text
- Stripe
- AI generation
- scraping
- audit creation
- admin auth
- report pages
- payment flow
```

## Acceptance Criteria

```text
- docker compose up starts app and postgres
- app opens on localhost
- /api/health returns ok
- Prisma client is configured
- .env.example exists
- README has local setup instructions
```

---

# Phase 2: Database Schema

**Recommended model:** Sonnet 4.6 — schema is already specified in SPEC.

## Goal

Add the initial database models.

## Scope

Create Prisma models for:

```text
Audit
```

Minimum Audit fields:

```text
id
websiteUrl
businessType
manualText
email
status
paymentStatus
extractedText
previewReportJson
fullReportJson
errorMessage
stripeCheckoutSessionId
stripePaymentIntentId
fullAccessToken
createdAt
updatedAt
```

Enums:

```text
AuditStatus: PENDING, PROCESSING, READY, FAILED
PaymentStatus: FREE, PENDING, PAID, REFUNDED
```

## Acceptance Criteria

```text
- Prisma migration exists
- Audit table is created
- Prisma client can read/write Audit records
```

---

# Phase 3: Audit Creation API

**Recommended model:** Sonnet 4.6 — standard validation + repository wiring.

## Goal

Allow users to submit a website URL and optional manual text.

## Scope

Implement:

```text
POST /api/audits
GET /api/audits/[id]
```

`POST /api/audits` should:

```text
- validate websiteUrl
- validate optional businessType
- validate optional manualText
- create Audit with status PENDING
- return audit id
```

## Acceptance Criteria

```text
- invalid URLs are rejected
- valid audits are stored
- route handlers call audit service/repository
- route handlers do not contain business logic directly
```

---

# Phase 4: Basic Homepage Scraping

**Recommended model:** Opus 4.8 — SSRF protection is security-critical; a
mistake here is an exploitable hole.

## Goal

Fetch and extract readable text from a single homepage URL.

## Scope

Implement:

```text
scraperService.scrapeHomepage(url)
basicScraper provider
```

The scraper should:

```text
- fetch only the submitted URL
- block localhost/private/internal IP targets
- apply timeout
- limit response size
- extract readable text from HTML
- remove scripts/styles/nav noise as much as possible
```

## Do Not Implement Yet

```text
- Firecrawl
- sitemap crawling
- multi-page crawling
- PDF extraction
```

## Acceptance Criteria

```text
- homepage text can be extracted from normal public websites
- unsafe/private URLs are rejected
- extraction errors are saved to Audit.errorMessage
```

---

# Phase 5: AI Report Generation

**Recommended model:** Opus 4.8 — prompt engineering, strict-JSON handling, and
the Clarity Scorecard directly determine product quality.

## Goal

Generate the first structured audit report from extracted website text and optional manual text.

## Scope

Implement:

```text
ai/report-generator.ts
ai/prompts.ts
ai/schemas.ts
```

The AI response should follow the JSON schema defined in SPEC.md.

The report should include:

```text
- clarity score + category breakdown (see SPEC "Clarity Scorecard")
- business summary
- detected services/products
- questions already answered
- missing customer questions
- ready-to-publish FAQ
- website improvement checklist
- HTML FAQ block
```

Notes:

```text
- The clarity categories live in ai/prompts.ts as data (tunable later).
- Use scope-honest language: judge only the analyzed page(s), never claim a
  fact is absent from the whole website.
```

## Acceptance Criteria

```text
- generated report is valid JSON
- invalid AI JSON is handled safely
- full report is saved to DB
- preview report is derived from full report
- audit status becomes READY or FAILED
```

---

# Phase 6: Preview and Full Report Pages

**Recommended model:** Sonnet 4.6 — mostly UI; bump to Opus if the
paid/token gating logic gets tricky.

## Goal

Show a free preview and locked full report.

## Scope

Implement:

```text
/audit/[id]
```

Behavior:

```text
- if audit is READY and unpaid: show preview + unlock button
- if audit is PAID and fullAccessToken is valid: show full report
- if audit is PROCESSING: show processing state
- if audit is FAILED: show failure state
```

Export MVP:

```text
- copy sections
- download Markdown
- copy HTML FAQ block
```

## Acceptance Criteria

```text
- unpaid users cannot access full report
- preview is useful but limited
- full report page is clean and production-looking
```

---

# Phase 7: Stripe Checkout

**Recommended model:** Opus 4.8 — payments + webhook trust + report unlock; a
bug means lost money or a bypassed paywall.

## Goal

Allow one-time payment to unlock the full report.

## Scope

Implement:

```text
POST /api/stripe/create-checkout-session
POST /api/stripe/webhook
/success
/cancel
```

Payment model:

```text
- one-time payment
- default price: $19
- audit id stored in Stripe metadata
```

Webhook must handle:

```text
checkout.session.completed
```

On successful payment:

```text
- find audit by metadata.auditId
- mark paymentStatus as PAID
- store stripeCheckoutSessionId
- store stripePaymentIntentId if available
- generate or confirm fullAccessToken
```

## Acceptance Criteria

```text
- success page alone does not unlock report
- only webhook-confirmed payment unlocks report
- Stripe secrets are never exposed client-side
```

---

# Phase 8: Internal Admin MVP

**Recommended model:** Sonnet 4.6 — straightforward; the auth is a simple
env-password + signed cookie pattern.

## Goal

Create minimal owner-only admin controls.

## Scope

Implement:

```text
/admin
/admin/audits/[id]
```

Auth:

```text
- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET
- signed HTTP-only cookie
```

Admin list should show:

```text
- audit id
- website URL
- business type
- email
- status
- payment status
- created date
- updated date
```

Admin detail should show:

```text
- audit metadata
- extracted text length
- preview JSON
- full JSON
- error message
- Stripe ids
```

Admin actions:

```text
- open preview
- open full report as admin
- delete audit
- manually mark as PAID
- manually mark as FAILED
```

## Acceptance Criteria

```text
- /admin is not public
- admin secrets are not exposed
- basic recovery actions work
```

---

# Phase 9: UI Polish

**Recommended model:** Sonnet 4.6 — styling, copy, and responsive tweaks.

## Goal

Make the MVP feel production-ready enough to show users.

## Scope

Improve:

```text
- landing page
- audit form
- loading states
- report page layout
- pricing block
- unlock CTA
- error states
- admin table readability
```

## Acceptance Criteria

```text
- UI feels clean and trustworthy
- no obvious placeholder copy remains
- mobile layout is usable
```

---

# Phase 10: Deployment Preparation

**Recommended model:** Sonnet 4.6 — configs, env checklist, deploy notes.

## Goal

Prepare for deployment to DigitalOcean or another production host.

## Scope

Add:

```text
- production Dockerfile check
- environment variable checklist
- database migration instructions
- Stripe webhook setup notes
- basic deployment README section
```

## Acceptance Criteria

```text
- app can be deployed from private GitHub repo
- production env vars are documented
- no secrets are committed
```
