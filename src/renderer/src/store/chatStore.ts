import { create } from 'zustand'
import { Message } from '../types'

interface ChatStore {
  messages: Message[]
  systemPrompt: string
  addMessage: (msg: Omit<Message, 'id'>) => void
  updateLastAssistantMessage: (delta: string) => void
  clearMessages: () => void
  setSystemPrompt: (prompt: string) => void
}

let idCounter = 0
const genId = (): string => `msg-${++idCounter}-${Date.now()}`

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  systemPrompt: 'You are a helpful assistant. Respond in the same language as the user.',

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, { ...msg, id: genId() }]
    })),

  // 流式追加：每次 chunk 到来时追加到最后一条 assistant 消息的 content
  updateLastAssistantMessage: (delta) =>
    set((state) => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + delta }
      }
      return { messages: msgs }
    }),

  clearMessages: () => set({ messages: [] }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt })
}))
