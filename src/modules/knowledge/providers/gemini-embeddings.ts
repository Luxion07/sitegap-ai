import type { EmbeddingsProvider } from "../types"

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models"

export class GeminiEmbeddingsProvider implements EmbeddingsProvider {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model = "text-embedding-004") {
    const key =
      apiKey ?? process.env.GEMINI_API_KEY ?? process.env.LLM_API_KEY
    if (!key) {
      throw new Error(
        "Gemini API key is required for embeddings (set GEMINI_API_KEY or LLM_API_KEY)."
      )
    }
    this.apiKey = key
    this.model = model
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await fetch(
      `${GEMINI_API_BASE}/${this.model}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          content: {
            parts: [{ text: text.slice(0, 8000) }],
          },
          outputDimensionality: 768,
        }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      throw new Error(
        `Gemini embedContent failed with status ${response.status}: ${errorBody.slice(0, 300)}`
      )
    }

    const data = await response.json()
    const values = data?.embedding?.values

    if (!Array.isArray(values)) {
      throw new Error("Gemini response did not contain embedding values.")
    }

    return values
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return []

    const response = await fetch(
      `${GEMINI_API_BASE}/${this.model}:batchEmbedContents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          requests: texts.map((t) => ({
            model: `models/${this.model}`,
            content: {
              parts: [{ text: t.slice(0, 8000) }],
            },
            outputDimensionality: 768,
          })),
        }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      throw new Error(
        `Gemini batchEmbedContents failed with status ${response.status}: ${errorBody.slice(0, 300)}`
      )
    }

    const data = await response.json()
    const embeddings = data?.embeddings

    if (!Array.isArray(embeddings)) {
      throw new Error("Gemini response did not contain batch embeddings.")
    }

    return embeddings.map((item: { values: number[] }) => item.values)
  }
}
