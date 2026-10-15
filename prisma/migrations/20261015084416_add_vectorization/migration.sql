-- Recreate HNSW index for cosine distance vector search
CREATE INDEX IF NOT EXISTS "knowledge_chunk_embedding_idx" ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
