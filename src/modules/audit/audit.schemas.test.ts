import { describe, expect, it } from "vitest"

import { createAuditSchema } from "./audit.schemas"

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    websiteUrl: "https://example.com",
    businessType: "LOCAL_SERVICE",
    ...overrides,
  }
}

describe("createAuditSchema", () => {
  it("accepts a valid URL and business type", () => {
    const result = createAuditSchema.safeParse(validInput())

    expect(result.success).toBe(true)
  })

  it("accepts an optional manualContext", () => {
    const result = createAuditSchema.safeParse(
      validInput({ manualContext: "We repair bikes in Berlin." })
    )

    expect(result.success).toBe(true)
  })

  it("rejects a malformed URL", () => {
    const result = createAuditSchema.safeParse(
      validInput({ websiteUrl: "example" })
    )

    expect(result.success).toBe(false)
  })

  it("rejects non-http(s) schemes", () => {
    const result = createAuditSchema.safeParse(
      validInput({ websiteUrl: "ftp://example.com" })
    )

    expect(result.success).toBe(false)
  })

  it("rejects a missing business type", () => {
    const result = createAuditSchema.safeParse({
      websiteUrl: "https://example.com",
    })

    expect(result.success).toBe(false)
  })

  it("rejects an unknown business type", () => {
    const result = createAuditSchema.safeParse(
      validInput({ businessType: "SPACE_TOURISM" })
    )

    expect(result.success).toBe(false)
  })

  it("rejects manualContext longer than 5000 characters", () => {
    const result = createAuditSchema.safeParse(
      validInput({ manualContext: "x".repeat(5001) })
    )

    expect(result.success).toBe(false)
  })

  it("returns a user-facing message for an invalid URL", () => {
    const result = createAuditSchema.safeParse(
      validInput({ websiteUrl: "example" })
    )

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0].message).toBe(
      "Please enter a valid website URL."
    )
  })
})
