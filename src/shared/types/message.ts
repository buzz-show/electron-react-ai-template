/**
 * 跨进程共享的核心数据类型 — 唯一权威来源
 *
 * 主进程（ipc payload 构造）和渲染进程（Zustand store、UI 组件）
 * 均从此处引用，避免类型漂移。
 */

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: string // undefined = 工具仍在执行中（UI 显示 spinner）
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[] // assistant 消息携带的工具调用列表
  toolCallId?: string // tool 消息关联的 call id（主进程内部消费）
}
