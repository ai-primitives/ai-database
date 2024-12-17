export interface SyntheticDataOptions {
  schema: Record<string, unknown>
  count: number
  model?: string
  temperature?: number
}

export interface SyntheticDataProvider {
  generate(options: SyntheticDataOptions): Promise<unknown[]>
}
