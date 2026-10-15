import { describe, expect, it, vi } from "vitest"

import { parseTipsFile } from "./ingest"
import { retrieveTips } from "./retrieval"
import type { EmbeddingsProvider } from "./types"

describe("parseTipsFile", () => {
  it("splits markdown content into chunks by h2 headers and computes hashes", () => {
    const markdown = `# Main Title

## Emergency response
Technicians arrive in 30 minutes.

## Diagnostic fee
Upfront pricing before work starts.
`
    const chunks = parseTipsFile(markdown, "test.md", "LOCAL_SERVICE")

    expect(chunks).toHaveLength(2)
    expect(chunks[0].businessType).toBe("LOCAL_SERVICE")
    expect(chunks[0].sourceFile).toBe("test.md")
    expect(chunks[0].content).toContain("## Emergency response")
    expect(chunks[0].contentHash).toMatch(/^[a-f0-9]{64}$/)

    expect(chunks[1].content).toContain("## Diagnostic fee")
    expect(chunks[1].contentHash).toMatch(/^[a-f0-9]{64}$/)
    expect(chunks[0].contentHash).not.toBe(chunks[1].contentHash)
  })

  it("returns empty array if no h2 headers exist", () => {
    const markdown = `# Just a title\nSome body text without h2.`
    const chunks = parseTipsFile(markdown, "empty.md", "B2B_SERVICE")
    expect(chunks).toHaveLength(0)
  })
})

describe("retrieveTips", () => {
  it("returns an empty array when provider throws an error (graceful degradation)", async () => {
    const failingProvider: EmbeddingsProvider = {
      embedQuery: vi.fn().mockRejectedValue(new Error("Gemini API down")),
      embedBatch: vi.fn().mockRejectedValue(new Error("Gemini API down")),
    }

    const tips = await retrieveTips({
      pageText: "Some plumbing text",
      businessType: "LOCAL_SERVICE",
      provider: failingProvider,
    })

    expect(tips).toEqual([])
  })

  it("returns an empty array when page text is blank", async () => {
    const tips = await retrieveTips({
      pageText: "   ",
      businessType: "LOCAL_SERVICE",
    })

    expect(tips).toEqual([])
  })
})
