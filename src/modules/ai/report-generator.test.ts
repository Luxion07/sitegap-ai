import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { sampleReport } from "./sample-report.fixture"

const callGemini = vi.fn()
const callGroq = vi.fn()

vi.mock("./providers/gemini-provider", () => ({
  callGemini: (...args: unknown[]) => callGemini(...args),
}))
vi.mock("./providers/groq-provider", () => ({
  callGroq: (...args: unknown[]) => callGroq(...args),
}))

const { generateReport, ReportGenerationError } =
  await import("./report-generator")

const baseInput = {
  websiteUrl: "https://example.com",
  businessType: "LOCAL_SERVICE" as const,
  extractedText: "Some homepage text.",
}

const ORIGINAL_ENV = { ...process.env }

describe("generateReport", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env = { ...ORIGINAL_ENV }
    process.env.LLM_PROVIDER = "gemini"
    process.env.LLM_API_KEY = "primary-key"
    process.env.LLM_MODEL = "gemini-2.0-flash"
    delete process.env.LLM_FALLBACK_PROVIDER
    delete process.env.LLM_FALLBACK_API_KEY
    delete process.env.LLM_FALLBACK_MODEL
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("returns the parsed report when the primary provider succeeds", async () => {
    callGemini.mockResolvedValue(JSON.stringify(sampleReport))

    const result = await generateReport(baseInput)

    expect(result).toEqual(sampleReport)
    expect(callGroq).not.toHaveBeenCalled()
  })

  it("ignores any overall score the model sends and computes it from categories", async () => {
    callGemini.mockResolvedValue(
      JSON.stringify({
        ...sampleReport,
        clarityScore: { ...sampleReport.clarityScore, overall: 3 },
      })
    )

    const result = await generateReport(baseInput)

    expect(result.clarityScore.overall).toBe(25)
  })

  it("throws without calling any provider when no fallback is configured and the primary fails", async () => {
    callGemini.mockRejectedValue(new Error("Gemini API error 503"))

    await expect(generateReport(baseInput)).rejects.toThrow(
      ReportGenerationError
    )
    expect(callGroq).not.toHaveBeenCalled()
  })

  it("falls back to the secondary provider when the primary fails", async () => {
    process.env.LLM_FALLBACK_PROVIDER = "groq"
    process.env.LLM_FALLBACK_API_KEY = "fallback-key"

    callGemini.mockRejectedValue(new Error("Gemini API error 503"))
    callGroq.mockResolvedValue(JSON.stringify(sampleReport))

    const result = await generateReport(baseInput)

    expect(result).toEqual(sampleReport)
    expect(callGemini).toHaveBeenCalledTimes(1)
    expect(callGroq).toHaveBeenCalledTimes(1)
  })

  it("throws a ReportGenerationError when both providers fail", async () => {
    process.env.LLM_FALLBACK_PROVIDER = "groq"
    process.env.LLM_FALLBACK_API_KEY = "fallback-key"

    callGemini.mockRejectedValue(new Error("Gemini API error 503"))
    callGroq.mockRejectedValue(new Error("Groq API error 429"))

    await expect(generateReport(baseInput)).rejects.toThrow(
      ReportGenerationError
    )
  })

  it("throws when the primary API key is missing", async () => {
    delete process.env.LLM_API_KEY

    await expect(generateReport(baseInput)).rejects.toThrow(
      ReportGenerationError
    )
    expect(callGemini).not.toHaveBeenCalled()
  })
})
