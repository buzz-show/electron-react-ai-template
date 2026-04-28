import { IpcMainEvent } from 'electron'
import OpenAI from 'openai'
import { CHANNELS } from '@shared/constants/ipc-channels'

import { TOOL_DEFINITIONS, executeTool } from '../tools'

import { getOpenAI } from './client'

type Messages = OpenAI.ChatCompletionMessageParam[]

interface AccumulatedToolCall {
  id: string
  name: string
  argsJson: string
}

/**
 * ReAct 循环 — 纯 AI 逻辑层
 *
 * 职责：发起流式请求、处理 tool_calls 并递归，直到 finish_reason = 'stop'。
 * 通过 event.sender.send 向渲染进程推送进度（chunk / tool-call / tool-result）。
 *
 * 与 ipc/chat.ts 的分工：
 *   loop.ts  = AI 业务逻辑（可单独测试）
 *   chat.ts  = IPC 注册胶水（绑定 ipcMain.on + 调用 loop）
 */
export async function runReActLoop(event: IpcMainEvent, messages: Messages): Promise<void> {
  const client = getOpenAI()

  const stream = await client.chat.completions.create({
    model: 'qwen3.5-35b-a3b',
    messages,
    tools: TOOL_DEFINITIONS,
    tool_choice: 'auto',
    stream: true,
  })

  const toolCallAccumulator = new Map<number, AccumulatedToolCall>()

  for await (const chunk of stream) {
    const choice = chunk.choices[0]
    if (!choice) continue

    // 文字内容：直接推送给渲染进程（打字机效果）
    const textDelta = choice.delta?.content ?? ''
    if (textDelta) event.sender.send(CHANNELS.CHAT_STREAM_CHUNK, textDelta)

    // 工具调用增量：按 index 累积拼接
    for (const toolDelta of choice.delta?.tool_calls ?? []) {
      const idx = toolDelta.index
      if (!toolCallAccumulator.has(idx)) {
        toolCallAccumulator.set(idx, { id: '', name: '', argsJson: '' })
      }
      const acc = toolCallAccumulator.get(idx)!
      if (toolDelta.id) acc.id += toolDelta.id
      if (toolDelta.function?.name) acc.name += toolDelta.function.name
      if (toolDelta.function?.arguments) acc.argsJson += toolDelta.function.arguments
    }

    if (choice.finish_reason === 'tool_calls') {
      const toolCalls = Array.from(toolCallAccumulator.values())

      // 追加 assistant 消息（含 tool_calls）到上下文
      messages.push({
        role: 'assistant',
        content: null,
        tool_calls: toolCalls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.argsJson },
        })),
      })

      // 逐一执行工具，推送通知，追加 tool role 消息
      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.argsJson || '{}')
        } catch {
          /* 保持空对象 */
        }

        event.sender.send(CHANNELS.CHAT_TOOL_CALL, { id: tc.id, name: tc.name, args })
        const result = executeTool(tc.name, args)
        event.sender.send(CHANNELS.CHAT_TOOL_RESULT, { id: tc.id, result })

        messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
      }

      // 递归继续，带入完整上下文
      await runReActLoop(event, messages)
      return
    }
  }
}
