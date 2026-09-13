const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models"

export async function callGemini(params: {
  model: string
  apiKey: string
  systemPrompt: string
  userPrompt: string
}): Promise<string> {
  const response = await fetch(
    `${GEMINI_API_BASE}/${params.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: params.userPrompt }] }],
        systemInstruction: { parts: { text: params.systemPrompt } },
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  )

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(
      `Gemini API error ${response.status}: ${body.slice(0, 300)}`
    )
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

  if (typeof text !== "string") {
    throw new Error("Gemini response did not include generated text.")
  }

  return text
}
