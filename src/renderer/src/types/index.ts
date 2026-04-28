export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
  toolCallId?: string
}
