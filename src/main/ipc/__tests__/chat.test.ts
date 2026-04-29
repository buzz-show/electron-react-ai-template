// @vitest-environment node
/**
 * ipc/chat 单测
 * 测试重点：
 *   1. 调用 ipcMain.on 注册了正确的 channel
 *   2. loop 成功时推送 CHAT_STREAM_DONE
 *   3. loop 抛出 Error 时推送 CHAT_STREAM_ERROR + message
 *   4. loop 抛出非 Error 值时推送 CHAT_STREAM_ERROR + string 表示
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CHANNELS } from '@shared/constants/ipc-channels'

// mock electron
vi.mock('electron', () => ({
  ipcMain: {
    on: vi.fn(),
  },
}))

// mock AI loop
vi.mock('../../ai/loop', () => ({
  runReActLoop: vi.fn(),
}))

import { ipcMain } from 'electron'

import { registerChatHandlers } from '../chat'
import { runReActLoop } from '../../ai/loop'

// 辅助：注册 handler 后取出回调函数
function getRegisteredHandler() {
  const mockOn = vi.mocked(ipcMain.on)
  const call = mockOn.mock.calls.find(([ch]) => ch === CHANNELS.CHAT_STREAM_START)
  if (!call) throw new Error('CHAT_STREAM_START handler not registered')
  return call[1] as (event: unknown, messages: unknown[]) => Promise<void>
}

// 模拟 IpcMainEvent
function makeMockEvent() {
  return {
    sender: { send: vi.fn() },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerChatHandlers', () => {
  it('在 CHAT_STREAM_START channel 上注册监听器', () => {
    registerChatHandlers()
    expect(vi.mocked(ipcMain.on)).toHaveBeenCalledWith(
      CHANNELS.CHAT_STREAM_START,
      expect.any(Function)
    )
  })
})

describe('CHAT_STREAM_START handler', () => {
  beforeEach(() => {
    registerChatHandlers()
  })

  it('loop 成功时发送 CHAT_STREAM_DONE', async () => {
    vi.mocked(runReActLoop).mockResolvedValue(undefined)
    const event = makeMockEvent()
    const handler = getRegisteredHandler()

    await handler(event, [{ role: 'user', content: 'hi' }])

    expect(event.sender.send).toHaveBeenCalledWith(CHANNELS.CHAT_STREAM_DONE)
    expect(event.sender.send).not.toHaveBeenCalledWith(
      CHANNELS.CHAT_STREAM_ERROR,
      expect.anything()
    )
  })

  it('loop 抛出 Error 时发送 CHAT_STREAM_ERROR + error.message', async () => {
    vi.mocked(runReActLoop).mockRejectedValue(new Error('网络超时'))
    const event = makeMockEvent()
    const handler = getRegisteredHandler()

    await handler(event, [])

    expect(event.sender.send).toHaveBeenCalledWith(CHANNELS.CHAT_STREAM_ERROR, '网络超时')
    expect(event.sender.send).not.toHaveBeenCalledWith(CHANNELS.CHAT_STREAM_DONE)
  })

  it('loop 抛出非 Error 值时发送 CHAT_STREAM_ERROR + 字符串化内容', async () => {
    vi.mocked(runReActLoop).mockRejectedValue('连接被拒绝')
    const event = makeMockEvent()
    const handler = getRegisteredHandler()

    await handler(event, [])

    expect(event.sender.send).toHaveBeenCalledWith(CHANNELS.CHAT_STREAM_ERROR, '连接被拒绝')
  })

  it('handler 本身不向上抛出异常', async () => {
    vi.mocked(runReActLoop).mockRejectedValue(new Error('崩溃'))
    const event = makeMockEvent()
    const handler = getRegisteredHandler()

    await expect(handler(event, [])).resolves.not.toThrow()
  })
})
