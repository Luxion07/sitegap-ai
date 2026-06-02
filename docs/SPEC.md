# SPEC.md — Website FAQ & Gap Audit

**Status:** Draft v0.1  
**Date:** 2026-06-02  
**Owner:** Alex Kozhukhar  
**Product stage:** MVP  
**Primary goal:** build a small paid product that turns a business website/manual text into a useful FAQ + gap audit report.

---

## 1. Product summary

### Working product name

Working names only, not final:

- SiteGap AI
- FAQGap
- Site2FAQ
- FAQ Audit AI
- ClarityAudit

### One-liner

> Paste a business website URL and get an AI-generated FAQ, missing-information audit, and ready-to-publish website FAQ block.

### Longer positioning

This product helps small service businesses and B2B service companies understand what customer questions their website does not answer clearly. The product analyzes the homepage and optional manual context, then generates:

1. A business summary.
2. Detected services/offers.
3. Questions already answered by the website.
4. Important customer questions missing from the website.
5. A ready-to-publish FAQ section.
6. A website improvement checklist.
7. A copyable HTML FAQ block.

The first version is **not** a chatbot, not RAG, not a knowledge base, and not a website widget. It is a simple one-time report product.

---

## 2. Finalized MVP decisions

| Area | Decision |
|---|---|
| Product language | English first, Russian later |
| Target niche | Local service businesses + B2B service companies |
| Initial input | Website homepage URL + optional manual text |
| Later input | Crawl 3–5 internal pages, PDF upload, Firecrawl adapter |
| Email capture | No email before generation; Stripe collects email during payment |
| Report generation | Generate full report before payment; show only preview until paid |
| Pricing | $19 one-time payment for full report |
| Auth | No login in MVP |
| Export | Copy to clipboard, Markdown download, HTML FAQ block copy/download |
| PDF export | Not in MVP |
| Stack | Next.js fullstack + TypeScript |
| API style | Next.js App Router Route Handlers |
| Database | PostgreSQL + Prisma |
| Payments | Stripe Checkout + Stripe webhook |
| Development | Docker Compose locally |
| Deployment | DigitalOcean preferred; Docker-based deployment |
| UI quality | Production-looking, not ugly prototype |

---

## 3. Problem statement

Many small business websites fail to answer basic buyer questions. Examples:

- What does this service cost?
- Is there a warranty?
- How long does the work take?
- What happens after I submit the form?
- What areas do you serve?
- Do you work with businesses or individuals?
- Do you offer emergency service?
- What payment methods do you accept?

The business owner often does not see these gaps because they already know their own business. The product gives them an external AI-powered audit and a ready-to-use FAQ section.

---

## 4. Target users

### Primary segment A — Local service businesses

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

### Primary segment B — B2B service companies

Examples:

- Agencies
- Consulting companies
- Software service companies
- IT service providers
- B2B operations/logistics/service providers
- Equipment/service vendors

### Not the initial focus

- Big enterprise teams
- Full e-commerce catalogs
- SaaS documentation portals
- Companies needing live chat/RAG/widget immediately
- Sites requiring authenticated crawling
- LinkedIn/social scraping

---

## 5. MVP value proposition

### For the user

> “In a few minutes, see what important customer questions your website does not answer, and get a ready-to-publish FAQ section to fix it.”

### What the product sells

The product does not sell “AI,” “RAG,” “embeddings,” or “scraping.”

It sells:

- Better website clarity.
- Fewer unanswered customer doubts.
- A practical FAQ section.
- A list of conversion blockers.
- Ready-to-use copy.

---

## 6. MVP scope

### In scope

- Landing page.
- Website URL input.
- Optional manual business context textarea.
- Business type selection.
- Homepage fetch.
- HTML-to-readable-text extraction.
- AI report generation.
- Preview report page.
- Stripe Checkout one-time payment.
- Stripe webhook fulfillment.
- Full report unlock after payment.
- Copy report sections.
- Download Markdown report.
- Copy/download HTML FAQ block.
- Basic rate limiting.
- SSRF-safe URL validation.
- Docker local development.
- Production-ready visual UI.

### Out of scope for MVP

- Login/accounts.
- Subscriptions.
- Dashboard/history.
- RAG/vector database.
- AI chat.
- Website chat widget.
- PDF upload.
- Multi-page crawler.
- Firecrawl integration.
- CRM integrations.
- n8n workflows.
- Team accounts.
- Admin dashboard.
- Full analytics suite.
- PDF export.

---

## 7. User flow

### 7.1 Free preview flow

```text
User opens landing page
  ↓
Enters website URL
  ↓
Optionally adds manual context
  ↓
Selects business type
  ↓
Clicks “Generate free preview”
  ↓
App validates URL/input
  ↓
App fetches homepage text
  ↓
App generates full report internally
  ↓
App stores full report in DB as unpaid
  ↓
User sees preview only
  ↓
User clicks “Unlock full report — $19”
```

### 7.2 Paid unlock flow

```text
User clicks Unlock Full Report
  ↓
App creates Stripe Checkout Session
  ↓
User pays on Stripe-hosted checkout
  ↓
Stripe sends checkout.session.completed webhook
  ↓
App marks audit as paid
  ↓
User returns to success/full report page
  ↓
App shows full report if audit is paid and full-access token is valid
```

### 7.3 Full report access

The full report must not be unlocked simply because the user visits a success URL.

Unlock condition:

```text
audit.status === "READY"
AND audit.paymentStatus === "PAID"
AND fullAccessToken is valid
```

---

## 8. Report structure

### 8.1 Free preview content

The free preview should show enough value to motivate payment, but not the complete asset.

Show:

1. Business summary.
2. Detected business type/offers.
3. 3 missing customer questions.
4. 3 FAQ examples.
5. Blurred/locked sections preview.
6. CTA: “Unlock full report — $19”.

### 8.2 Full report content

Full report should include:

1. Business summary.
2. Detected services/products/offers.
3. Likely customer intent.
4. Questions already answered on the website.
5. Missing customer questions.
6. Priority gaps.
7. Ready-to-publish FAQ.
8. Website improvement checklist.
9. Suggested copy blocks.
10. HTML FAQ block.
11. Markdown export.

---

## 9. AI output rules

### Critical rule: do not invent business facts

The report must separate:

- Facts found on the site/manual text.
- Reasonable customer questions not answered by the site.
- Suggested copy that requires business confirmation.

For example, if the website does not mention warranty, the report must not say:

> “The company offers a 12-month warranty.”

It should say:

> “Warranty information is not clearly stated. Add a warranty FAQ if applicable.”

### Confidence labels

Each answer should have one of these labels:

```text
FOUND_ON_SITE
INFERRED_FROM_CONTEXT
MISSING_NEEDS_CONFIRMATION
```

### Output language

MVP output language: English.

Later: Russian localization.

---

## 10. AI report JSON schema

The LLM should return strict JSON matching this shape:

```json
{
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
  ],
  "htmlFaqBlock": "string",
  "markdownReport": "string"
}
```

---

## 11. Prompt template

### System prompt

```text
You are an expert website conversion auditor and FAQ copywriter for small service businesses and B2B service companies.

Your job is to analyze website text and optional business context, then produce a practical FAQ and information-gap audit.

Rules:
- Do not invent business-specific facts.
- If a fact is not present, mark it as missing or needing confirmation.
- Separate facts found on the website from suggestions.
- Write in clear, practical English.
- Avoid hype and generic filler.
- Focus on questions real customers would ask before contacting or buying.
- Return strict valid JSON only.
```

### User prompt

```text
Analyze the following business website content.

Business type selected by user:
{{businessType}}

Website URL:
{{websiteUrl}}

Optional manual context provided by user:
{{manualContext}}

Extracted website text:
{{extractedText}}

Create a Website FAQ & Gap Audit report.

Return JSON matching exactly this schema:
{{schema}}
```

---

## 12. Pages and UI requirements

### 12.1 `/` — Landing page

Purpose: explain the product and collect audit input.

Sections:

1. Hero.
2. URL input form.
3. Optional manual context textarea.
4. Business type selector.
5. “What you’ll get” section.
6. Example preview section.
7. Pricing card: “Full report — $19”.
8. FAQ about the tool.
9. Footer with Terms/Privacy links.

Hero copy draft:

```text
Find the customer questions your website fails to answer.

Paste your business website and get an AI-generated FAQ, missing-information audit, and ready-to-publish FAQ block.
```

Primary CTA:

```text
Generate free preview
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

### 12.2 `/audit/[id]` — Preview/full report page

States:

- Processing.
- Failed.
- Ready unpaid preview.
- Ready paid full report.

Unpaid preview should show:

- Summary card.
- 3 missing questions.
- 3 FAQ examples.
- Locked sections.
- Stripe CTA.

Paid full report should show:

- Full report sections.
- Copy buttons per section.
- Download Markdown button.
- Copy HTML FAQ block button.

### 12.3 `/audit/[id]/success`

Purpose: payment return page.

Behavior:

1. Reads `session_id` from query.
2. Server verifies session with Stripe or waits for webhook state.
3. If paid, redirects/shows full report with token.
4. If webhook is delayed, shows “Confirming payment...” and polls.

### 12.4 `/legal/privacy`

MVP simple privacy page:

- What data is processed.
- Website URL/manual text usage.
- Payment handled by Stripe.
- Contact email.
- Data deletion request contact.

### 12.5 `/legal/terms`

MVP simple terms page:

- Report is AI-generated.
- User must verify before publishing.
- No guarantee of conversion improvement.
- User must have rights to submit the content.

---

## 13. Technical architecture

### Recommended MVP stack

```text
App: Next.js App Router + TypeScript
API: Next.js Route Handlers
DB: PostgreSQL
ORM: Prisma
Payments: Stripe Checkout
Styling: Tailwind CSS + component library
Local dev: Docker Compose
Production: DigitalOcean Docker deployment
LLM: provider adapter, model configurable through env vars
```

### Architecture diagram

```text
Browser
  ↓
Next.js UI
  ↓
Next.js Route Handlers
  ↓
Audit Service
  ├── URL Validator
  ├── Homepage Fetcher
  ├── HTML Text Extractor
  ├── LLM Report Generator
  ├── Preview Builder
  ├── Markdown/HTML Export Builder
  └── Prisma DB
        ↓
PostgreSQL

Stripe Checkout
  ↓
Stripe Webhook
  ↓
Prisma DB marks audit as PAID
```

---

## 14. Scraping/extraction strategy

### MVP extraction

For v0.1:

1. Fetch only the exact homepage URL the user provides.
2. Follow limited redirects.
3. Accept only `text/html` content.
4. Extract readable text.
5. Combine extracted text with optional manual context.
6. Truncate to model-safe max length.

### Recommended extraction libraries

Possible implementation:

```text
fetch/undici for HTTP
cheerio for HTML parsing
@mozilla/readability + jsdom for readable article-like extraction
custom fallback: remove script/style/nav/footer and extract text
```

### Firecrawl policy

Firecrawl is **not used in MVP v0.1**.

Reason:

- Adds vendor dependency.
- Adds cost per scrape/crawl.
- Homepage-only extraction is enough to validate product demand.

Later add a provider interface:

```ts
interface ScrapeProvider {
  scrapeHomepage(url: string): Promise<ScrapeResult>
  scrapeFewPages?(url: string, limit: number): Promise<ScrapeResult[]>
}
```

Then implement:

```text
BasicScrapeProvider — default MVP
FirecrawlScrapeProvider — later paid/advanced mode
```

---

## 15. Security requirements

### 15.1 URL validation / SSRF protection

Because users submit URLs, implement SSRF protection from the start.

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
- Require `text/html` for website fetch.
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

### 15.3 Full report access protection

No login in MVP, so access is token-based.

Rules:

- Audit ID is public-ish but unguessable.
- Full report requires `fullAccessToken`.
- Token is included only in Stripe success URL and paid links.
- Preview page does not expose full JSON in client HTML.
- Full report API redacts full report if token invalid or unpaid.

---

## 16. Database schema — Prisma draft

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

enum PaymentStatus {
  UNPAID
  CHECKOUT_CREATED
  PAID
  REFUNDED
}

enum BusinessType {
  LOCAL_SERVICE
  B2B_SERVICE
  AGENCY_CONSULTING
  OTHER_SERVICE
}

model Audit {
  id                      String        @id @default(cuid())
  fullAccessToken          String        @unique

  websiteUrl               String
  normalizedDomain         String?
  businessType             BusinessType
  manualContext            String?

  status                   AuditStatus   @default(PROCESSING)
  statusMessage            String?

  sourceText               String?
  sourceTextSha256          String?
  sourceTextCharCount       Int?

  reportJson               Json?
  previewJson              Json?
  markdownReport           String?
  htmlFaqBlock             String?

  paymentStatus            PaymentStatus @default(UNPAID)
  priceCents               Int           @default(1900)
  currency                 String        @default("usd")

  stripeCheckoutSessionId  String?       @unique
  stripePaymentIntentId    String?
  stripeCustomerEmail      String?

  errorCode                String?
  errorMessage             String?

  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt
  paidAt                   DateTime?

  @@index([createdAt])
  @@index([paymentStatus])
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

## 17. API routes

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

Response success:

```json
{
  "auditId": "clx...",
  "status": "READY",
  "previewUrl": "/audit/clx..."
}
```

Response failure:

```json
{
  "error": "FETCH_FAILED",
  "message": "We could not read this website. Try pasting business text manually."
}
```

### 17.2 `GET /api/audits/[id]`

Returns preview or full report depending on payment/token.

Query:

```text
?token=FULL_ACCESS_TOKEN
```

Behavior:

- If unpaid or invalid token: return preview only.
- If paid and valid token: return full report.

### 17.3 `POST /api/audits/[id]/checkout`

Creates Stripe Checkout Session.

Request:

```json
{
  "returnToken": "FULL_ACCESS_TOKEN"
}
```

Behavior:

1. Load audit.
2. Ensure report is ready.
3. Ensure not already paid.
4. Create Stripe Checkout Session with:
   - mode: `payment`
   - line item: `$19 Website FAQ & Gap Audit full report`
   - metadata: `auditId`
   - success URL: `/audit/[id]/success?session_id={CHECKOUT_SESSION_ID}&token=...`
   - cancel URL: `/audit/[id]`
5. Save checkout session ID.
6. Return checkout URL.

### 17.4 `POST /api/stripe/webhook`

Handles Stripe events.

Required event:

```text
checkout.session.completed
```

Behavior:

1. Verify Stripe webhook signature using raw request body.
2. Read `auditId` from session metadata.
3. Confirm payment status.
4. Mark audit as `PAID`.
5. Store customer email if available.
6. Store payment intent ID if available.

### 17.5 `GET /api/audits/[id]/download.md`

Returns Markdown report if paid and token valid.

### 17.6 `GET /api/audits/[id]/faq.html`

Returns HTML FAQ block if paid and token valid.

### 17.7 `GET /api/health`

Returns basic app status.

---

## 18. Stripe implementation details

### Product

```text
Name: Website FAQ & Gap Audit — Full Report
Price: $19
Type: One-time payment
Currency: USD
```

### Checkout metadata

Include at minimum:

```json
{
  "auditId": "clx..."
}
```

### Important payment rules

- The webhook is the trusted fulfillment signal.
- The success page alone does not unlock the report.
- Store Stripe IDs for support/debugging.
- Use test mode in development.
- Use live keys only in production.

---

## 19. UI components

### Core components

```text
AuditForm
BusinessTypeSelect
ManualContextTextarea
LoadingAuditState
PreviewReport
LockedSectionCard
PricingUnlockCard
FullReport
ReportSection
CopyButton
MarkdownDownloadButton
HtmlFaqBlockCard
ErrorState
PaymentSuccessState
```

### UI quality bar

The UI should feel like a real product, not a dev demo:

- Clean layout.
- Good spacing.
- Mobile responsive.
- Clear CTA buttons.
- Skeleton/loading states.
- Helpful errors.
- Report cards with good typography.
- Locked sections visually obvious.
- No raw JSON displayed to end users.

---

## 20. Markdown export format

The Markdown report should look like this:

```markdown
# Website FAQ & Gap Audit

Website: https://example.com  
Business type: Local service business  
Generated: 2026-06-02

## 1. Business Summary
...

## 2. Detected Services / Offers
...

## 3. Questions Already Answered
...

## 4. Missing Customer Questions
...

## 5. Ready-to-Publish FAQ
...

## 6. Website Improvement Checklist
...

## 7. HTML FAQ Block

```html
<section class="faq-section">
...
</section>
```
```

---

## 21. HTML FAQ block requirements

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
- Business-specific unsupported facts must be avoided.

---

## 22. Error handling

### User-facing errors

| Error | Message |
|---|---|
| Invalid URL | “Please enter a valid website URL.” |
| Blocked URL | “This URL cannot be analyzed for security reasons.” |
| Fetch failed | “We could not read this website. You can paste business text manually instead.” |
| Not enough text | “We could not find enough readable text. Try adding manual context.” |
| AI failed | “Report generation failed. Please try again.” |
| Payment pending | “Payment is being confirmed. This usually completes shortly.” |
| Payment failed/cancelled | “Payment was not completed. Your preview is still available.” |

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
STRIPE_SESSION_FAILED
STRIPE_WEBHOOK_INVALID
PAYMENT_NOT_CONFIRMED
```

---

## 23. Environment variables

```bash
DATABASE_URL="postgresql://..."
APP_URL="http://localhost:3000"
NODE_ENV="development"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..." # optional if using predefined price

LLM_PROVIDER="openai_or_other"
LLM_API_KEY="..."
LLM_MODEL="..."

RATE_LIMIT_SALT="random-secret"
FULL_ACCESS_TOKEN_SECRET="random-secret"
```

---

## 24. Local development with Docker

### Services

```text
app: Next.js app
postgres: local PostgreSQL database
```

### Commands

```bash
cp .env.example .env
docker compose up --build
npm run prisma:migrate
npm run dev
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

## 25. Deployment plan

### Preferred production path

Use DigitalOcean because an account already exists.

Recommended deployment:

```text
DigitalOcean App Platform or Docker-based app deployment
  +
Managed PostgreSQL
  +
Stripe live mode
  +
Production environment variables
```

### Cheaper beta alternative

```text
Single DigitalOcean Droplet
  +
Docker Compose
  +
PostgreSQL container or managed DB
  +
Caddy/Traefik/Nginx reverse proxy
```

For a paid product, managed PostgreSQL is safer than keeping the only database inside the same Docker Compose stack without backups.

---

## 26. Analytics events

MVP can start with simple DB or console logging.

Events to track:

```text
audit_started
audit_ready
audit_failed
preview_viewed
checkout_started
payment_completed
full_report_viewed
markdown_downloaded
html_copied
```

Later use analytics tool if needed.

---

## 27. Acceptance criteria

### Core generation

- User can enter homepage URL and business type.
- User can optionally paste manual context.
- App validates unsafe URLs.
- App extracts readable homepage text.
- App generates structured report.
- App handles sites with not enough text.
- AI does not invent unsupported business facts.

### Preview

- Preview page shows business summary.
- Preview page shows exactly 3 missing questions.
- Preview page shows exactly 3 FAQ examples.
- Locked full sections are visible but not readable.
- Preview includes clear $19 unlock CTA.

### Payment

- Stripe Checkout opens from preview page.
- Test payment marks audit as paid through webhook.
- Success page shows full report after payment confirmation.
- Unpaid users cannot access full report API.

### Export

- Paid user can copy FAQ.
- Paid user can download Markdown.
- Paid user can copy HTML FAQ block.
- Unpaid user cannot access Markdown/HTML export routes.

### Deployment

- App runs locally with Docker Compose.
- App can be deployed as Dockerized service.
- Production env vars are separated from dev env vars.
- Webhook endpoint works in production.

---

## 28. Implementation checklist

### Phase 1 — Project setup

- [ ] Create Next.js + TypeScript project.
- [ ] Add Tailwind/component library.
- [ ] Add Prisma.
- [ ] Add PostgreSQL Docker Compose.
- [ ] Create Prisma schema.
- [ ] Add `.env.example`.
- [ ] Add basic health route.

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

- [ ] Build preview report page.
- [ ] Build locked sections.
- [ ] Build full report page.
- [ ] Add copy buttons.
- [ ] Add Markdown download route.
- [ ] Add HTML FAQ block copy/download.

### Phase 6 — Stripe

- [ ] Create Stripe product/price.
- [ ] Add create checkout route.
- [ ] Add webhook route.
- [ ] Store checkout session ID.
- [ ] Mark paid on webhook.
- [ ] Add success page.
- [ ] Test payment flow end-to-end.

### Phase 7 — Polish/security

- [ ] Add rate limiting.
- [ ] Add user-friendly error states.
- [ ] Add Terms page.
- [ ] Add Privacy page.
- [ ] Add basic metadata/SEO.
- [ ] Add mobile polish.
- [ ] Add production env checks.

### Phase 8 — Deploy

- [ ] Create production database.
- [ ] Configure DigitalOcean deployment.
- [ ] Set production env vars.
- [ ] Configure Stripe webhook live endpoint.
- [ ] Run production smoke test.
- [ ] Test payment in live or restricted live mode.

---

## 29. Future roadmap

### v0.2

- Crawl homepage + 3–5 same-domain pages.
- Better URL discovery.
- Store reports by email.
- Optional email delivery of report.
- Better analytics.

### v0.3

- Firecrawl integration as advanced scrape provider.
- PDF upload.
- Compare before/after website improvements.
- More business-type templates.

### v1.0

- User accounts.
- Dashboard/history.
- Monthly website re-audit.
- Subscriptions.
- Knowledge base.
- RAG Q&A.
- Website chat widget.

---

## 30. Open decisions

These can be decided later and should not block MVP development:

1. Final product name.
2. Final LLM provider/model.
3. Final design system/component library.
4. Whether to use DigitalOcean App Platform or a Droplet first.
5. Whether to add email delivery immediately after payment.
6. Whether to include “manual text only” mode on the landing page from day one.

Recommended defaults:

```text
Product name: SiteGap AI or FAQGap
LLM provider: keep provider behind adapter
Deployment: DigitalOcean App Platform if simple enough; Droplet + Docker Compose if more control is needed
Email delivery: later
Manual text mode: include as optional context from day one
```


дополнительно апдейт 
Вот кусок для вставки в `SPEC.md`:

## **Internal Admin MVP**

The MVP should include a minimal internal admin area for the project owner.

This is not a customer-facing dashboard. It exists only to monitor generated audits, debug failures, and manually recover broken payment or generation flows.

### **Route**

```text
/admin
```

### **Access Protection**

For the MVP, the admin area can be protected with a simple environment-based password.

```env
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=change-me
```

Recommended MVP behavior:

```text
1. User opens /admin.
2. If no valid admin session exists, show a password form.
3. If password matches ADMIN_PASSWORD, create a signed HTTP-only session cookie.
4. Admin pages are accessible only with a valid session cookie.
```

This is enough for the MVP. Later, it can be replaced with a proper authentication system such as Clerk, Supabase Auth, Auth.js, or a custom admin user model.

### **Admin Features for MVP**

The `/admin` page should show a table of all audit reports.

Required columns:

```text
- Audit ID
- Website URL
- Business type
- Email, if provided
- Audit status
- Payment status
- Created date
- Updated date
```

Required filters:

```text
- All
- READY
- FAILED
- PAID
- UNPAID
```

Each audit should have a detail page:

```text
/admin/audits/[id]
```

The detail page should show:

```text
- Website URL
- Business type
- Email
- Status
- Payment status
- Stripe Checkout Session ID
- Stripe Payment Intent ID
- Extracted text length
- Preview report JSON
- Full report JSON
- Error message, if failed
- Created date
- Updated date
```

Required MVP admin actions:

```text
- Open audit preview
- Open full report as admin
- Delete audit
- Manually mark audit as PAID
- Manually mark audit as FAILED
```

Nice-to-have admin actions after MVP:

```text
- Retry generation
- Regenerate report
- Re-send report link by email
- Refund status sync from Stripe
- Export audit as Markdown
```

### **Admin Security Notes**

Admin routes must never expose secrets to the browser.

Do not show:

```text
- OpenAI API key
- Stripe secret key
- Stripe webhook secret
- Database URL
- Admin password
```

Admin actions should be server-side only.

The admin password must never be committed to GitHub. It should exist only in local `.env` files and production environment variables.

---

## **Architecture Evolution Plan**

The MVP should start as a modular monolith, not as microservices.

### **Stage 1: MVP Modular Monolith**

Use one Next.js fullstack application.

```text
Next.js app
  ├── UI pages
  ├── API routes / route handlers
  ├── Stripe webhook
  ├── audit generation logic
  ├── scraping logic
  ├── AI report generation
  ├── admin area
  └── database access
```

This keeps the first version simple:

```text
- one repository
- one app to run locally
- one deployment target
- fewer DevOps problems
- faster iteration
```

However, the code should still be organized into modules so it can grow later.

Recommended structure:

```text
src/
  app/
    page.tsx
    audit/[id]/page.tsx
    success/page.tsx
    admin/page.tsx
    admin/audits/[id]/page.tsx
    api/
      audits/route.ts
      audits/[id]/route.ts
      stripe/create-checkout-session/route.ts
      stripe/webhook/route.ts

  modules/
    audit/
      audit.service.ts
      audit.repository.ts
      audit.types.ts

    scraping/
      scraper.service.ts
      scraper.types.ts
      providers/
        basic-scraper.ts
        firecrawl-scraper.ts

    ai/
      report-generator.ts
      prompts.ts
      schemas.ts

    billing/
      stripe.service.ts
      billing.types.ts

    export/
      markdown-export.ts
      html-faq-export.ts

    admin/
      admin.service.ts
      admin-auth.ts

  db/
    prisma.ts
```

Route handlers should stay thin. Business logic should live inside modules.

Bad:

```text
app/api/audits/route.ts contains 400 lines of scraping, AI, DB, and Stripe logic.
```

Good:

```ts
export async function POST(req: Request) {
  return createAuditController(req)
}
```

The controller/service can then call:

```ts
auditService.createAudit()
scraperService.scrapeHomepage()
aiService.generateReport()
billingService.createCheckoutSession()
```

### **Stage 2: Background Jobs**

If audit generation becomes slow or unreliable inside a normal request/response flow, add a job queue.

Possible queue options:

```text
- BullMQ + Redis
- Trigger.dev
- Inngest
- Temporal, later if the system becomes complex
```

Future flow:

```text
User creates audit
  ↓
Audit saved with status PROCESSING
  ↓
Generation job added to queue
  ↓
Worker processes scraping + AI generation
  ↓
Database updated to READY or FAILED
```

### **Stage 3: Separate Worker**

When scraping, crawling, PDF processing, or AI generation becomes heavier, move background work into a separate worker process.

```text
web-app
  ├── handles UI
  ├── handles Stripe
  ├── handles admin
  └── creates jobs

worker
  ├── processes audit generation jobs
  ├── runs scraping
  ├── runs AI report generation
  └── updates database
```

At this stage, the system may still be a monorepo and not true microservices.

Recommended future structure:

```text
apps/
  web/
  worker/

packages/
  database/
  core/
  ai/
  scraping/
  billing/
```

### **Stage 4: Optional Separate API**

If the backend becomes too large for Next.js route handlers, introduce a dedicated API service.

Possible options:

```text
- NestJS
- Express
- Fastify
```

NestJS is a good candidate if the system grows into a larger backend with many modules, background jobs, permissions, customer accounts, and integrations.

Possible future architecture:

```text
apps/
  web/       # Next.js frontend
  api/       # NestJS API
  worker/    # background jobs

packages/
  database/
  shared/
  ai/
  scraping/
  billing/
```

This should not be done for the MVP unless there is a clear need.

### **Stage 5: Microservices Only If Needed**

Do not start with microservices.

Microservices should only be considered if there are real scaling or organizational reasons, such as:

```text
- crawling has independent scaling needs
- AI processing needs separate infrastructure
- a team is working on different services independently
- deployment boundaries become necessary
- one part of the system requires a different runtime or language
```

Possible future services:

```text
- web-app
- api-service
- scraper-service
- ai-service
- billing-service
- worker-service
```

For the MVP and early product, this would be overengineering.

---

## **Repository and Development Setup**

The project should use a private GitHub repository.

Recommended repository type:

```text
Private GitHub repo
```

Do not commit secrets.

The repository should include:

```text
.env.example
.gitignore
README.md
SPEC.md
docker-compose.yml
Dockerfile
```

The repository must not include:

```text
.env
.env.local
production database URLs
OpenAI API keys
Stripe secret keys
Stripe webhook secrets
admin passwords
```

Example `.env.example`:

```env
DATABASE_URL=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
```

Local development should run with Docker Compose.

Recommended local services:

```text
app
postgres
```

Optional later services:

```text
redis
worker
```

MVP local command goal:

```bash
docker compose up
```

This should start the app and the database locally.

---

## **Scaffold Definition**

In this project, “scaffold” means creating the initial technical skeleton of the application.

The scaffold is not the full product. It is the base structure needed to start building features safely.

The scaffold should include:

```text
- Next.js project
- TypeScript
- ESLint / Prettier
- Dockerfile
- docker-compose.yml
- PostgreSQL service
- Prisma setup
- initial database schema
- environment variable structure
- .env.example
- basic landing page
- basic audit route
- basic admin route placeholder
- basic folder/module structure
```

After the scaffold is done, feature development can begin on top of it.