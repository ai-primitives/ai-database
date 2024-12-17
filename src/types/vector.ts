import { AIDocument } from './document';

export interface AIVectorSearchOptions {
  filter?: Record<string, unknown>;
  limit?: number;
  model?: string;
  minScore?: number;
  hybridWeight?: number;
}

export interface VectorSearchProvider {
  search(query: string, options: AIVectorSearchOptions): Promise<AIDocument[]>;
  generateEmbeddings(text: string, model?: string): Promise<number[]>;
}
