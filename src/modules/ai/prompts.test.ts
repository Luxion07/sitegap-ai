import { describe, expect, it } from "vitest"

import { buildUserPrompt } from "./prompts"

describe("buildUserPrompt tips integration", () => {
  const baseInput = {
    websiteUrl: "https://example.com",
    businessType: "LOCAL_SERVICE" as const,
    extractedText: "Emergency plumbing repairs in Moscow.",
  }

  it("does not include reference tips section when tips are not provided or empty", () => {
    const withoutTips = buildUserPrompt(baseInput)
    expect(withoutTips).not.toContain("Reference industry tips")

    const withEmptyTips = buildUserPrompt({ ...baseInput, tips: [] })
    expect(withEmptyTips).not.toContain("Reference industry tips")
  })

  it("includes reference tips section with cautionary instructions when tips are provided", () => {
    const tips = [
      "## Emergency response time\nArrive in 30 minutes.",
      "## Callout fees\nUpfront diagnostic pricing.",
    ]

    const prompt = buildUserPrompt({ ...baseInput, tips })

    expect(prompt).toContain("Reference industry tips")
    expect(prompt).toContain("Emergency response time")
    expect(prompt).toContain("Callout fees")
    expect(prompt).toContain(
      "never assume the website has these features unless explicitly stated"
    )
  })
})
