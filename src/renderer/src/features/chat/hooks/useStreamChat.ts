import { useState, useCallback, useRef } from 'react'

import { useChatStore } from '../store/chatStore'

export function useStreamChat() {
  const [streaming, setStreaming] = useState(false)
  const {
    addMessage,
    updateLastAssistantMessage,
    appendToolCallToLast,
    updateToolCallResult,
    messages,
    systemPrompt,
  } = useChatStore()
  const cleanupRef = useRef<(() => void)[]>([])

  const sendMessage = useCallback(
    (userInput: string) => {
      if (!userInput.trim() || streaming) return

      addMessage({ role: 'user', content: userInput })
      addMessage({ role: 'assistant', content: '' })
      setStreaming(true)

      const offChunk = window.electronAPI.onChunk(delta => {
        updateLastAssistantMessage(delta)
      })
      const offDone = window.electronAPI.onDone(() => {
        setStreaming(false)
        cleanupRef.current.forEach(fn => fn())
        cleanupRef.current = []
      })
      const offError = window.electronAPI.onError(msg => {
        updateLastAssistantMessage(`\n\n> **错误：** ${msg}`)
        setStreaming(false)
        cleanupRef.current.forEach(fn => fn())
        cleanupRef.current = []
      })
      const offToolCall = window.electronAPI.onToolCall(({ id, name, args }) => {
        appendToolCallToLast([{ id, name, args }])
      })
      const offToolResult = window.electronAPI.onToolResult(({ id, result }) => {
        updateToolCallResult(id, result)
      })

      cleanupRef.current = [offChunk, offDone, offError, offToolCall, offToolResult]

      window.electronAPI.startStream([
        { role: 'system', content: systemPrompt },
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: 'user', content: userInput },
      ])
    },
    [
      messages,
      systemPrompt,
      streaming,
      addMessage,
      updateLastAssistantMessage,
      appendToolCallToLast,
      updateToolCallResult,
    ]
  )

  return { sendMessage, streaming }
}
