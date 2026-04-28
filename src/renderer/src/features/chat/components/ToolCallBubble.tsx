import { useState } from 'react'
import { ToolCall } from '@shared/types'

interface Props {
  toolCalls: ToolCall[]
}

const TOOL_ICONS: Record<string, string> = {
  get_current_time: '🕐',
  calculate: '🧮',
  get_system_info: '💻',
}

function ToolCallCard({ tc }: { tc: ToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const icon = TOOL_ICONS[tc.name] ?? '🔧'
  const isLoading = tc.result === undefined

  return (
    <div className="rounded-lg border border-amber-800/40 bg-amber-950/30 text-xs overflow-hidden">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-amber-900/20 transition-colors"
      >
        <span>{icon}</span>
        <span className="font-mono text-amber-300 font-medium">{tc.name}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {isLoading ? (
            <span className="inline-block w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="text-emerald-400">✓</span>
          )}
          <span className="text-gray-500">{expanded ? '▲' : '▼'}</span>
        </span>
      </button>

      {expanded && (
        <div className="border-t border-amber-800/30 divide-y divide-amber-800/20">
          <div className="px-3 py-2">
            <div className="text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Args</div>
            <pre className="text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {Object.keys(tc.args).length === 0 ? '{}' : JSON.stringify(tc.args, null, 2)}
            </pre>
          </div>
          <div className="px-3 py-2">
            <div className="text-gray-500 mb-1 uppercase tracking-wider text-[10px]">Result</div>
            {isLoading ? (
              <span className="text-gray-500 italic">Running…</span>
            ) : (
              <pre className="text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {tc.result}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ToolCallBubble({ toolCalls }: Props) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {toolCalls.map(tc => (
        <ToolCallCard key={tc.id} tc={tc} />
      ))}
    </div>
  )
}
