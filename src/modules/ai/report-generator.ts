import type { BusinessType } from "@prisma/client"

import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts"
import { callGemini } from "./providers/gemini-provider"
import { reportSchema, type Report } from "./schemas"

const GENERATION_FAILED_MESSAGE = "Report generation failed. Please try again."

export class ReportGenerationError extends Error {
  code: "LLM_FAILED" | "LLM_INVALID_JSON"

  constructor(code: ReportGenerationError["code"], message: string) {
    super(message)
    this.name = "ReportGenerationError"
    this.code = code
  }
}

export async function generateReport(input: {
  websiteUrl: string
  businessType: BusinessType
  manualContext?: string
  extractedText: string
}): Promise<Report> {
  const provider = process.env.LLM_PROVIDER ?? "gemini"
  const apiKey = process.env.LLM_API_KEY
  const model = process.env.LLM_MODEL ?? "gemini-2.0-flash"

  if (!apiKey) {
    throw new ReportGenerationError("LLM_FAILED", GENERATION_FAILED_MESSAGE)
  }
  if (provider !== "gemini") {
    throw new ReportGenerationError("LLM_FAILED", GENERATION_FAILED_MESSAGE)
  }

  const userPrompt = buildUserPrompt(input)

  let rawText: string
  try {
    rawText = await callGemini({
      model,
      apiKey,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
    })
  } catch (error) {
    console.error("[generateReport] Gemini call failed", error)
    throw new ReportGenerationError("LLM_FAILED", GENERATION_FAILED_MESSAGE)
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(rawText)
  } catch (error) {
    console.error(
      "[generateReport] LLM output was not valid JSON",
      error,
      rawText.slice(0, 500)
    )
    throw new ReportGenerationError(
      "LLM_INVALID_JSON",
      GENERATION_FAILED_MESSAGE
    )
  }

  const result = reportSchema.safeParse(parsedJson)
  if (!result.success) {
    console.error(
      "[generateReport] LLM JSON failed schema validation",
      result.error.issues
    )
    throw new ReportGenerationError(
      "LLM_INVALID_JSON",
      GENERATION_FAILED_MESSAGE
    )
  }

  return result.data
}
