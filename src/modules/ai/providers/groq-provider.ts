const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions"

export async function callGroq(params: {
  model: string
  apiKey: string
  systemPrompt: string
  userPrompt: string
}): Promise<string> {
  const response = await fetch(GROQ_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8000,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Groq API error ${response.status}: ${body.slice(0, 300)}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content

  if (typeof text !== "string") {
    throw new Error("Groq response did not include generated text.")
  }

  return text
}
