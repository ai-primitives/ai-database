import type { VectorSearchOptions } from './mdxdb/types'
import type { EmbeddingOptions, EmbeddingProvider } from './mdxdb/embedding'

export interface AIVectorSearchOptions extends VectorSearchOptions {
  rerank?: boolean
  hybridWeight?: number
  contextWindow?: number
}

export interface AIEmbeddingOptions extends EmbeddingOptions {
  provider?: string
  batchSize?: number
  normalize?: boolean
}

export interface AIEmbeddingProvider extends EmbeddingProvider {
  batchEmbed?(texts: string[], options?: AIEmbeddingOptions): Promise<number[][]>
  normalize?(vector: number[]): number[]
}
