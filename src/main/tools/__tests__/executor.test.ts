// @vitest-environment node
/**
 * executor 单测
 * 测试重点：未知工具错误、正常路由、运行时异常捕获
 */
import { describe, it, expect, vi, afterEach } from 'vitest'

import { executeTool } from '../executor'
import { TOOL_REGISTRY } from '../registry'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('executeTool', () => {
  describe('未知工具', () => {
    it('返回包含工具名的错误字符串', () => {
      const result = executeTool('nonexistent_tool', {})
      expect(result).toContain('错误')
      expect(result).toContain('nonexistent_tool')
    })

    it('不抛出异常', () => {
      expect(() => executeTool('no_such_tool', {})).not.toThrow()
    })
  })

  describe('正常路由', () => {
    it('dispatch 到 calculate 并返回计算结果', () => {
      const result = executeTool('calculate', { expression: '6*7' })
      expect(result).toBe('42')
    })

    it('参数原样传递给 handler', () => {
      const spy = vi.spyOn(TOOL_REGISTRY['calculate'], 'execute')
      executeTool('calculate', { expression: '1+1' })
      expect(spy).toHaveBeenCalledWith({ expression: '1+1' })
    })
  })

  describe('运行时异常捕获', () => {
    it('handler 抛出 Error 时返回包含 message 的错误字符串', () => {
      vi.spyOn(TOOL_REGISTRY['calculate'], 'execute').mockImplementation(() => {
        throw new Error('内部崩溃')
      })
      const result = executeTool('calculate', { expression: '1+1' })
      expect(result).toContain('错误')
      expect(result).toContain('内部崩溃')
    })

    it('handler 抛出非 Error 值时返回其字符串表示', () => {
      vi.spyOn(TOOL_REGISTRY['get_current_time'], 'execute').mockImplementation(() => {
        throw '非标准异常'
      })
      const result = executeTool('get_current_time', {})
      expect(result).toContain('错误')
      expect(result).toContain('非标准异常')
    })
  })
})
