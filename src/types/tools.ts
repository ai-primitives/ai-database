export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  returns: Record<string, unknown>
}

export interface ToolProvider {
  namespace: string
  tools: ToolDefinition[]
}
