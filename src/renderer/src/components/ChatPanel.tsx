import MessageList from './MessageList'
import InputBar from './InputBar'
import { useChatStore } from '../store/chatStore'

export default function ChatPanel() {
  const { clearMessages } = useChatStore()

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-semibold tracking-tight">Electron AI Chat</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            qwen3.5-35b-a3b
          </span>
        </div>
        <button
          onClick={clearMessages}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1 rounded-lg hover:bg-gray-800"
        >
          清空对话
        </button>
      </header>
      <MessageList />
      <InputBar />
    </div>
  )
}
