import { AIDocument, AIVectorSearchOptions } from '../types';
import { VectorSearchProvider } from '../types/vector';
import { createOpenAI } from '@ai-sdk/openai';
import type { EmbeddingModelV1 } from '@ai-sdk/provider';

interface EmbeddingResult {
  values: number[];
}

export class VectorSearch implements VectorSearchProvider {
  private embeddingModel: EmbeddingModelV1<string>;
  private documents: Map<string, { embedding: number[]; document: AIDocument }> = new Map();

  constructor(apiKey: string) {
    const openai = createOpenAI({ apiKey });
    this.embeddingModel = openai.textEmbeddingModel('text-embedding-3-small');
  }

  async search(query: string, options: AIVectorSearchOptions): Promise<AIDocument[]> {
    try {
      const { filter, limit = 10, model = 'text-embedding-3-small', minScore = 0 } = options;

      const queryEmbedding = await this.generateEmbeddings(query, model);

      const results = Array.from(this.documents.values())
        .map(({ embedding, document }) => ({
          document,
          similarity: this.cosineSimilarity(queryEmbedding, embedding),
        }))
        .filter(({ similarity, document }) => {
          if (similarity < minScore) return false;
          if (!filter) return true;
          return Object.entries(filter).every(([key, value]) =>
            Object.prototype.hasOwnProperty.call(document, key) &&
            document[key as keyof AIDocument] === value
          );
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return results.map(({ document }) => document);
    } catch (error) {
      throw new Error(`Vector search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async addDocument(document: AIDocument): Promise<void> {
    try {
      if (!document.id) {
        throw new Error('Document must have an ID');
      }
      const embedding = await this.generateEmbeddings(document.content);
      this.documents.set(document.id, { embedding, document });
    } catch (error) {
      throw new Error(`Failed to add document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateEmbeddings(text: string, model = 'text-embedding-3-small'): Promise<number[]> {
    try {
      const result = await this.embeddingModel.doEmbed({
        values: [text],
        abortSignal: undefined,
      });
      // Use double type assertion through unknown for safe type conversion
      const embedding = result.embeddings[0] as unknown as { values: number[] };
      return embedding.values;
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
