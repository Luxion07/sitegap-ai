# ADR-0001: Headless page rendering as a separate gRPC service

**Status:** Accepted (2026-11-05)
**Date:** 2026-10-28
**Deciders:** Alex Kozhukhar (project owner)

> Earlier decision on the worker language (TypeScript + BullMQ over Go) is
> recorded in [`experiments/go-worker/README.md`](../../experiments/go-worker/README.md).
> This is the first decision kept as a standalone ADR file.

## Context

The audit worker reads a site with `fetch` + `cheerio`
([`basic-scraper.ts`](../../src/modules/scraping/providers/basic-scraper.ts)):
homepage only, 8 s timeout, 2 MB body cap, up to 3 redirects, each hop
re-checked by `assertSafeUrl`. If fewer than 200 characters of readable text
remain, it throws `EXTRACTION_EMPTY` and the audit fails.

Client-rendered sites (React/Vue SPAs, some site builders) send an almost empty
HTML shell; the visible text only appears after their JavaScript runs. For those
sites the audit either fails with `EXTRACTION_EMPTY` or is generated from a thin
fragment of the page. We have not measured how often this happens — see action
item 1.

Rendering a page means running a real browser, and Chromium has a very different
operational profile from the current worker:

- **Memory:** hundreds of MB per browser, against tens of MB for the Node worker.
- **Image:** Playwright needs glibc and Chromium system libraries; it does not
  support the current `node:22-alpine` base image.
- **Failure mode:** browsers crash, hang, and leak memory and child processes.
- **Trust:** it executes arbitrary JavaScript from sites a user typed in. The
  worker process holds `DATABASE_URL` and the LLM API keys.

Two documented constraints apply:

- [`ARCHITECTURE.md` §8](../ARCHITECTURE.md) allows "separate scraper/AI services
  only with real scaling need".
- The Phase 9 decision values a single TypeScript source of truth for domain
  logic shared by Next.js, the MCP server, and the worker.

This is also a portfolio project. Hands-on experience with gRPC and NestJS is an
explicit, secondary goal; it is stated here so it is not mistaken for a
technical requirement.

## Decision

1. Add a standalone service, **`sitegap-renderer`**, in its own repository:
   NestJS (`@nestjs/microservices`, gRPC transport) + Playwright Chromium.
2. The audit worker calls it **synchronously from inside the BullMQ job**, with a
   20 s gRPC deadline. The queue stays where it is: between the HTTP request and
   the worker.
3. **Tiered scraping:** the basic scraper runs first. Only when it fails with
   `EXTRACTION_EMPTY` does the worker escalate to the renderer. Timeouts, blocked
   URLs, oversized and non-HTML responses do not escalate — a browser would not
   fix them.
4. The renderer is **optional**. With `RENDERER_URL` unset, or when the call fails,
   the audit behaves exactly as it does today.

```
POST /api/audits ──► Redis (BullMQ) ──► audit worker
                                          │
                                          │ 1. basic scraper (fetch + cheerio)
                                          │    └─ EXTRACTION_EMPTY?
                                          │ 2. gRPC Render(url), deadline 20 s ──► sitegap-renderer
                                          │                                      (NestJS + Chromium,
                                          │ ◄── { text, final_url } ──────────── no secrets)
                                          │ 3. RAG tips → LLM → Postgres
```

### Contract (v1)

```proto
syntax = "proto3";

package sitegap.renderer.v1;

service Renderer {
  rpc Render(RenderRequest) returns (RenderResponse);
}

message RenderRequest {
  string url = 1;
}

message RenderResponse {
  string text = 1;      // readable text, whitespace collapsed, capped at 40,000 chars
  string final_url = 2; // URL after redirects
}
```

Errors use standard gRPC status codes, which the client maps to `ScrapeError`:

| Status | When |
|---|---|
| `INVALID_ARGUMENT` | URL is malformed or not http(s) |
| `PERMISSION_DENIED` | URL or a redirect resolves to a blocked address |
| `DEADLINE_EXCEEDED` | page did not render within the client's deadline |
| `RESOURCE_EXHAUSTED` | all browser slots are busy |
| `UNAVAILABLE` | renderer is down or restarting |

The `.proto` file lives in the renderer repository and is copied verbatim into
sitegap. Breaking changes go into a new package (`v2`), not into `v1`.

### Inside the renderer

- **Browser lifecycle:** one Chromium `Browser` per process, launched at
  startup. A fresh `BrowserContext` (isolated cookies and storage) per request,
  closed in `finally`. The browser is closed on `SIGTERM`.
- **Bounded concurrency:** a fixed number of slots (default 2, matching the
  worker's concurrency). Over the limit → `RESOURCE_EXHAUSTED` instead of an
  unbounded internal queue.
- **SSRF guard on every request, not only the first.** The browser fetches far
  more than the entered URL: redirects, iframes, scripts, `fetch` calls made by
  page JavaScript. All of them go through `context.route('**/*')` and the same
  blocked-range check as `url-safety.ts` (DNS resolved, IPv4 + IPv6). Contexts are
  created with `serviceWorkers: 'block'`, because route interception does not see
  requests made by service workers. WebSocket connections are blocked.
- **Less work per page:** images, fonts, and media are aborted in the same route
  handler — they never contain text.
- **Extraction parity:** the same removal rules and caps as `basic-scraper.ts`
  (`script`, `style`, `nav`, `footer`, … removed; 40,000 characters max), so the
  LLM sees comparable input from both providers.
- **No secrets:** the renderer needs no database, Redis, or LLM credentials.
- **Health:** the standard `grpc.health.v1` service, reporting `SERVING` only
  while the browser is connected.

### Inside sitegap

- New provider `src/modules/scraping/providers/rendered-scraper.ts`: a gRPC client
  (`@grpc/grpc-js`) that maps status codes to `ScrapeError`.
- `scraper.service.ts` keeps its role as the single entry point (Facade) and owns
  the escalation rule; the two providers are interchangeable strategies. The rest
  of the audit pipeline does not change.
- The worker still runs `assertSafeUrl` on the entered URL before calling the
  renderer. Each side validates input independently.

## Options considered

| | A. Status quo | B. Playwright in the worker | C. Service, gRPC | D. Service, BullMQ queue | E. Service, HTTP/JSON | F. Managed API |
|---|---|---|---|---|---|---|
| Renders JS sites | No | Yes | Yes | Yes | Yes | Yes |
| Complexity | None | Low | Medium | Medium–High | Medium | Low |
| Running cost | None | Bigger worker | Extra container | Extra container | Extra container | Per request |
| Untrusted JS near secrets | — | **Yes** | No | No | No | No (third party) |
| Fits a call inside the job | — | Yes | Yes | **No** | Yes | Yes |
| Typed contract | — | In-process | `.proto` + codegen | Implicit JSON | Needs OpenAPI/Zod | Vendor SDK |

**A. Status quo.** Free and simple, but SPA sites keep failing.

**B. Playwright inside the existing worker.** The shortest path: no network hop,
no contract. Rejected because:
- untrusted page JavaScript would run in the process that holds the database and
  LLM credentials;
- the worker image would lose Alpine and grow several times;
- a browser crash or leak would take the job loop down with it;
- rendering could not be scaled separately.

**C. Separate service called over gRPC — chosen.** See the trade-off analysis.

**D. Separate service consuming a second BullMQ queue (`@nestjs/bullmq`).** Pull
model, built-in buffering and retries, and Redis is already running. But the
worker needs the text *before* it can continue. It would have to either block a
worker slot on `job.waitUntilFinished()`, or rewrite `processAuditJob` as a
`FlowProducer` parent/child pipeline. Either way there would be two retry layers
for one step, and the contract would be untyped JSON in Redis.

**E. Separate service over HTTP/JSON.** A close second. Easy to debug with
`curl`, no code generation. It loses the typed contract unless one is added by
hand, and has no built-in deadline propagation.

**F. Managed rendering API (Browserless, ScrapingBee, etc.).** No infrastructure
to run, but every audited URL goes to a third party, and each request has a
cost. Reasonable for a funded product; not for this prototype.

## Trade-off analysis

**Why a separate process at all (B vs C/D/E).** The deciding factor is
isolation, not scale — so this does not contradict §8's "only with real scaling
need" for scale-driven splits. It adds a second legitimate reason: a component
with a different runtime, failure mode, and trust level. This is the Bulkhead
pattern. A browser crash stays inside the renderer, and a browser compromise
reaches a container with no credentials.

**Why a synchronous call, not a queue (C/E vs D).** Asynchrony belongs at the
edge, where a user must not wait for a slow job. That boundary already exists:
the HTTP request → BullMQ. Inside the job, the worker needs the text to
continue, which is plain request/response. The job already gives durability and
retries (2 attempts, exponential backoff), so a second queue adds a second retry
layer and nothing else.

**Why gRPC over HTTP/JSON (C vs E).** Not for speed: rendering takes seconds,
and protocol overhead is noise next to that. The reasons:

- the contract is one `.proto` file that generates types for both sides;
- the deadline travels with the call, so the server knows when the client
  stopped waiting;
- standard status codes map cleanly onto `ScrapeError` and the fallback logic.

The costs: protobuf tooling, and debugging with `grpcurl` instead of `curl`. The
learning goal tipped a close call.

**Why tiered, not always-render.** A browser costs seconds and hundreds of MB per
page; a `fetch` costs milliseconds. Escalating only on `EXTRACTION_EMPTY` keeps
the cheap path for server-rendered sites and spends the browser only where it
changes the outcome.

## Consequences

**Easier**
- Auditing client-rendered sites.
- Scaling rendering independently of report generation.
- Reasoning about security: the component that runs untrusted code holds no
  secrets.

**Harder**
- Two repositories, two CI pipelines, and a contract that must stay in sync.
- The SSRF guard logic exists in two places and can drift. Mitigation: port the
  `url-safety.test.ts` cases into the renderer, so both implementations are held
  to the same tests.
- Escalated audits take 1–5 s longer.
- Local development of the full flow needs Docker for the renderer. It stays
  optional: without `RENDERER_URL`, sitegap works as before.

**Known gap: DNS rebinding.** The guard resolves a hostname and checks the IP,
but Chromium resolves it again when it connects. A hostile DNS server can answer
with a public IP the first time and a private one the second. Route interception
cannot close this. Before any public deployment, the renderer must run on a
network with no route to internal services (an egress policy), so that a missed
check has nothing to reach.

**Revisit when**
- the metric from action item 1 shows escalation is rare — consider dropping the
  service, or moving to option F;
- a second consumer of the contract appears — publish the `.proto` through a
  registry (e.g. Buf) instead of copying it;
- the service is deployed — apply the egress policy above.

## Action items

**Before building**
1. [ ] Count `FAILED` audits whose `statusMessage` comes from `EXTRACTION_EMPTY`,
   and log which provider produced the text once escalation exists.

**`sitegap-renderer` repository**
2. [x] Scaffold NestJS with gRPC transport and `renderer.proto` (v1).
3. [x] Browser lifecycle: shared browser, context per request, bounded slots,
   graceful shutdown.
4. [x] SSRF guard on every request, service workers and WebSockets blocked;
   port the `url-safety.test.ts` cases.
5. [x] Text extraction with the same rules and caps as `basic-scraper.ts`.
6. [x] `grpc.health.v1` health service.
7. [x] Dockerfile on a pinned `mcr.microsoft.com/playwright` image, non-root
   user, with an init process for zombie reaping.
8. [ ] CI: lint, typecheck, tests. Publish the image to GHCR.
   *(CI done; the image is not published yet.)*
9. [x] Integration tests against a local HTTP server:
   - a page whose text appears only after JavaScript runs → text returned;
   - a page whose script calls `127.0.0.1` → that request is blocked.

**sitegap repository** (a new phase in `TASKS.md` first, per `AGENTS.md`)
10. [ ] Add the phase to `TASKS.md`; update `ARCHITECTURE.md` §2 and §8.
11. [ ] `rendered-scraper.ts` gRPC client with a 20 s deadline. Unit tests for the
    status → `ScrapeError` mapping and for the escalation rule.
12. [ ] Escalation in `scraper.service.ts`, enabled by `RENDERER_URL`.
13. [ ] `renderer` service in `docker-compose.yml`; README section.
