# ADR-0002: Multi-page crawling as a separate Go service with Kafka

**Status:** Proposed
**Date:** 2026-11-20
**Deciders:** Alex Kozhukhar (project owner)

## Context

An audit reads one page: the homepage
([`basic-scraper.ts`](../../src/modules/scraping/providers/basic-scraper.ts),
with [sitegap-renderer](0001-headless-renderer-service.md) as a fallback for
client-rendered homepages). The answers a visitor looks for usually live on
other pages — prices, delivery, contacts, FAQ. A homepage-only audit therefore
reports content as missing when the site has it on `/ceni` or `/faq`, which
makes the report wrong rather than merely incomplete.

Reading more of the site means crawling: discovering pages (sitemaps, links),
choosing which are worth reading, skipping duplicates and traps, and staying
polite to small sites (robots.txt, at most one request per second). Every
discovered URL comes from an untrusted page, so every connection needs the SSRF
check that today runs once per audit.

Constraints:

- `AGENTS.md` lists multi-page crawling as out of scope until
  the docs change. This ADR is that change for the crawler itself; sitegap-ai's
  own scope note changes only when the integration phase starts.
- [`ARCHITECTURE.md` §8](../ARCHITECTURE.md) allows separate services only with
  a real reason. Volume today is a few audits a day.
- More pages mean more LLM input. That cost belongs to the integration step and
  is limited by the page cap (20 by default, 50 at most).

This is also a portfolio project. Hands-on experience with Go concurrency,
Kafka, and running the system on Kubernetes is an explicit, secondary goal; it
is stated here so it is not mistaken for a technical requirement. **At today's
volume, Kafka is not needed** — option C below would carry the load. The
service is designed for the case where many audits run at once, and that case
is demonstrated with a load test, not claimed.

## Decision

1. Add a standalone service, **`sitegap-crawler`**, in its own repository, in Go.
2. One Kafka message is **one site to crawl**, not one page:
   `crawl.requests` (key = site host) → crawler workers →
   `crawl.pages` + `crawl.completed`. Pages of one site are crawled
   sequentially inside one worker; parallelism comes from many sites at once.
3. A crawl reads `robots.txt` and sitemaps, follows links on the same host, and
   picks pages in priority order (homepage, menu, keyword pages, the rest by
   depth). It stops at the page cap or after 2 minutes.
4. The crawler checks **every** connection with its own SSRF guard and dials the
   address it checked, with no second DNS lookup.
5. The MVP is the crawler alone, driven by a CLI and Kafka. Integration with
   sitegap-ai comes last, as its own phase in both repositories.

```text
requester ──► Kafka: crawl.requests (key = host)
                 │
                 ▼  consumer group
         ┌──────────────────────────────────────────────┐
         │ crawler worker                               │
         │   fixed pool of goroutines, one per site     │
         │   per-host limiter: 1 request/s              │
         │   SSRF guard on every dial                   │
         └──────────────────────────────────────────────┘
                 │                          │
                 ▼                          ▼
     Kafka: crawl.pages           websites (HTTP GET)
            crawl.completed
```

The full behaviour and contracts are in the crawler's `docs/SPEC.md`; the
internals are in its `docs/ARCHITECTURE.md`.

## Options considered

| | A. Status quo | B. Loop in the TS worker | C. Go service, no queue | D. Go service, site per message | E. Go service, page per message | F. Managed crawl API |
|---|---|---|---|---|---|---|
| Reads more than the homepage | No | Yes | Yes | Yes | Yes | Yes |
| Complexity | None | Low | Medium | Medium–High | High | Low |
| Fits today's volume | — | Yes | Yes | Yes (oversized) | Yes (oversized) | Yes |
| Many sites at once | — | Weak | Bounded by one process | Scales with partitions | Scales with partitions | Vendor |
| Politeness per host | — | Simple | Simple | Simple (key = host) | Hard (no delayed delivery) | Vendor |
| Knowing a crawl is done | — | Simple | Simple | Simple | Distributed counter | Vendor |
| Running cost | None | None | One container | Kafka + container | Kafka + Redis + container | Per page |

**A. Status quo.** Free, but reports stay wrong for sites whose content is not
on the homepage.

**B. Crawl loop inside the TypeScript worker.** The shortest path, and the right
one if the product were the only goal: a loop over `fetch` + `cheerio` with a
page cap. Rejected because the worker would hold up to two minutes of crawling
per job, and because the secondary goal (Go, Kafka) would not be served.

**C. Go service called synchronously (gRPC or CLI), no queue.** Isolates the
crawler and keeps the contract simple. Rejected for the MVP because it cannot
show the scaling story; it remains the fallback if Kafka proves to be more cost
than value.

**D. Go service, one Kafka message per site — chosen.** See the trade-off
analysis.

**E. Go service, one Kafka message per URL (distributed frontier).** The design
of large crawlers. Rejected: Kafka has no delayed delivery, so politeness needs
a separate scheduler; knowing when a crawl is done needs a shared counter; and
duplicate detection needs a shared store. All of that buys nothing for crawls of
at most 50 pages.

**F. Managed crawl API (Firecrawl, Apify, etc.).** No infrastructure, but every
audited site goes to a third party, each page has a price, and there is nothing
to learn from it.

## Trade-off analysis

**Why a site per message (D vs E).** A crawl is small: at most 50 pages and two
minutes. Keeping its frontier, seen URLs and content hashes in one goroutine's
memory makes every hard part of crawling local and testable. Kafka is used for
what it does well — buffering bursts of requests, spreading them across
workers, and surviving a worker crash by redelivery.

**Why key = host.** All crawls of one site land on one partition, so on one
worker. That worker's in-memory rate limiter is then the only limiter for the
site, and politeness holds across the whole cluster without Redis.

**Why Go.** The work is waiting on the network for thousands of sites at once.
Goroutines, channels and `context` fit that directly, and a static binary makes
a small container. The Phase 9 decision kept TypeScript for the audit worker
because domain logic is shared there; the crawler shares none — its only shared
rules are the SSRF policy and text extraction, both kept in step by ported
tests and fixtures.

**Why at-least-once with attempts.** Crawls finish out of order, so offsets are
committed only up to the oldest unfinished crawl. A crashed worker's crawls run
again with a new `attempt_id`; consumers keep only the pages of an attempt that
produced `crawl.completed`. Exactly-once delivery would add transactions for no
practical gain.

## Consequences

**Easier**
- Reports based on the pages that actually hold the answers.
- Handling bursts: requests wait in Kafka instead of overloading the worker.
- Adding consumers of crawl results later (re-audit, change detection) without
  touching the crawler.

**Harder**
- A third repository and a third language in the system.
- Text extraction rules now exist in three places (sitegap-ai, renderer,
  crawler). Mitigation: shared HTML fixtures with expected text.
- The SSRF policy exists in three places. Mitigation: the same ported test
  cases.
- Kafka to run locally (`docker compose`) and, later, in Kubernetes.
- More LLM input per audit once integrated; bounded by the page cap.

**Known gaps**
- **Client-rendered sites without a sitemap** yield only the homepage: their
  links exist only after JavaScript runs.
- **Egress policy.** The crawler closes DNS rebinding by dialing the checked
  address, but any deployment beyond a laptop should still run it on a network
  with no route to internal services.

**Revisit when**
- the count from ADR-0001 action item 1 shows client-rendered sites are common —
  add links to sitegap-renderer's response in a `v2` contract and use it from
  the crawler;
- crawls need far more than 50 pages — reconsider option E;
- Kafka turns out to cost more than it gives at real volume — fall back to
  option C.

## Action items

**`sitegap-crawler` repository** (phases in its `TASKS.md`)
1. [x] SPEC, ARCHITECTURE, TASKS.
2. [ ] Scaffold: module, CLI, lint, CI.
3. [ ] Fetch one page through the SSRF guard; port the `url-safety.test.ts`
   cases.
4. [ ] Crawl one site: robots.txt, sitemaps, priority, politeness, limits.
5. [ ] Many sites at once: goroutine pool, backpressure, graceful shutdown.
6. [ ] Kafka worker with an offset tracker; Docker and `docker compose`.
7. [ ] Synthetic web and a load test with published numbers.
8. [ ] Metrics, Kubernetes (kind, Strimzi, KEDA), chaos tests, image on GHCR.

**sitegap repository** (a new phase in `TASKS.md` first)
9. [ ] Update the scope note, SPEC and ARCHITECTURE for multi-page audits.
10. [ ] Send `crawl.requests` and read the results from the audit worker.
11. [ ] Analyse several pages per audit within the LLM budget.
