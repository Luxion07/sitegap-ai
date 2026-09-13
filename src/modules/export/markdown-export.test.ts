import { describe, expect, it } from "vitest"

import { sampleReport } from "@/modules/ai/sample-report.fixture"

import { buildMarkdownReport } from "./markdown-export"

describe("buildMarkdownReport", () => {
  const markdown = buildMarkdownReport(sampleReport, {
    websiteUrl: "https://example.com",
    businessTypeLabel: "Local service business",
    generatedAt: new Date("2026-09-13T00:00:00Z"),
  })

  it("includes the report metadata header", () => {
    expect(markdown).toContain("# Website FAQ & Content Gap Audit")
    expect(markdown).toContain("Website: https://example.com")
    expect(markdown).toContain("Business type: Local service business")
    expect(markdown).toContain("Generated: 2026-09-13")
  })

  it("includes all seven numbered sections", () => {
    for (const heading of [
      "## 1. Business Summary",
      "## 2. Detected Services / Offers",
      "## 3. Questions Already Answered",
      "## 4. Missing Visitor Questions",
      "## 5. Ready-to-Use FAQ",
      "## 6. Website Improvement Checklist",
      "## 7. HTML FAQ Block",
    ]) {
      expect(markdown).toContain(heading)
    }
  })

  it("embeds the generated HTML FAQ block in a fenced code block", () => {
    expect(markdown).toContain("```html")
    expect(markdown).toContain('<section class="faq-section">')
  })
})
