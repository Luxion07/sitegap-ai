import { describe, expect, it } from "vitest"

import { sampleReport } from "./sample-report.fixture"
import { reportSchema } from "./schemas"

describe("reportSchema", () => {
  it("accepts a well-formed report", () => {
    const result = reportSchema.safeParse(sampleReport)

    expect(result.success).toBe(true)
  })

  it("rejects a report missing a required top-level key", () => {
    const withoutReadyFaq: Partial<typeof sampleReport> = { ...sampleReport }
    delete withoutReadyFaq.readyFaq

    const result = reportSchema.safeParse(withoutReadyFaq)

    expect(result.success).toBe(false)
  })

  it("rejects an unknown clarity category key", () => {
    const invalid = {
      ...sampleReport,
      clarityScore: {
        ...sampleReport.clarityScore,
        categories: [
          {
            key: "SPACE_TOURISM",
            label: "Space Tourism",
            status: "MISSING",
            priority: "LOW",
            note: "Not a real category.",
          },
        ],
      },
    }

    const result = reportSchema.safeParse(invalid)

    expect(result.success).toBe(false)
  })

  it("rejects a clarity score outside 0-100", () => {
    const invalid = {
      ...sampleReport,
      clarityScore: { ...sampleReport.clarityScore, overall: 150 },
    }

    const result = reportSchema.safeParse(invalid)

    expect(result.success).toBe(false)
  })

  it("rejects an invalid confidence value on readyFaq", () => {
    const invalid = {
      ...sampleReport,
      readyFaq: [{ ...sampleReport.readyFaq[0], confidence: "MADE_UP" }],
    }

    const result = reportSchema.safeParse(invalid)

    expect(result.success).toBe(false)
  })
})
