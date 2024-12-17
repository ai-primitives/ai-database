import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorSearch } from '../index';
import { AIDocument } from '../../types';
import { createOpenAI } from '@ai-sdk/openai';

// Mock the OpenAI client
vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(() => ({
    textEmbeddingModel: () => ({
      specificationVersion: 'v1',
      provider: 'openai',
      modelId: 'text-embedding-3-small',
      maxEmbeddingsPerCall: 100,
      supportsParallelCalls: true,
      doEmbed: vi.fn().mockImplementation(async () => ({
        embeddings: [{ values: [0.1, 0.2, 0.3] }],
        usage: { tokens: 10 },
      })),
    }),
  })),
}));

describe('VectorSearch', () => {
  const mockApiKey = 'test-api-key';
  let vectorSearch: VectorSearch;
  let mockDoEmbed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoEmbed = vi.fn().mockImplementation(async () => ({
      embeddings: [{ values: [0.1, 0.2, 0.3] }],
      usage: { tokens: 10 },
    }));

    vi.mocked(createOpenAI).mockImplementation(() => ({
      textEmbeddingModel: () => ({
        specificationVersion: 'v1',
        provider: 'openai',
        modelId: 'text-embedding-3-small',
        maxEmbeddingsPerCall: 100,
        supportsParallelCalls: true,
        doEmbed: mockDoEmbed,
      }),
    }));

    vectorSearch = new VectorSearch(mockApiKey);
  });

  it('should initialize with API key', () => {
    expect(vectorSearch).toBeInstanceOf(VectorSearch);
    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: mockApiKey });
  });

  it('should add document and generate embeddings', async () => {
    const mockDocument: AIDocument = {
      id: 'test-1',
      content: 'Test content',
      type: 'test',
      data: { key: 'value' }
    };

    await vectorSearch.addDocument(mockDocument);
    const results = await vectorSearch.search('test query', { limit: 1 });

    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(mockDocument);
    expect(mockDoEmbed).toHaveBeenCalledTimes(2);
    expect(mockDoEmbed).toHaveBeenCalledWith({
      values: [mockDocument.content],
      abortSignal: undefined,
    });
  });

  it('should filter search results', async () => {
    const mockDocuments: AIDocument[] = [
      { id: 'test-1', content: 'Test content 1', type: 'typeA', data: { key: 'value1' } },
      { id: 'test-2', content: 'Test content 2', type: 'typeB', data: { key: 'value2' } },
    ];

    await Promise.all(mockDocuments.map(doc => vectorSearch.addDocument(doc)));

    const results = await vectorSearch.search('test query', {
      filter: { type: 'typeA' },
    });

    expect(results).toHaveLength(1);
    expect(results[0].type).toBe('typeA');
  });

  it('should handle embedding generation errors', async () => {
    const mockError = new Error('API Error');
    mockDoEmbed.mockRejectedValueOnce(mockError);

    await expect(vectorSearch.search('test query', {})).rejects.toThrow('Vector search failed');
  });

  it('should respect limit option', async () => {
    const mockDocuments: AIDocument[] = [
      { id: 'test-1', content: 'Test content 1', type: 'test', data: { key: 'value1' } },
      { id: 'test-2', content: 'Test content 2', type: 'test', data: { key: 'value2' } },
      { id: 'test-3', content: 'Test content 3', type: 'test', data: { key: 'value3' } },
    ];

    await Promise.all(mockDocuments.map(doc => vectorSearch.addDocument(doc)));

    const results = await vectorSearch.search('test query', { limit: 2 });
    expect(results).toHaveLength(2);
  });

  it('should respect minScore option', async () => {
    const mockDocuments: AIDocument[] = [
      { id: 'test-1', content: 'Test content 1', type: 'test', data: { key: 'value1' } },
      { id: 'test-2', content: 'Test content 2', type: 'test', data: { key: 'value2' } },
    ];

    // Mock different similarity scores
    mockEmbeddingModel.doEmbed
      .mockResolvedValueOnce({ embedding: [1, 0, 0] })
      .mockResolvedValueOnce({ embedding: [0, 1, 0] })
      .mockResolvedValueOnce({ embedding: [1, 0, 0] });

    await Promise.all(mockDocuments.map(doc => vectorSearch.addDocument(doc)));

    const results = await vectorSearch.search('test query', { minScore: 0.9 });
    expect(results).toHaveLength(1);
  });
});
