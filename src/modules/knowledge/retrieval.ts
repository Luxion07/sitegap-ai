import type { BusinessType } from "@prisma/client"
import { prisma } from "@/db/prisma"
import { GeminiEmbeddingsProvider } from "./providers/gemini-embeddings"
import type { EmbeddingsProvider } from "./types"

export interface RetrieveTipsParams {
    pageText: string
    businessType: BusinessType
    manualContext?: string
    limit?: number
    provider?: EmbeddingsProvider
}
export async function retrieveTips(params: RetrieveTipsParams): Promise<string[]> {
    const manualContextBlock = params.manualContext ? `\n\n${params.manualContext}` : ""
    const combinedQueryText = `${params.pageText}${manualContextBlock}`.trim().slice(0, 8000)

    if (combinedQueryText.length === 0) {
        return []
    }

    try {
        const embeddingsProvider = params.provider ?? new GeminiEmbeddingsProvider()
        const queryVector = await embeddingsProvider.embedQuery(combinedQueryText)

        const vectorSqlParameter = `[${queryVector.join(",")}]`
        const maxTipsLimit = params.limit ?? 5

        const matchedTipRows = await prisma.$queryRaw<Array<{ content: string }>>`
          SELECT "content"
          FROM "KnowledgeChunk"
          WHERE "businessType" = ${params.
                businessType}::"BusinessType"
          ORDER BY "embedding" <=>
        ${vectorSqlParameter}::vector ASC
          LIMIT ${maxTipsLimit};
        `

        return matchedTipRows.map((row) => row.content)
    } catch (error) {
        
        console.warn(
            `[retrieveTips] Failed to retrieve tips for
  business type "${params.businessType}". Falling back
  to report without tips.`,
            error
        )
        return []
    }
}