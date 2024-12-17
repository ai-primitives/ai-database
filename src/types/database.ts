import { AIDocument } from './document';
import { AIVectorSearchOptions } from './vector';

/**
 * Configuration options for the AI-native database
 */
export interface DatabaseConfig {
  /**
   * Database name or identifier
   */
  name: string;

  /**
   * Optional vector search configuration
   */
  vectorSearch?: {
    /**
     * Dimensions for vector embeddings
     */
    dimensions?: number;

    /**
     * Model to use for embeddings
     */
    model?: string;
  };

  /**
   * Optional synthetic data generation configuration
   */
  synthetic?: {
    /**
     * Model to use for synthetic data generation
     */
    model?: string;
  };
}

/**
 * Database provider interface
 */
export interface DatabaseProvider {
  /**
   * Query documents using AI-powered vector search
   */
  query(options: AIVectorSearchOptions): Promise<AIDocument[]>;

  /**
   * Insert a document into the database
   */
  insert(document: AIDocument): Promise<void>;
}
