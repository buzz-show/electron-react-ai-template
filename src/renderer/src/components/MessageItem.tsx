import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '../types'

interface Props {
  message: Message
}

export default function MessageItem({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mb-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              pre({ children }) {
                return (
                  <pre className="bg-gray-950 rounded-lg p-3 overflow-x-auto my-2 text-xs font-mono">
                    {children}
                  </pre>
                )
              },
              code({ className, children }) {
                return (
                  <code className={`bg-gray-950 px-1.5 py-0.5 rounded text-xs font-mono ${className ?? ''}`}>
                    {children}
                  </code>
                )
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>
              },
              ul({ children }) {
                return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
              },
              a({ href, children }) {
                return (
                  <a href={href} className="text-indigo-400 underline"
                    onClick={(e) => e.preventDefault()}>
                    {children}
                  </a>
                )
              }
            }}
          >
            {message.content || '\u25ae'}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
