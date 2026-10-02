# SPEC.md — Website Content Audit Tool

**Status:** Draft v0.2-clean
**Owner:** A
**Project stage:** Technical prototype
**Primary goal:** build a small fullstack prototype that turns a public website URL and optional manual text into a structured FAQ + content-gap audit report.

---

## 1. Project Summary

### Working project name

Working names only, not final:

- SiteGap AI
- Website Content Audit Tool
- FAQ Gap Analyzer
- Content Clarity Audit

### One-liner

> Paste a public website URL and get an AI-generated FAQ, content clarity audit, and ready-to-use FAQ block.

### Longer description

This technical prototype analyzes a public website homepage and optional manual context, then generates:

1. A business/content summary.
2. Detected services/offers.
3. Questions already answered by the analyzed page.
4. Important user/customer questions not clearly answered by the analyzed page.
5. A ready-to-use FAQ section.
6. A website improvement checklist.
7. A copyable HTML FAQ block.

The first version is **not** a chatbot, not RAG, not a knowledge base, and not a website widget. It is a simple report-generation web application.

Post-MVP, report generation is grounded in an internal tips knowledge base (RAG, §30), and an MCP server exposes the app to AI agents (§31). The product is still a report generator — no chat, no Q&A over the client's site.

---

## 2. MVP Decisions

| Area              | Decision                                                           |
| ----------------- | ------------------------------------------------------------------ |
| Output language   | English first, Russian later                                       |
| Target content    | Local service websites + B2B service websites                      |
| Initial input     | Website homepage URL + optional manual text                        |
| Later input       | Crawl 3–5 internal pages, PDF upload, optional scrape provider     |
| Auth              | No public user login in prototype                                  |
| Export            | Copy to clipboard, Markdown download, HTML FAQ block copy/download |
| PDF export        | Not in prototype                                                   |
| Stack             | Next.js fullstack + TypeScript                                     |
| Package manager   | pnpm                                                              |
| UI                | Tailwind CSS + shadcn/ui                                           |
| API style         | Next.js App Router Route Handlers                                  |
| Database          | PostgreSQL + Prisma                                                |
| Development       | `pnpm dev` against a hosted Supabase database                      |
| Deployment        | Docker-compatible deployment                                       |
| UI quality        | Production-looking, not a throwaway demo                           |

---

## 3. Problem Statement

Many websites fail to answer basic visitor questions clearly. Examples:

- What does this service include?
- Is there a warranty or guarantee?
- How long does the process take?
- What happens after someone submits the form?
- What areas are served?
- Who is the service for?
- What payment or scheduling options exist?
- What is the next step?

The tool helps identify clarity gaps in the analyzed page and generates a practical FAQ section that can be reviewed before publishing.

---

## 4. Target Website Types

### Primary segment A — Local service websites

Examples:

- Auto repair shops
- Dental clinics
- Cleaning companies
- Construction/renovation services
- HVAC/plumbing/electrical contractors
- Solar panel installers
- Repair services
- Legal/accounting offices
- Local agencies

### Primary segment B — B2B service websites

Examples:

- Agencies
- Consulting companies
- Software service companies
- IT service providers
- B2B operations/logistics/service providers
- Equipment/service vendors

### Not the initial focus

- Big enterprise portals
- Full e-commerce catalogs
- SaaS documentation portals
- Authenticated crawling
- Social scraping
- Chat/RAG/widget use cases

---

## 5. Prototype Value

The prototype does not focus on “AI,” “RAG,” “embeddings,” or “scraping” as product claims.

It focuses on:

- Website clarity.
- Missing visitor questions.
- Practical FAQ generation.
- Content improvement suggestions.
- Ready-to-use copy blocks.

---

## 6. MVP Scope

### In scope

- Landing page.
- Website URL input.
- Optional manual business/context textarea.
- Business type selection.
- Homepage fetch.
- HTML-to-readable-text extraction.
- AI report generation.
- Report page.
- Copy report sections.
- Download Markdown report.
- Copy/download HTML FAQ block.
- Internal admin page.
- Basic rate limiting.
- SSRF-safe URL validation.
- Docker local development.
- Production-looking UI.

### Out of scope for MVP

- Public user accounts.
- Payments.
- Stripe.
- Subscriptions.
- Public dashboard/history.
- RAG/vector database. (Added post-MVP, only for the internal tips knowledge base — see §30.)
- AI chat.
- Website chat widget.
- PDF upload.
- Multi-page crawler.
- Firecrawl integration.
- CRM integrations.
- n8n workflows.
- Team accounts.
- Full analytics suite.
- PDF export.

---

## 7. User Flow

```text
User opens landing page
  ↓
Enters website URL
  ↓
Optionally adds manual context
  ↓
Selects business type
  ↓
Clicks "Generate audit"
  ↓
App validates URL/input
  ↓
App fetches homepage text
  ↓
App generates report
  ↓
App stores report in DB
  ↓
User sees generated report
  ↓
User can copy sections or download Markdown/HTML FAQ block
```

### Report access in prototype

The prototype does not require payment or public authentication. Reports are accessible by unguessable audit ID.

Later, access control can be added if the project evolves into a user-facing application.

---

## 8. Report Structure

### Full report content

The generated report should include:

1. Clarity Score with the full category breakdown.
2. Business/content summary.
3. Detected services/products/offers.
4. Likely visitor intent.
5. Questions already answered on the analyzed page.
6. Missing visitor/customer questions.
7. Priority gaps.
8. Ready-to-use FAQ.
9. Website improvement checklist.
10. Suggested copy blocks.
11. HTML FAQ block.
12. Markdown export.

---

## 9. AI Output Rules

### Critical rule: do not invent business facts

The report must separate:

- Facts found on the analyzed page/manual text.
- Reasonable visitor questions not clearly answered on the analyzed page.
- Suggested copy that requires confirmation.

If the analyzed text does not mention warranty, do not write:

> “The company offers a 12-month warranty.”

Write:

> “Warranty information is not clearly stated on the analyzed page. Add a warranty FAQ if applicable.”

### Scope honesty rule

In MVP, the tool analyzes only the homepage plus optional manual context. The report must never claim a fact is absent from the whole website.

Use phrasing like:

```text
"Not clearly answered on the analyzed page"
"Not stated on the homepage we reviewed"
```

Avoid phrasing like:

```text
"Your website does not have ..."
"This is missing from your site"
```

### Confidence labels

Each answer should have one of these labels:

```text
FOUND_ON_SITE
INFERRED_FROM_CONTEXT
MISSING_NEEDS_CONFIRMATION
```

### Clarity Scorecard Categories

The model evaluates the analyzed text against this fixed checklist:

```text
TRUST        Reviews, certifications/licenses, years in business, team/about
PRICING      Cost, "how pricing works", free estimate/quote
PROCESS      What happens after contact/form submission, work steps
SCOPE        Exact services, geographic area served, who they serve
LOGISTICS    Hours, turnaround/lead time, emergency/urgent availability
PAYMENT      Payment methods, financing, deposits, cancellation terms
RISK         Warranty, refund/satisfaction guarantee, insurance/bonded
CONVERSION   Clear next step, obvious contact options
OBJECTIONS   Common visitor doubts left unanswered
```

For each category the model returns:

```text
status: ANSWERED | PARTIAL | MISSING
priority: HIGH | MEDIUM | LOW
note: short explanation
```

### Output language

MVP output language: English.

---

## 10. AI Report JSON Schema

The LLM should return strict JSON matching this shape:

```json
{
  "analyzedScope": {
    "pagesAnalyzed": ["string"],
    "note": "string"
  },
  "clarityScore": {
    "overall": 0,
    "categories": [
      {
        "key": "TRUST | PRICING | PROCESS | SCOPE | LOGISTICS | PAYMENT | RISK | CONVERSION | OBJECTIONS",
        "label": "string",
        "status": "ANSWERED | PARTIAL | MISSING",
        "priority": "HIGH | MEDIUM | LOW",
        "note": "string"
      }
    ]
  },
  "businessSummary": {
    "nameGuess": "string | null",
    "whatTheyDo": "string",
    "targetCustomers": "string",
    "detectedBusinessType": "LOCAL_SERVICE | B2B_SERVICE | OTHER",
    "confidence": "LOW | MEDIUM | HIGH"
  },
  "detectedOffers": [
    {
      "title": "string",
      "description": "string",
      "evidence": "string | null"
    }
  ],
  "answeredQuestions": [
    {
      "question": "string",
      "answer": "string",
      "evidence": "string",
      "confidence": "FOUND_ON_SITE | INFERRED_FROM_CONTEXT"
    }
  ],
  "missingQuestions": [
    {
      "question": "string",
      "whyItMatters": "string",
      "priority": "HIGH | MEDIUM | LOW",
      "suggestedWebsiteSection": "string",
      "suggestedAnswerGuidance": "string"
    }
  ],
  "readyFaq": [
    {
      "question": "string",
      "answer": "string",
      "confidence": "FOUND_ON_SITE | INFERRED_FROM_CONTEXT | MISSING_NEEDS_CONFIRMATION",
      "needsBusinessConfirmation": true,
      "sourceNote": "string"
    }
  ],
  "websiteImprovements": [
    {
      "title": "string",
      "reason": "string",
      "suggestedCopy": "string",
      "priority": "HIGH | MEDIUM | LOW"
    }
  ]
}
```

> **Note (design decision):** The LLM returns **structured content only**. The
> `htmlFaqBlock` and `markdownReport` are **not** produced by the model — they are
> built deterministically in code by the Export module (`markdown-export.ts`,
> `html-faq-export.ts`) from the structured JSON above. This is cheaper (fewer
> tokens), deterministic, testable, and keeps us in full control of the HTML that
> users copy to their own sites. The derived values are still cached in the
> `markdownReport` / `htmlFaqBlock` DB columns.

---

## 11. Prompt Template

### System prompt

```text
You are an expert website content clarity auditor and FAQ copywriter for service websites.

Your job is to analyze website text and optional context, then produce a practical FAQ and information-gap audit.

Rules:
- Do not invent business-specific facts.
- If a fact is not present, mark it as missing or needing confirmation.
- Separate facts found on the analyzed page(s) from suggestions.
- Only judge what was provided. Never claim a fact is absent from the whole website.
- Say it is "not clearly answered on the analyzed page(s)".
- Score the page against the provided clarity categories.
- Do not invent your own categories.
- Write in clear, practical English.
- Avoid hype and generic filler.
- Focus on questions real visitors would ask before contacting or buying.
- Return strict valid JSON only.
```

### User prompt

```text
Analyze the following website content.

Business type selected by user:
{{businessType}}

Website URL:
{{websiteUrl}}

Scope analyzed:
{{analyzedScope}}

Clarity categories to score:
{{clarityCategories}}

Optional manual context:
{{manualContext}}

Extracted website text:
{{extractedText}}

Create a Website FAQ & Content Gap Audit report.

Return JSON matching exactly this schema:
{{schema}}
```

---

## 12. Pages and UI Requirements

### 12.1 `/` — Landing page

Purpose: explain the tool and collect audit input.

Sections:

1. Hero.
2. URL input form.
3. Optional manual context textarea.
4. Business type selector.
5. “What you’ll get” section.
6. Example report preview.
7. FAQ about the tool.
8. Footer.

Hero copy draft:

```text
Find the visitor questions your website does not clearly answer.

Paste a website URL and get an AI-generated FAQ, content-gap audit, and ready-to-use FAQ block.
```

Primary CTA:

```text
Generate audit
```

Form fields:

```text
websiteUrl: required, valid http/https URL
businessType: required, enum
manualContext: optional, max 5000 characters
```

Business type options:

```text
Local service business
B2B service company
Agency / consulting
Other service business
```

### 12.2 `/audit/[id]` — Report page

States:

- Processing.
- Failed.
- Ready.

Ready report should show:

- Summary card.
- Clarity score.
- Category breakdown.
- Missing questions.
- Ready FAQ.
- Website improvement checklist.
- HTML FAQ block.
- Copy buttons.
- Markdown download button.

### 12.3 `/legal/privacy`

Prototype privacy page:

- What data is processed.
- Website URL/manual text usage.
- Contact email.
- Data deletion request contact.

### 12.4 `/legal/terms`

Prototype terms page:

- Report is AI-generated.
- User must verify before publishing.
- No guarantee of conversion improvement.
- User must have rights to submit the content.

---

## 13. Technical Architecture

### Recommended MVP stack

```text
App: Next.js App Router + TypeScript
Package manager: pnpm
API: Next.js Route Handlers
DB: PostgreSQL
ORM: Prisma
Styling: Tailwind CSS + shadcn/ui
Local dev: pnpm dev + hosted Supabase Postgres
Production: Docker-compatible deployment
LLM: provider adapter, model configurable through env vars
Default MVP provider: Google Gemini through adapter
```

The LLM always sits behind an adapter (`modules/ai/report-generator.ts`). The provider should be swappable via environment variables.

---

## 14. Scraping/Extraction Strategy

### Extraction method decision

MVP uses **plain HTTP fetch** + HTML parsing, not a headless browser.

Reason:

- Most service websites have server-rendered or readable HTML.
- Headless browsers and scrape APIs add cost, latency, memory, and Docker complexity.

Trade-off accepted for MVP: JS-only single-page apps and protected sites may return too little text. When that happens, return `EXTRACTION_EMPTY` and prompt the user to paste manual context.

### MVP extraction

1. Fetch only the exact homepage URL the user provides.
2. Follow limited redirects.
3. Accept only `text/html`.
4. Extract readable text.
5. Combine extracted text with optional manual context.
6. Truncate to model-safe max length.

### Recommended extraction libraries

```text
undici/fetch for HTTP
cheerio for HTML parsing
@mozilla/readability + jsdom for readable extraction
custom fallback: remove script/style/nav/footer and extract text
```

### Scrape provider interface

```ts
interface ScrapeProvider {
  scrapeHomepage(url: string): Promise<ScrapeResult>
  scrapeFewPages?(url: string, limit: number): Promise<ScrapeResult[]>
}
```

MVP provider:

```text
BasicScrapeProvider — plain fetch + HTML extraction
```

Future providers:

```text
HeadlessBrowserScrapeProvider
FirecrawlScrapeProvider
```

---

## 15. Security Requirements

### 15.1 URL validation / SSRF protection

Rules:

- Allow only `http` and `https`.
- Block localhost.
- Block private IP ranges.
- Block link-local IP ranges.
- Block cloud metadata IPs.
- Resolve DNS and validate resolved IP before fetching.
- Revalidate each redirect target.
- Limit redirect count.
- Set request timeout.
- Limit response size.
- Require `text/html`.
- Do not send cookies or credentials.

Blocked examples:

```text
http://localhost:3000
http://127.0.0.1
http://0.0.0.0
http://169.254.169.254
http://10.0.0.1
http://192.168.1.1
http://172.16.0.1
file:///etc/passwd
```

### 15.2 Rate limiting

MVP rate limits:

```text
Max 3 audit generations per IP per hour
Max 10 audit generations per IP per day
Max manual text length: 5000 chars
Max extracted website text: 40000 chars
```

Implementation options:

- Simple DB table `RateLimitEvent`.
- Later: Redis-based limiter.

---

## 16. Database Schema — Prisma Draft

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AuditStatus {
  PROCESSING
  READY
  FAILED
}

enum BusinessType {
  LOCAL_SERVICE
  B2B_SERVICE
  AGENCY_CONSULTING
  OTHER_SERVICE
}

model Audit {
  id                 String        @id @default(cuid())

  websiteUrl          String
  normalizedDomain    String?
  businessType        BusinessType
  manualContext       String?

  status              AuditStatus   @default(PROCESSING)
  statusMessage       String?

  sourceText          String?
  sourceTextSha256    String?
  sourceTextCharCount Int?

  reportJson          Json?
  previewJson         Json?
  markdownReport      String?
  htmlFaqBlock        String?

  errorCode           String?
  errorMessage        String?

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([createdAt])
  @@index([normalizedDomain])
}

model RateLimitEvent {
  id        String   @id @default(cuid())
  ipHash    String
  action    String
  createdAt DateTime @default(now())

  @@index([ipHash, action, createdAt])
}
```

---

## 17. API Routes

### 17.1 `POST /api/audits`

Creates and generates an audit.

Request:

```json
{
  "websiteUrl": "https://example.com",
  "businessType": "LOCAL_SERVICE",
  "manualContext": "Optional extra context"
}
```

Behavior:

1. Validate request with Zod.
2. Apply rate limit.
3. Validate URL safety.
4. Insert audit with status `PROCESSING`.
5. Fetch homepage.
6. Extract text.
7. Generate report JSON with LLM.
8. Validate/report JSON shape.
9. Build preview JSON.
10. Build markdown report.
11. Store report.
12. Return audit ID.

> **Note (design decision — synchronous MVP):** In the MVP this whole flow runs
> **synchronously inside the single POST request**. The client waits for the full
> fetch + LLM + export pipeline and receives `READY` (or `FAILED`) directly.
>
> The `PROCESSING` status and the `/audit/[id]` "Processing" screen are therefore
> **forward-compatible scaffolding for Stage 2** (see ARCHITECTURE §8): when audit
> generation is moved to a background queue/worker, POST will return `PROCESSING`
> immediately and the client will poll `GET /api/audits/[id]` until it flips to
> `READY`/`FAILED`. Until then, the report page's "Processing" state is effectively
> just the form's loading state. We build the synchronous version first, then swap
> in the async pipeline as a separate step.

Response success:

```json
{
  "auditId": "clx...",
  "status": "READY",
  "reportUrl": "/audit/clx..."
}
```

Response failure:

```json
{
  "error": "FETCH_FAILED",
  "message": "We could not read this website. Try pasting website text manually."
}
```

### 17.2 `GET /api/audits/[id]`

Returns generated report.

### 17.3 `GET /api/audits/[id]/download.md`

Returns Markdown report.

### 17.4 `GET /api/audits/[id]/faq.html`

Returns HTML FAQ block.

### 17.5 `GET /api/health`

Returns basic app status.

---

## 18. Internal Admin MVP

The prototype includes a minimal internal admin area for the project owner.

This is not a public user dashboard. It exists only to monitor generated audits, debug failures, and manually recover broken generation flows.

### Route

```text
/admin
```

### Access protection

The admin area can be protected with a simple environment-based password.

```env
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=change-me
```

Recommended behavior:

```text
1. User opens /admin.
2. If no valid admin session exists, show a password form.
3. If password matches ADMIN_PASSWORD, create a signed HTTP-only session cookie.
4. Admin pages are accessible only with a valid session cookie.
```

Later, it can be replaced with proper authentication.

### Admin features

The `/admin` page should show a table of all audit reports.

Required columns:

```text
- Audit ID
- Website URL
- Business type
- Audit status
- Created date
- Updated date
```

Required filters:

```text
- All
- READY
- FAILED
- PROCESSING
```

Each audit should have a detail page:

```text
/admin/audits/[id]
```

The detail page should show:

```text
- Website URL
- Business type
- Status
- Extracted text length
- Preview report JSON
- Full report JSON
- Error message, if failed
- Created date
- Updated date
```

Required admin actions:

```text
- Open audit report
- Delete audit
- Manually mark audit as FAILED
```

Nice-to-have admin actions after MVP:

```text
- Retry generation
- Regenerate report
- Export audit as Markdown
```

### Admin security notes

Admin routes must never expose secrets to the browser.

Do not show:

```text
- LLM API key
- Database URL
- Admin password
- Admin session secret
```

---

## 19. UI Components

Core components:

```text
AuditForm
BusinessTypeSelect
ManualContextTextarea
LoadingAuditState
ReportPage
ReportSection
CopyButton
MarkdownDownloadButton
HtmlFaqBlockCard
ErrorState
AdminAuditTable
AdminAuditDetail
```

UI quality bar:

- Clean layout.
- Good spacing.
- Mobile responsive.
- Clear CTA buttons.
- Skeleton/loading states.
- Helpful errors.
- Report cards with good typography.
- No raw JSON displayed to public users.

---

## 20. Markdown Export Format

```markdown
# Website FAQ & Content Gap Audit

Website: https://example.com
Business type: Local service business
Generated: 2026-06-02

## 1. Business Summary

...

## 2. Detected Services / Offers

...

## 3. Questions Already Answered

...

## 4. Missing Visitor Questions

...

## 5. Ready-to-Use FAQ

...

## 6. Website Improvement Checklist

...

## 7. HTML FAQ Block

```html
<section class="faq-section">...</section>
```
```

---

## 21. HTML FAQ Block Requirements

Generated HTML should be simple and portable:

```html
<section class="faq-section">
  <h2>Frequently Asked Questions</h2>
  <div class="faq-item">
    <h3>Question?</h3>
    <p>Answer.</p>
  </div>
</section>
```

Rules:

- No JavaScript.
- No external CSS.
- No tracking.
- Semantic HTML.
- Unsupported facts must be avoided.

---

## 22. Error Handling

### User-facing errors

| Error           | Message                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| Invalid URL     | “Please enter a valid website URL.”                                             |
| Blocked URL     | “This URL cannot be analyzed for security reasons.”                             |
| Fetch failed    | “We could not read this website. You can paste website text manually instead.”  |
| Not enough text | “We could not find enough readable text. Try adding manual context.”            |
| AI failed       | “Report generation failed. Please try again.”                                   |

### Internal error codes

```text
INVALID_URL
BLOCKED_URL
FETCH_TIMEOUT
FETCH_TOO_LARGE
FETCH_NON_HTML
EXTRACTION_EMPTY
LLM_FAILED
LLM_INVALID_JSON
```

---

## 23. Environment Variables

```bash
DATABASE_URL="postgresql://..."
APP_URL="http://localhost:3000"
NODE_ENV="development"

LLM_PROVIDER="gemini"
LLM_API_KEY="..."
LLM_MODEL="gemini-2.0-flash"

RATE_LIMIT_SALT="random-secret"
ADMIN_PASSWORD="change-me"
ADMIN_SESSION_SECRET="random-secret"
```

---

## 24. Local Development

> **Note (design decision — 2026-08-12):** The MVP no longer runs a local Postgres
> container. The database is a hosted **Supabase** instance, used by both local
> development and deployment, so there is a single source of truth for schema and
> data. `docker-compose.yml` was removed: with the database external, it only
> duplicated `pnpm dev`, and the `Dockerfile` is dev-only (`CMD pnpm dev`) so it
> could not serve deployment either. A proper multi-stage production Dockerfile
> is added when there is somewhere to deploy to.

### Database

```text
Supabase Postgres
DATABASE_URL = transaction pooler (port 6543) — used by the app at runtime
DIRECT_URL   = direct connection (port 5432) — used by prisma migrate/generate
```

### Commands

```bash
cp env.example .env
pnpm install          # postinstall runs prisma generate
pnpm prisma:migrate
pnpm dev
```

### Suggested scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

---

## 25. Deployment Notes

Deployment is out of scope for the first scaffold, but the app should remain Docker-compatible.

Possible future deployment options:

```text
DigitalOcean App Platform
DigitalOcean Droplet + Docker Compose
Any Docker-compatible PaaS
```

Production deployment should use managed PostgreSQL or a backed-up database.

---

## 26. Acceptance Criteria

### Core generation

- User can enter homepage URL and business type.
- User can optionally paste manual context.
- App validates unsafe URLs.
- App extracts readable homepage text.
- App generates structured report.
- App handles sites with not enough text.
- AI does not invent unsupported business facts.

### Report

- Report page shows Clarity Score and category breakdown.
- Report page shows business summary.
- Report page shows missing questions.
- Report page shows FAQ examples.
- User can copy sections.
- User can download Markdown.
- User can copy HTML FAQ block.

### Admin

- Admin can log in with environment-based password.
- Admin can see audits.
- Admin can open audit detail.
- Admin can delete audit.
- Admin can see errors.

### Development

- App runs locally with `pnpm dev` against Supabase.
- App uses pnpm.
- App uses PostgreSQL and Prisma.
- Environment variables are separated from committed files.

---

## 27. Implementation Checklist

### Phase 1 — Project setup

- [ ] Create Next.js + TypeScript project.
- [ ] Use pnpm.
- [ ] Add Tailwind + shadcn/ui.
- [ ] Add Prisma.
- [ ] Connect a hosted Supabase Postgres database.
- [ ] Create Prisma schema.
- [ ] Add `.env.example`.
- [ ] Add basic health route.
- [ ] Add placeholder landing page.
- [ ] Add placeholder admin page.
- [ ] Add recommended module structure.

### Phase 2 — Landing and audit form

- [ ] Build landing page.
- [ ] Build audit form.
- [ ] Add Zod validation.
- [ ] Add business type selector.
- [ ] Add manual context textarea.
- [ ] Add loading state.

### Phase 3 — Website extraction

- [ ] Implement safe URL parser.
- [ ] Implement SSRF protection.
- [ ] Implement homepage fetcher.
- [ ] Implement HTML text extractor.
- [ ] Add response size limit.
- [ ] Add timeout and redirect limit.
- [ ] Add fallback for manual-only context.

### Phase 4 — AI report generation

- [ ] Create LLM provider adapter.
- [ ] Add report generation prompt.
- [ ] Validate JSON response.
- [ ] Build preview JSON.
- [ ] Build Markdown report.
- [ ] Build HTML FAQ block.
- [ ] Store report in DB.

### Phase 5 — Report UI

- [ ] Build report page.
- [ ] Add copy buttons.
- [ ] Add Markdown download route.
- [ ] Add HTML FAQ block copy/download.

### Phase 6 — Internal admin

- [ ] Add admin password page.
- [ ] Add signed HTTP-only admin session cookie.
- [ ] Add audit table.
- [ ] Add audit detail page.
- [ ] Add delete action.
- [ ] Add error visibility.

### Phase 7 — Polish/security

- [ ] Add rate limiting.
- [ ] Add user-friendly error states.
- [ ] Add Terms page.
- [ ] Add Privacy page.
- [ ] Add basic metadata/SEO.
- [ ] Add mobile polish.
- [ ] Add production env checks.

---

## 28. Future Roadmap

### v0.2

- Crawl homepage + 3–5 same-domain pages.
- Better URL discovery.
- Optional email delivery of report.
- Better analytics.

### v0.3

- Optional advanced scrape provider.
- PDF upload.
- Compare before/after website improvements.
- More business-type templates.

### v1.0

- User accounts.
- Dashboard/history.
- Monthly website re-audit.
- Knowledge base.
- RAG Q&A.
- Website chat widget.

---

## 29. Open Decisions

These can be decided later and should not block MVP development:

1. Final project name.
2. Final LLM provider/model.
3. Whether to use DigitalOcean App Platform or a Droplet first.
4. Whether to include “manual text only” mode on the landing page from day one.

Recommended defaults:

```text
Project name: SiteGap AI or Website Content Audit Tool
LLM provider: keep provider behind adapter
Deployment: decide later
Manual text mode: include as optional context from day one
```

---

## 30. Post-MVP: Tips Knowledge Base (RAG)

Added 2026-10-02 (`TASKS.md` Phase 10).

### What it does

Before the LLM call, the report generator retrieves a few curated tips that fit the analyzed business and adds them to the prompt. The report then reflects what visitors of *that kind* of business usually ask, not only the generic clarity categories (§9).

### Why retrieval and not a bigger static list

`BusinessType` has only four values, and one value covers very different businesses: a plumber and a dentist are both `LOCAL_SERVICE`. Pasting every tip for a type into the prompt wastes tokens and buries the useful ones. Retrieval filters by business type, then ranks by similarity to the page text, so the prompt gets only the top few tips (default 5).

### Rules

- Tips are hand-written and stored in the repo. The scraped page is never chunked or embedded — it already fits in the prompt.
- Tips are reference data, not instructions. The prompt keeps them clearly separate, and the §9 rule still applies: a tip suggests what to check for, and is never stated as a fact about the analyzed business.
- Retrieval is optional. If the embeddings API or the query fails, the report is generated without tips.
- No user-facing change: the report structure (§8) and JSON schema (§10) stay the same.

### Data

`KnowledgeChunk` table: business type, source file, content, content hash, and a 768-dimension embedding (pgvector, HNSW index, cosine distance). It is filled by `pnpm knowledge:ingest`, never at request time.

---

## 31. Post-MVP: MCP Server

Added 2026-10-02 (`TASKS.md` Phase 11).

### What it does

Exposes sitegap-ai to MCP clients (Claude Code, Claude Desktop) as three tools:

- `search_tips` — query text + business type → the matching tips (§30).
- `create_audit` — URL, business type, optional manual context → audit id and status. Same validation, SSRF protection and generation as `POST /api/audits` (§17.1).
- `get_audit` — audit id → status, plus the report when `READY`.

### Rules

- Local only: stdio transport, started by the client as a child process. No network listener, so no auth in this version.
- No admin actions (delete, mark as failed). The admin area (§18) stays behind its password.
- Failures come back as MCP tool errors with the same user-facing messages as §22 — never stack traces or secrets.
- Rate limiting (§15.2) is per IP and does not apply over stdio. Acceptable while local-only; revisit before adding any remote transport.
