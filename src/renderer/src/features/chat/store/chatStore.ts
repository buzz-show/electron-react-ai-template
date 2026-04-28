import { create } from 'zustand'
import { Message, ToolCall } from '@shared/types'

interface ChatStore {
  messages: Message[]
  systemPrompt: string
  addMessage: (msg: Omit<Message, 'id'>) => void
  updateLastAssistantMessage: (delta: string) => void
  appendToolCallToLast: (toolCalls: ToolCall[]) => void
  updateToolCallResult: (id: string, result: string) => void
  clearMessages: () => void
  setSystemPrompt: (prompt: string) => void
}

let idCounter = 0
const genId = (): string => `msg-${++idCounter}-${Date.now()}`

export const useChatStore = create<ChatStore>(set => ({
  messages: [],
  systemPrompt: 'You are a helpful assistant. Respond in the same language as the user.',

  addMessage: msg =>
    set(state => ({
      messages: [...state.messages, { ...msg, id: genId() }],
    })),

  updateLastAssistantMessage: delta =>
    set(state => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + delta }
      }
      return { messages: msgs }
    }),

  appendToolCallToLast: toolCalls =>
    set(state => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = {
          ...last,
          toolCalls: [...(last.toolCalls ?? []), ...toolCalls],
        }
      }
      return { messages: msgs }
    }),

  updateToolCallResult: (id, result) =>
    set(state => {
      const msgs = state.messages.map(msg => {
        if (!msg.toolCalls) return msg
        const updated = msg.toolCalls.map(tc => (tc.id === id ? { ...tc, result } : tc))
        return { ...msg, toolCalls: updated }
      })
      return { messages: msgs }
    }),

  clearMessages: () => set({ messages: [] }),
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
}))
