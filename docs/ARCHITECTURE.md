# ARCHITECTURE.md

# Website Content Audit Tool — Architecture

This document describes the technical prototype architecture using Mermaid diagrams. It is optimized for Obsidian and can be stored as:

```text
/docs/ARCHITECTURE.md
```

---

## 1. MVP System Context

```mermaid
flowchart LR
  User[User]
  Admin[Project owner / admin]
  App[Next.js fullstack app]
  DB[(PostgreSQL)]
  LLM[LLM API]
  Website[Target website]

  User -->|submits website URL + optional text| App
  App -->|fetch homepage HTML| Website
  App -->|generate audit report| LLM
  App -->|store audit and report| DB
  User -->|view report and export Markdown/HTML| App
  Admin -->|monitor audits and failures| App
```

---

## 2. MVP Runtime Architecture

```mermaid
flowchart TB
  subgraph Browser
    Landing[Landing page]
    Report[Audit report page]
    AdminUI[Internal admin UI]
  end

  subgraph NextApp[Next.js application]
    Pages[App Router pages]
    Routes[Route handlers / API routes]
    AuditModule[Audit module]
    ScrapingModule[Scraping module]
    AIModule[AI report module]
    ExportModule[Markdown + HTML export module]
    AdminModule[Admin module]
  end

  DB[(PostgreSQL + Prisma)]
  LLM[LLM API]
  Site[External website]

  Landing --> Routes
  Report --> Routes
  AdminUI --> Routes

  Routes --> AuditModule
  Routes --> AdminModule

  AuditModule --> ScrapingModule
  AuditModule --> AIModule
  AuditModule --> ExportModule
  AuditModule --> DB

  ScrapingModule --> Site
  AIModule --> LLM
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
  Audit->>DB: Save extracted text, report JSON, exports
  Audit->>DB: Mark audit as READY
  Audit-->>API: auditId
  API-->>UI: Redirect /audit/:id
  UI-->>User: Show generated report
```

---

## 4. Admin Flow

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

  Actions --> MarkFailed[Mark as FAILED]
  Actions --> Delete[Delete audit]
  Actions --> OpenReport[Open report as admin]
```

---

## 5. Audit Status Lifecycle

```mermaid
stateDiagram-v2
  [*] --> PROCESSING: User submits URL
  PROCESSING --> READY: Report generated successfully
  PROCESSING --> FAILED: Scraping or AI error
  FAILED --> PROCESSING: Retry generation later
  READY --> [*]
```

---

## 6. MVP Data Model

```mermaid
erDiagram
  Audit {
    string id PK
    string websiteUrl
    string businessType
    string status
    string sourceText
    json previewJson
    json reportJson
    string markdownReport
    string htmlFaqBlock
    string errorCode
    string errorMessage
    datetime createdAt
    datetime updatedAt
  }

  RateLimitEvent {
    string id PK
    string ipHash
    string action
    datetime createdAt
  }
```

---

## 7. Recommended Module Structure

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

  Export --> Markdown[markdown-export.ts]
  Export --> HTML[html-faq-export.ts]
  Admin --> AdminAuth[admin-auth.ts]
  Admin --> AdminService[admin.service.ts]

  Modules --> Knowledge[knowledge — post-MVP, §13]
  Knowledge --> Tips[tips/*.md]
  Knowledge --> Ingest[ingest.ts]
  Knowledge --> Retrieval[retrieval.ts]
  Knowledge --> Embeddings[providers/gemini-embeddings.ts]

  Root --> MCP[mcp — post-MVP, §14]
  MCP --> McpServer[server.ts — stdio entry point]

  DB --> Prisma[prisma.ts]
```

---

## 8. Future Architecture Evolution

```mermaid
flowchart LR
  Stage1[Stage 1: Next.js modular monolith]
  Stage2[Stage 2: Add queue]
  Stage3[Stage 3: Separate worker]
  Stage4[Stage 4: Optional dedicated API]
  Stage5[Stage 5: Services only if needed]

  Stage1 --> Stage2 --> Stage3 --> Stage4 --> Stage5

  Stage1Note[One app, one repo, simple deploy]
  Stage2Note[Queue for slow audit generation]
  Stage3Note[Web app + worker process]
  Stage4Note[Next.js frontend + NestJS/Fastify API if needed]
  Stage5Note[Separate scraper/AI services only with real scaling need]

  Stage1 -.-> Stage1Note
  Stage2 -.-> Stage2Note
  Stage3 -.-> Stage3Note
  Stage4 -.-> Stage4Note
  Stage5 -.-> Stage5Note
```

---

## 9. Future Worker Architecture

```mermaid
flowchart TB
  User[User]
  Web[Next.js web app]
  Queue[(Job queue / Redis)]
  Worker[Audit worker]
  DB[(PostgreSQL)]
  LLM[LLM API]
  Website[Target website]

  User --> Web
  Web --> DB
  Web --> Queue

  Queue --> Worker
  Worker --> Website
  Worker --> LLM
  Worker --> DB
```

---

## 10. Implementation Order

```mermaid
flowchart TD
  P1[Phase 1: Scaffold]
  P2[Phase 2: Database schema]
  P3[Phase 3: Audit creation]
  P4[Phase 4: Homepage scraping]
  P5[Phase 5: AI report generation]
  P6[Phase 6: Report pages and exports]
  P7[Phase 7: Internal admin]
  P8[Phase 8: Polish and hardening]

  P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8
```

---

## 11. Phase 1 Scaffold Prompt for Claude/Codex

Use this prompt when starting implementation:

```text
Read /docs/SPEC.md and /docs/ARCHITECTURE.md.

Implement Phase 1 scaffold only.

Requirements:
- Create a Next.js application with TypeScript.
- Use pnpm.
- Add Tailwind CSS and shadcn/ui.
- Add Dockerfile and docker-compose.yml.
- Add PostgreSQL for local development.
- Add Prisma setup.
- Add .env.example.
- Add the recommended module folder structure.
- Add a basic landing page placeholder.
- Add a basic /admin placeholder page.
- Add a healthcheck route.
- Do not implement AI generation yet.
- Do not implement scraping yet.
- Do not implement payments or billing.
- Keep route handlers thin.
- Put business logic inside modules.
- Ask before changing the architecture.
```

---

## 12. Notes

For the prototype, keep the system simple:

```text
Next.js fullstack app
PostgreSQL
Prisma
Simple admin page
No chat
RAG + pgvector only for the internal tips base (§13)
No payments
No subscriptions
No microservices
```

The architecture should be easy to grow, but the first implementation should stay small.

---

## 13. Post-MVP: Tips Knowledge Base (RAG)

Added in Phase 10 (see SPEC §30). RAG here is two separate pipelines:

- **Indexing (offline).** `pnpm knowledge:ingest`, run by hand after the tips
  change. Turns Markdown into vectors. Never runs during a user request.
- **Retrieval (online).** Runs inside report generation for every audit: one
  embeddings call plus one SQL query.

The expensive part (embedding every tip) happens once, not per audit, so the
request path only pays for embedding the query.

```mermaid
flowchart LR
  subgraph Indexing[Indexing — offline, by hand]
    Tips[tips/*.md] --> Chunk[Split into chunks]
    Chunk --> Changed{Content hash changed?}
    Changed -->|no| Skip[Skip]
    Changed -->|yes| EmbedTip[Embed chunk]
    EmbedTip --> Store[(KnowledgeChunk<br/>pgvector + HNSW)]
  end

  subgraph Retrieval[Retrieval — online, per audit]
    Page[Page text + manual context] --> EmbedQuery[Embed query]
    EmbedQuery --> Search[Top-k by cosine distance<br/>filtered by business type]
    Store --> Search
    Search -->|tips| Prompt[Prompt: tips as reference data]
    Search -.->|failure| NoTips[Prompt without tips]
  end

  Gemini[Gemini embeddings API]
  EmbedTip --> Gemini
  EmbedQuery --> Gemini
  Prompt --> LLM[LLM API]
  NoTips --> LLM
```

Module boundary: `knowledge` owns the tips, the embeddings adapter and the
retrieval query. `ai` only receives a list of tip strings and knows nothing
about vectors, so the prompt code doesn't depend on how tips are stored.

When Phase 9 lands, the Retrieval box moves into the Go worker together with
report generation. Indexing stays a TypeScript script.

---

## 14. Post-MVP: MCP Server

Added in Phase 11 (see SPEC §31). The MCP server is a second entry point in
front of the same modules, next to the route handlers. The modules don't know
whether a call came from a browser or from an AI agent (ports & adapters).

```mermaid
flowchart LR
  Browser[Browser] -->|HTTP| Routes[Route handlers<br/>src/app/api]
  Client[MCP client<br/>Claude Code / Desktop] -->|stdio| MCP[MCP server<br/>src/mcp]

  Routes --> Audit[audit module]
  Routes --> Admin[admin module]
  MCP --> Audit
  MCP --> Knowledge[knowledge module]

  Audit --> DB[(PostgreSQL)]
  Knowledge --> DB
  Admin --> DB
```

- **stdio:** the client starts `pnpm mcp` as a child process and talks over
  stdin/stdout. No port is opened, so nothing is exposed to the network.
- **No path to the admin module:** destructive actions stay behind the admin
  password (least privilege).
