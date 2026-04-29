// @vitest-environment node
/**
 * ipc/index 单测
 * 测试重点：registerAll 统一入口调用了每个功能域的注册函数
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 先 mock chat 模块，再 import registerAll，确保拦截生效
vi.mock('../chat', () => ({
  registerChatHandlers: vi.fn(),
}))

import { registerAll } from '../index'
import { registerChatHandlers } from '../chat'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('registerAll', () => {
  it('调用 registerChatHandlers', () => {
    registerAll()
    expect(registerChatHandlers).toHaveBeenCalledTimes(1)
  })

  it('重复调用不抛出异常', () => {
    expect(() => {
      registerAll()
      registerAll()
    }).not.toThrow()
  })
})
