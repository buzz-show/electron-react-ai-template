import { ipcMain, IpcMainEvent } from 'electron'
import OpenAI from 'openai'

type Messages = OpenAI.ChatCompletionMessageParam[]

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
    openai = new OpenAI({ apiKey, baseURL: process.env['OPENAI_API_BASE_URL'] }) // 可选：支持自定义 API 服务器地址
  }
  return openai
}

export function registerIpcHandlers(): void {
  /**
   * 核心流式 IPC 处理器
   *
   * 为什么用 ipcMain.on 而不是 ipcMain.handle？
   *   handle 只能返回一次 Promise，无法多次推送 chunk。
   *   on + event.sender.send 可以主动向渲染进程推送任意次数。
   */
  ipcMain.on('chat:stream:start', async (event: IpcMainEvent, messages: Messages) => {
    try {
      const client = getOpenAI()
      const stream = await client.chat.completions.create({
        model: 'qwen3.5-35b-a3b',
        messages,
        stream: true
      })

      for await (const chunk of stream) {
        console.log('Received chunk:', chunk)
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (delta) event.sender.send('chat:stream:chunk', delta)
      }


      event.sender.send('chat:stream:done')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      event.sender.send('chat:stream:error', message)
    }
  })
}
