import type { Document } from './mdxdb/types'

export interface AIDocument extends Document {
  metadata?: {
    model?: string
    temperature?: number
    tokens?: number
    provider?: string
  }
  synthetic?: boolean
  toolCalls?: Array<{
    name: string
    arguments: Record<string, unknown>
    result?: unknown
  }>
}
