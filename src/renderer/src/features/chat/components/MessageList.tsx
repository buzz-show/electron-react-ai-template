import { useEffect, useRef } from 'react'

import { useChatStore } from '../store/chatStore'

import MessageItem from './MessageItem'

export default function MessageList() {
  const { messages } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 select-none gap-2">
        <div className="text-3xl">✦</div>
        <p className="text-sm">开始一段对话吧</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map(msg => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
