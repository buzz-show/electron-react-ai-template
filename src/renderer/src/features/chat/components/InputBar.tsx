import { useState, KeyboardEvent, useRef, useEffect } from 'react'

import { useStreamChat } from '../hooks/useStreamChat'

export default function InputBar() {
  const [input, setInput] = useState('')
  const { sendMessage, streaming } = useStreamChat()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const handleSend = () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-800 bg-gray-900 px-4 py-3 shrink-0">
      <div className="flex items-end gap-2 bg-gray-800 rounded-2xl px-4 py-2.5">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={streaming ? '正在生成回复…' : '输入消息，Enter 发送，Shift+Enter 换行'}
          disabled={streaming}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-100 placeholder-gray-500 max-h-40 py-0.5 disabled:opacity-50 leading-relaxed"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          aria-label="发送"
        >
          {streaming ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
