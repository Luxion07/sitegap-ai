import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import type { BusinessType } from "@prisma/client"

import { prisma } from "@/db/prisma"

import { GeminiEmbeddingsProvider } from "./providers/gemini-embeddings"

export const TIP_FILES: Array<{ file: string; businessType: BusinessType }> = [
  { file: "local-service.md", businessType: "LOCAL_SERVICE" },
  { file: "b2b-service.md", businessType: "B2B_SERVICE" },
  { file: "agency-consulting.md", businessType: "AGENCY_CONSULTING" },
  { file: "other-service.md", businessType: "OTHER_SERVICE" },
]

export interface ParsedChunk {
  businessType: BusinessType
  sourceFile: string
  content: string
  contentHash: string
}

export function parseTipsFile(
  fileContent: string,
  sourceFile: string,
  businessType: BusinessType
): ParsedChunk[] {
  const rawSections = fileContent.split(/(?=^##\s+)/m)
  const chunks: ParsedChunk[] = []

  for (const section of rawSections) {
    const trimmed = section.trim()
    if (!trimmed.startsWith("##")) {
      continue
    }

    const contentHash = crypto
      .createHash("sha256")
      .update(trimmed)
      .digest("hex")

    chunks.push({
      businessType,
      sourceFile,
      content: trimmed,
      contentHash,
    })
  }

  return chunks
}

export async function ingest(): Promise<{
  total: number
  inserted: number
  skipped: number
  deleted: number
}> {
  const tipsDir = path.resolve(process.cwd(), "src/modules/knowledge/tips")
  console.log(`[ingest] Reading tips from: ${tipsDir}`)

  const allChunks: ParsedChunk[] = []

  for (const { file, businessType } of TIP_FILES) {
    const filePath = path.join(tipsDir, file)
    if (!fs.existsSync(filePath)) {
      console.warn(`[ingest] Warning: tips file not found: ${filePath}`)
      continue
    }

    const content = fs.readFileSync(filePath, "utf8")
    const chunks = parseTipsFile(content, file, businessType)
    allChunks.push(...chunks)
  }

  console.log(`[ingest] Parsed ${allChunks.length} chunks from ${TIP_FILES.length} files.`)

  const existingChunksInDb = await prisma.knowledgeChunk.findMany({
    select: { id: true, contentHash: true, sourceFile: true },
  })

  const existingHashMap = new Map<string, string>()
  for (const row of existingChunksInDb) {
    existingHashMap.set(row.contentHash, row.id)
  }

  const chunksToInsert = allChunks.filter(
    (c) => !existingHashMap.has(c.contentHash)
  )

  const currentHashes = new Set(allChunks.map((c) => c.contentHash))
  const obsoleteIds: string[] = existingChunksInDb
    .filter((row) => !currentHashes.has(row.contentHash))
    .map((row) => row.id)

  let deletedCount = 0
  if (obsoleteIds.length > 0) {
    console.log(`[ingest] Removing ${obsoleteIds.length} obsolete chunks from database...`)
    const deleteResult = await prisma.knowledgeChunk.deleteMany({
      where: { id: { in: obsoleteIds } },
    })
    deletedCount = deleteResult.count
  }

  if (chunksToInsert.length === 0) {
    console.log(
      `[ingest] Database is up to date! (${allChunks.length} chunks unchanged, 0 API calls made).`
    )
    return {
      total: allChunks.length,
      inserted: 0,
      skipped: allChunks.length,
      deleted: deletedCount,
    }
  }

  console.log(
    `[ingest] Generating embeddings for ${chunksToInsert.length} new chunks via Gemini...`
  )
  const provider = new GeminiEmbeddingsProvider()
  const textsToEmbed = chunksToInsert.map((c) => c.content)
  const embeddings = await provider.embedBatch(textsToEmbed)

  if (embeddings.length !== chunksToInsert.length) {
    throw new Error(
      `[ingest] Embeddings count mismatch: expected ${chunksToInsert.length}, got ${embeddings.length}`
    )
  }

  console.log(`[ingest] Inserting ${chunksToInsert.length} chunks into database...`)
  for (let i = 0; i < chunksToInsert.length; i++) {
    const chunk = chunksToInsert[i]
    const vectorString = `[${embeddings[i].join(",")}]`
    const id = crypto.randomUUID()

    await prisma.$executeRaw`
      INSERT INTO "KnowledgeChunk" (
        "id",
        "businessType",
        "sourceFile",
        "content",
        "contentHash",
        "embedding",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${chunk.businessType}::"BusinessType",
        ${chunk.sourceFile},
        ${chunk.content},
        ${chunk.contentHash},
        ${vectorString}::vector,
        NOW(),
        NOW()
      )
    `
  }

  console.log(
    `[ingest] Success! Inserted ${chunksToInsert.length} chunks, skipped ${allChunks.length - chunksToInsert.length}.`
  )

  return {
    total: allChunks.length,
    inserted: chunksToInsert.length,
    skipped: allChunks.length - chunksToInsert.length,
    deleted: deletedCount,
  }
}

if (process.env.NODE_ENV !== "test") {
  ingest()
    .then((stats) => {
      console.log(`[ingest] Finished:`, stats)
      process.exit(0)
    })
    .catch((err) => {
      console.error("[ingest] Fatal error during ingestion:", err)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}