# ARCHITECTURE.md

# Website FAQ & Gap Audit — Architecture

This document describes the MVP architecture using Mermaid diagrams. It is optimized for Obsidian and can be stored as:

```text
/docs/ARCHITECTURE.md
```

---

## 1. MVP System Context

```mermaid
flowchart LR
  User[User / business owner]
  Admin[Project owner / admin]
  App[Next.js fullstack app]
  DB[(PostgreSQL)]
  LLM[LLM API]
  Stripe[Stripe Checkout]
  Website[Target website]

  User -->|submits website URL + optional text| App
  App -->|fetch homepage HTML| Website
  App -->|generate audit report| LLM
  App -->|store audit, report, payment status| DB
  User -->|unlock full report| Stripe
  Stripe -->|checkout.session.completed webhook| App
  App -->|mark audit as PAID| DB
  Admin -->|monitor audits and failures| App
```

---

## 2. MVP Runtime Architecture

```mermaid
flowchart TB
  subgraph Browser
    Landing[Landing page]
    Preview[Audit preview page]
    FullReport[Full report page]
    AdminUI[Internal admin UI]
  end

  subgraph NextApp[Next.js application]
    Pages[App Router pages]
    Routes[Route handlers / API routes]
    AuditModule[Audit module]
    ScrapingModule[Scraping module]
    AIModule[AI report module]
    BillingModule[Billing / Stripe module]
    ExportModule[Markdown + HTML export module]
    AdminModule[Admin module]
  end

  DB[(PostgreSQL + Prisma)]
  Stripe[Stripe]
  LLM[LLM API]
  Site[External website]

  Landing --> Routes
  Preview --> Routes
  FullReport --> Routes
  AdminUI --> Routes

  Routes --> AuditModule
  Routes --> BillingModule
  Routes --> AdminModule

  AuditModule --> ScrapingModule
  AuditModule --> AIModule
  AuditModule --> ExportModule
  AuditModule --> DB

  ScrapingModule --> Site
  AIModule --> LLM
  BillingModule --> Stripe
  BillingModule --> DB
  AdminModule --> DB
```

---

## 3. Audit Generation Sequence

```mermaid
sequenceDiagram
  actor User
  participant UI as Next.js UI
  participant API as /api/audits
  participant Audit as Audit service
  participant Scraper as Scraper service
  participant AI as AI report generator
  participant DB as PostgreSQL
  participant Site as Target website
  participant LLM as LLM API

  User->>UI: Enter URL + optional manual text
  UI->>API: POST /api/audits
  API->>Audit: createAudit(input)
  Audit->>DB: Create audit with PROCESSING status
  Audit->>Scraper: scrapeHomepage(url)
  Scraper->>Site: Fetch homepage HTML
  Site-->>Scraper: HTML response
  Scraper-->>Audit: Clean extracted text
  Audit->>AI: generateReport(extractedText, manualText)
  AI->>LLM: Send structured prompt
  LLM-->>AI: Structured JSON report
  AI-->>Audit: Validated report JSON
  Audit->>DB: Save extracted text, preview, full report
  Audit->>DB: Mark audit as READY
  Audit-->>API: auditId
  API-->>UI: Redirect /audit/:id
  UI-->>User: Show free preview
```

---

## 4. Payment Unlock Sequence

```mermaid
sequenceDiagram
  actor User
  participant UI as Audit preview page
  participant API as Next.js API
  participant StripeService as Stripe service
  participant Stripe as Stripe Checkout
  participant Webhook as /api/stripe/webhook
  participant DB as PostgreSQL

  User->>UI: Click Unlock Full Report
  UI->>API: POST /api/stripe/create-checkout-session
  API->>StripeService: createCheckoutSession(auditId)
  StripeService->>Stripe: Create Checkout Session with metadata.auditId
  Stripe-->>StripeService: checkoutUrl
  StripeService-->>API: checkoutUrl
  API-->>UI: checkoutUrl
  UI-->>User: Redirect to Stripe Checkout

  User->>Stripe: Complete payment
  Stripe-->>Webhook: checkout.session.completed
  Webhook->>Webhook: Verify Stripe signature
  Webhook->>DB: Find audit by metadata.auditId
  Webhook->>DB: Mark audit as PAID
  Webhook-->>Stripe: 200 OK

  User->>UI: Return to success/full report link
  UI->>API: GET audit full report
  API->>DB: Check audit is READY and PAID
  DB-->>API: Full report
  API-->>UI: Full report data
  UI-->>User: Show full report
```

---

## 5. Admin Flow

```mermaid
flowchart TD
  Admin[Admin opens /admin]
  CheckSession{Valid admin session?}
  Login[Show password form]
  Validate{Password matches ADMIN_PASSWORD?}
  SetCookie[Create signed HTTP-only cookie]
  Dashboard[Show admin dashboard]
  List[View audits table]
  Detail[Open audit detail page]
  Actions[Run admin actions]

  Admin --> CheckSession
  CheckSession -- No --> Login
  Login --> Validate
  Validate -- No --> Login
  Validate -- Yes --> SetCookie
  SetCookie --> Dashboard
  CheckSession -- Yes --> Dashboard
  Dashboard --> List
  List --> Detail
  Detail --> Actions

  Actions --> MarkPaid[Mark as PAID]
  Actions --> MarkFailed[Mark as FAILED]
  Actions --> Delete[Delete audit]
  Actions --> OpenFull[Open full report as admin]
```

---

## 6. Audit Status Lifecycle

```mermaid
stateDiagram-v2
  [*] --> PROCESSING: User submits URL
  PROCESSING --> READY: Report generated successfully
  PROCESSING --> FAILED: Scraping or AI error
  FAILED --> PROCESSING: Retry generation later
  READY --> [*]
```

---

## 7. Payment Status Lifecycle

```mermaid
stateDiagram-v2
  [*] --> FREE: Audit created
  FREE --> PENDING: Checkout session created
  PENDING --> PAID: Stripe webhook confirms payment
  PENDING --> FREE: Checkout abandoned or expired
  PAID --> REFUNDED: Manual/admin sync later
```

---

## 8. MVP Data Model

```mermaid
erDiagram
  Audit {
    string id PK
    string websiteUrl
    string businessType
    string email
    string status
    string paymentStatus
    string extractedText
    json previewJson
    json reportJson
    string errorMessage
    string stripeCheckoutSessionId
    string stripePaymentIntentId
    string fullAccessToken
    datetime createdAt
    datetime updatedAt
  }
```

---

## 9. Recommended Module Structure

```mermaid
flowchart TB
  Root[src]
  Root --> App[app]
  Root --> Modules[modules]
  Root --> DB[db]

  App --> Pages[pages]
  App --> API[api route handlers]

  Modules --> Audit[audit]
  Modules --> Scraping[scraping]
  Modules --> AI[ai]
  Modules --> Billing[billing]
  Modules --> Export[export]
  Modules --> Admin[admin]

  Audit --> AuditService[audit.service.ts]
  Audit --> AuditRepo[audit.repository.ts]
  Audit --> AuditTypes[audit.types.ts]

  Scraping --> ScraperService[scraper.service.ts]
  Scraping --> BasicScraper[providers/basic-scraper.ts]
  Scraping --> FirecrawlScraper[providers/firecrawl-scraper.ts later]

  AI --> ReportGenerator[report-generator.ts]
  AI --> Prompts[prompts.ts]
  AI --> Schemas[schemas.ts]

  Billing --> StripeService[stripe.service.ts]
  Export --> Markdown[markdown-export.ts]
  Export --> HTML[html-faq-export.ts]
  Admin --> AdminAuth[admin-auth.ts]
  Admin --> AdminService[admin.service.ts]

  DB --> Prisma[prisma.ts]
```

---

## 10. Future Architecture Evolution

```mermaid
flowchart LR
  Stage1[Stage 1: Next.js modular monolith]
  Stage2[Stage 2: Add queue]
  Stage3[Stage 3: Separate worker]
  Stage4[Stage 4: Optional dedicated API]
  Stage5[Stage 5: Microservices only if needed]

  Stage1 --> Stage2 --> Stage3 --> Stage4 --> Stage5

  Stage1Note[One app, one repo, simple deploy]
  Stage2Note[Queue for slow audit generation]
  Stage3Note[Web app + worker process]
  Stage4Note[Next.js frontend + NestJS/Fastify API if needed]
  Stage5Note[Separate scraper/AI/billing services only with real scaling need]

  Stage1 -.-> Stage1Note
  Stage2 -.-> Stage2Note
  Stage3 -.-> Stage3Note
  Stage4 -.-> Stage4Note
  Stage5 -.-> Stage5Note
```

---

## 11. Future Worker Architecture

```mermaid
flowchart TB
  User[User]
  Web[Next.js web app]
  Queue[(Job queue / Redis)]
  Worker[Audit worker]
  DB[(PostgreSQL)]
  LLM[LLM API]
  Website[Target website]
  Stripe[Stripe]

  User --> Web
  Web --> DB
  Web --> Queue
  Web --> Stripe
  Stripe --> Web

  Queue --> Worker
  Worker --> Website
  Worker --> LLM
  Worker --> DB
```

---

## 12. Implementation Order

```mermaid
flowchart TD
  P1[Phase 1: Scaffold]
  P2[Phase 2: Database schema]
  P3[Phase 3: Audit creation]
  P4[Phase 4: Homepage scraping]
  P5[Phase 5: AI report generation]
  P6[Phase 6: Preview and full report pages]
  P7[Phase 7: Stripe Checkout]
  P8[Phase 8: Internal admin]
  P9[Phase 9: Polish and production hardening]

  P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9
```

---

## 13. Phase 1 Scaffold Prompt for Claude/Codex

Use this prompt when starting implementation:

```text
Read /specs/SPEC.md and /docs/ARCHITECTURE.md.

Implement Phase 1 scaffold only.

Requirements:
- Create a Next.js application with TypeScript.
- Add Dockerfile and docker-compose.yml.
- Add PostgreSQL for local development.
- Add Prisma setup.
- Add .env.example.
- Add the recommended module folder structure.
- Add a basic landing page placeholder.
- Add a basic /admin placeholder page.
- Add a healthcheck route.
- Do not implement Stripe yet.
- Do not implement AI generation yet.
- Do not implement scraping yet.
- Do not implement payments yet.
- Keep route handlers thin.
- Put business logic inside modules.
- Ask before changing the architecture.
```

---

## 14. Notes

For the MVP, keep the system simple:

```text
Next.js fullstack app
PostgreSQL
Prisma
Stripe Checkout
Simple admin page
No chat
No RAG
No vector database
No subscriptions
No microservices
```

The architecture should be easy to grow, but the first implementation should stay small.
