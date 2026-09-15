import type { BusinessType } from "@prisma/client"

import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts"
import { callGemini } from "./providers/gemini-provider"
import { callGroq } from "./providers/groq-provider"
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

type ProviderConfig = {
  provider: string
  apiKey: string
  model: string
}

async function callProvider(
  config: ProviderConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  switch (config.provider) {
    case "gemini":
      return callGemini({
        model: config.model,
        apiKey: config.apiKey,
        systemPrompt,
        userPrompt,
      })
    case "groq":
      return callGroq({
        model: config.model,
        apiKey: config.apiKey,
        systemPrompt,
        userPrompt,
      })
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`)
  }
}

function loadPrimaryConfig(): ProviderConfig | null {
  const provider = process.env.LLM_PROVIDER ?? "gemini"
  const apiKey = process.env.LLM_API_KEY
  const model = process.env.LLM_MODEL ?? "gemini-2.0-flash"

  if (!apiKey) return null
  return { provider, apiKey, model }
}

function loadFallbackConfig(): ProviderConfig | null {
  const provider = process.env.LLM_FALLBACK_PROVIDER
  const apiKey = process.env.LLM_FALLBACK_API_KEY
  const model = process.env.LLM_FALLBACK_MODEL ?? "openai/gpt-oss-120b"

  if (!provider || !apiKey) return null
  return { provider, apiKey, model }
}

export async function generateReport(input: {
  websiteUrl: string
  businessType: BusinessType
  manualContext?: string
  extractedText: string
}): Promise<Report> {
  const primary = loadPrimaryConfig()
  if (!primary) {
    throw new ReportGenerationError("LLM_FAILED", GENERATION_FAILED_MESSAGE)
  }

  const userPrompt = buildUserPrompt(input)
  const fallback = loadFallbackConfig()

  let rawText: string
  try {
    rawText = await callProvider(primary, SYSTEM_PROMPT, userPrompt)
  } catch (primaryError) {
    console.error(
      `[generateReport] ${primary.provider} call failed`,
      primaryError
    )

    if (!fallback) {
      throw new ReportGenerationError("LLM_FAILED", GENERATION_FAILED_MESSAGE)
    }

    try {
      rawText = await callProvider(fallback, SYSTEM_PROMPT, userPrompt)
    } catch (fallbackError) {
      console.error(
        `[generateReport] fallback ${fallback.provider} call failed`,
        fallbackError
      )
      throw new ReportGenerationError("LLM_FAILED", GENERATION_FAILED_MESSAGE)
    }
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
