import { ipcMain, IpcMainEvent } from 'electron'
import OpenAI from 'openai'
import { CHANNELS } from '@shared/constants/ipc-channels'

import { runReActLoop } from '../ai/loop'

type Messages = OpenAI.ChatCompletionMessageParam[]

/**
 * Chat 功能域的 IPC 处理器
 *
 * 职责：绑定 ipcMain 事件，调用 AI 层，处理顶层异常。
 * 业务逻辑（ReAct 循环）委托给 ai/loop.ts，不在此处实现。
 *
 * 为什么用 ipcMain.on 而不是 ipcMain.handle？
 *   handle 只能 resolve 一次，不适合流式推送。
 *   on + event.sender.send 可以主动推送任意次。
 */
export function registerChatHandlers(): void {
  ipcMain.on(CHANNELS.CHAT_STREAM_START, async (event: IpcMainEvent, messages: Messages) => {
    try {
      await runReActLoop(event, messages)
      event.sender.send(CHANNELS.CHAT_STREAM_DONE)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      event.sender.send(CHANNELS.CHAT_STREAM_ERROR, message)
    }
  })
}
