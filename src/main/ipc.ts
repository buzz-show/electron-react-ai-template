import { ipcMain, IpcMainEvent } from 'electron'
import OpenAI from 'openai'
import { TOOL_DEFINITIONS, executeTool } from './tools'

type Messages = OpenAI.ChatCompletionMessageParam[]

// 工具调用累积器的单条记录
interface AccumulatedToolCall {
  id: string
  name: string
  argsJson: string
}

// 懒加载 OpenAI 实例，确保 dotenv 已加载后再读取 API Key
let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY 未设置。请将 .env.example 复制为 .env 并填入你的 API Key。'
      )
    }
    if (process.env['OPENAI_API_BASE_URL']) {
      console.log('Using custom OpenAI API base URL:', process.env['OPENAI_API_BASE_URL'])
    }
    openai = new OpenAI({ apiKey, baseURL: process.env['OPENAI_API_BASE_URL'] })
  }
  return openai
}

/**
 * ReAct 循环：发起一轮流式请求，处理 tool_calls 并递归继续，直到 stop。
 *
 * 为什么用 ipcMain.on 而不是 ipcMain.handle？
 *   handle 只能返回一次 Promise，无法多次推送 chunk。
 *   on + event.sender.send 可以主动向渲染进程推送任意次数。
 */
async function runReActLoop(event: IpcMainEvent, messages: Messages): Promise<void> {
  const client = getOpenAI()

  const stream = await client.chat.completions.create({
    model: 'qwen3.5-35b-a3b',
    messages,
    tools: TOOL_DEFINITIONS,
    tool_choice: 'auto',
    stream: true,
  })

  // 累积当前轮次的 tool_calls（增量 delta 需要拼接）
  const toolCallAccumulator = new Map<number, AccumulatedToolCall>()

  for await (const chunk of stream) {
    const choice = chunk.choices[0]
    if (!choice) continue

    // 文字内容：直接推送给渲染进程
    const textDelta = choice.delta?.content ?? ''
    if (textDelta) event.sender.send('chat:stream:chunk', textDelta)

    // 工具调用增量：按 index 累积
    const toolDeltaList = choice.delta?.tool_calls ?? []
    for (const toolDelta of toolDeltaList) {
      const idx = toolDelta.index
      if (!toolCallAccumulator.has(idx)) {
        toolCallAccumulator.set(idx, { id: '', name: '', argsJson: '' })
      }
      const acc = toolCallAccumulator.get(idx)!
      if (toolDelta.id) acc.id += toolDelta.id
      if (toolDelta.function?.name) acc.name += toolDelta.function.name
      if (toolDelta.function?.arguments) acc.argsJson += toolDelta.function.arguments
    }

    // 本轮结束：处理 tool_calls
    if (choice.finish_reason === 'tool_calls') {
      const toolCalls = Array.from(toolCallAccumulator.values())

      // 构造 assistant 消息（含 tool_calls），追加到上下文
      const assistantMsg: OpenAI.ChatCompletionMessageParam = {
        role: 'assistant',
        content: null,
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.argsJson },
        })),
      }
      messages.push(assistantMsg)

      // 逐一执行工具，并将结果追加到上下文
      for (const tc of toolCalls) {
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(tc.argsJson || '{}')
        } catch {
          // argsJson 解析失败时 args 保持为空对象
        }

        // 通知渲染进程：工具调用开始
        event.sender.send('chat:stream:tool-call', { id: tc.id, name: tc.name, args })

        const result = executeTool(tc.name, args)

        // 通知渲染进程：工具结果
        event.sender.send('chat:stream:tool-result', { id: tc.id, result })

        // 追加 tool role 消息到上下文
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result,
        })
      }

      // 递归继续，带入新的上下文
      await runReActLoop(event, messages)
      return
    }
  }
}

export function registerIpcHandlers(): void {
  ipcMain.on('chat:stream:start', async (event: IpcMainEvent, messages: Messages) => {
    try {
      await runReActLoop(event, messages)
      event.sender.send('chat:stream:done')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      event.sender.send('chat:stream:error', message)
    }
  })
}
