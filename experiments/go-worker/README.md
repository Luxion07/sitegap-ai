# Go Audit Worker Spike (`BLPOP` + `pgxpool`)

## Context

When moving report generation off the synchronous `POST /api/audits` request path onto a Redis-backed job queue (Stage 3 in `docs/ARCHITECTURE.md`), we evaluated a standalone Go worker (`go-redis` + `pgxpool`) alongside a TypeScript `BullMQ` worker.

## What Is Implemented Here

- **Graceful Shutdown (`cmd/worker/main.go`)**: OS signal handling (`SIGINT` / `SIGTERM`) propagated via `context.Context`.
- **Redis Consumer (`internal/queue`)**: Blocking list pop (`BLPOP` with bounded polling interval) and JSON payload deserialization, covered by unit tests (`queue_test.go`).
- **PostgreSQL Pool (`internal/db`)**: Connection pooling via `pgxpool` against Supabase PostgreSQL (`GetAudit`, `MarkFailed`).
- **Environment Configuration (`internal/config`)**: Loads `REDIS_URL` and `DATABASE_URL`.

## Architectural Decision (ADR)

**Decision:** Use **Node.js / TypeScript + BullMQ** (`src/worker`) for the production audit worker, and retain this Go implementation in `experiments/go-worker` as a reference consumer.

**Rationale:**
1. **Single Source of Truth (DRY):** Report generation depends on domain logic already implemented and tested in TypeScript (`src/modules/scraping`, `src/modules/knowledge` pgvector RAG retrieval, `src/modules/ai` prompts/schemas/provider fallback, and `src/modules/export`) and shared with the MCP server (`src/mcp`). Re-implementing and maintaining two copies of prompts, Zod schemas, and HTML/Markdown templates across TypeScript and Go introduces drift risk without latency benefits (since job duration is dominated by external LLM network I/O).
2. **Queue Primitives:** `BullMQ` provides battle-tested delayed retries, exponential backoff, stalled-job recovery, and concurrency control out of the box on Redis.
3. **Future Scaling:** If high-throughput HTML fetching or CPU-bound parsing ever needs to be isolated from the Node.js runtime, this Go service provides a ready-made foundation.

## Running Locally

```bash
cd experiments/go-worker
go test ./...
go run ./cmd/worker
```
