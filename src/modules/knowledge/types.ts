export interface EmbeddingsProvider {
    embedQuery(text: string): Promise<number[]>
    embedBatch(texts: string[]): Promise<number[][]>
}