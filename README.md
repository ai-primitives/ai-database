# ai-database

[![npm version](https://badge.fury.io/js/ai-database.svg)](https://badge.fury.io/js/ai-database)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

AI-native database abstraction with hybrid vector search capabilities for synthetic data, tool-calling, and RAG applications.

## Features
- Hybrid vector search optimized for AI workloads
- Synthetic data generation and management
- Tool-calling interface compatible with major AI SDKs
- Built-in support for RAG (Retrieval Augmented Generation)
- Seamless integration with mdxdb for document storage

## Installation
```bash
npm install ai-database
# or
pnpm add ai-database
# or
yarn add ai-database
```

## Quick Start
```typescript
import { createDatabase } from 'ai-database'

// Initialize database with vector search capabilities
const db = createDatabase({
  namespace: 'my-app',
  vectorSearch: true
})

// Store documents with embeddings
await db.collection('documents').store({
  content: 'Example document',
  embeddings: [0.1, 0.2, 0.3]
})

// Perform hybrid search
const results = await db.collection('documents').search({
  query: 'example',
  vector: [0.1, 0.2, 0.3],
  threshold: 0.8
})
```

## Tool Integration
ai-database exports AI-compatible tools that work with any LLM supporting function calling:

```typescript
import { tools } from 'ai-database'

// Use with any AI SDK (Vercel AI, LangChain, etc)
const searchTool = tools.vectorSearch({
  collection: 'documents',
  namespace: 'my-app'
})
```

## Integration with AI Primitives
ai-database is designed to work seamlessly with other AI Primitives packages:

- **ai-functions**: Provides database operations as callable AI functions
- **ai-workflows**: Enables database integration in AI workflow definitions
- **ai-agents**: Offers database access tools for AI agents

## API Reference
[API documentation link]

## Dependencies
Built on top of [mdxdb](https://github.com/ai-primitives/mdxdb) for robust document storage and vector search capabilities.
