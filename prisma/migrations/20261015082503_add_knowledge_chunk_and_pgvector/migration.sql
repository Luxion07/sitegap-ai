-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector (768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChunk_contentHash_key" ON "KnowledgeChunk" ("contentHash");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_businessType_idx" ON "KnowledgeChunk" ("businessType");

-- CreateIndex
CREATE INDEX "knowledge_chunk_embedding_idx" ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);