import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { VectorSearch } from '../index';
import { AIDocument } from '../../types';
import { createOpenAI } from '@ai-sdk/openai';
import type { EmbeddingModelV1, EmbeddingModelV1Embedding, LanguageModelV1 } from '@ai-sdk/provider';
import type { OpenAIProvider } from '@ai-sdk/openai';

// Mock the OpenAI client
vi.mock('@ai-sdk/openai', () => {
  const mockDoEmbed = vi.fn().mockImplementation(async ({ values }: { values: string[] }) => ({
    embeddings: values.map(() => ({ values: [0.1, 0.2, 0.3] })),
    usage: { tokens: 10 },
    rawResponse: { headers: {} }
  }));

  const mockModel: LanguageModelV1 = {
    specificationVersion: 'v1',
    provider: 'openai',
    modelId: 'gpt-3.5-turbo-instruct',
    defaultObjectGenerationMode: undefined,
    doGenerate: vi.fn().mockResolvedValue({
      text: 'mocked response',
      usage: { tokens: 10 },
      rawResponse: { headers: {} }
    }),
    doStream: vi.fn(),
  };

  const mockEmbeddingModel: EmbeddingModelV1<string> = {
    specificationVersion: 'v1',
    provider: 'openai',
    modelId: 'text-embedding-3-small',
    maxEmbeddingsPerCall: 100,
    supportsParallelCalls: true,
    doEmbed: mockDoEmbed,
  };

  const createMockProvider = () => {
    const provider = {
      textEmbeddingModel: () => mockEmbeddingModel,
      textEmbedding: () => mockEmbeddingModel,
      languageModel: () => mockModel,
      chat: () => mockModel,
      completion: () => mockModel,
      embedding: () => mockEmbeddingModel,
      image: vi.fn(),
    };

    return Object.assign(
      (modelId: string) => mockModel,
      provider
    ) as unknown as OpenAIProvider;
  };

  return {
    createOpenAI: vi.fn(() => createMockProvider()),
  };
});

describe('VectorSearch', () => {
  const mockApiKey = 'test-api-key';
  let vectorSearch: VectorSearch;
  let mockDoEmbed: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoEmbed = vi.fn().mockImplementation(async ({ values }) => ({
      embeddings: values.map(() => ({ values: [0.1, 0.2, 0.3] })),
      usage: { tokens: 10 },
      rawResponse: { headers: {} }
    }));

    const mockModel: LanguageModelV1 = {
      specificationVersion: 'v1',
      provider: 'openai',
      modelId: 'gpt-3.5-turbo-instruct',
      defaultObjectGenerationMode: undefined,
      doGenerate: vi.fn().mockResolvedValue({
        text: 'mocked response',
        usage: { tokens: 10 },
        rawResponse: { headers: {} }
      }),
      doStream: vi.fn(),
    };

    const mockEmbeddingModel: EmbeddingModelV1<string> = {
      specificationVersion: 'v1',
      provider: 'openai',
      modelId: 'text-embedding-3-small',
      maxEmbeddingsPerCall: 100,
      supportsParallelCalls: true,
      doEmbed: mockDoEmbed,
    };

    const createMockProvider = () => {
      const provider = {
        textEmbeddingModel: () => mockEmbeddingModel,
        textEmbedding: () => mockEmbeddingModel,
        languageModel: () => mockModel,
        chat: () => mockModel,
        completion: () => mockModel,
        embedding: () => mockEmbeddingModel,
        image: vi.fn(),
      };

      return Object.assign(
        (modelId: string) => mockModel,
        provider
      ) as unknown as OpenAIProvider;
    };

    vi.mocked(createOpenAI).mockImplementation(() => createMockProvider());
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

    // Mock different similarity scores by returning different embeddings
    mockDoEmbed
      .mockImplementationOnce(async () => ({
        embeddings: [{ values: [1, 0, 0] }],
        usage: { tokens: 10 },
        rawResponse: { headers: {} }
      }))
      .mockImplementationOnce(async () => ({
        embeddings: [{ values: [0, 1, 0] }],
        usage: { tokens: 10 },
        rawResponse: { headers: {} }
      }))
      .mockImplementationOnce(async () => ({
        embeddings: [{ values: [1, 0, 0] }],
        usage: { tokens: 10 },
        rawResponse: { headers: {} }
      }));

    await Promise.all(mockDocuments.map(doc => vectorSearch.addDocument(doc)));

    const results = await vectorSearch.search('test query', { minScore: 0.9 });
    expect(results).toHaveLength(1);
  });
});
