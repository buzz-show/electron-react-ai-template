// @vitest-environment node
/**
 * registry 单测
 * 测试重点：注册表结构完整性 + TOOL_DEFINITIONS 与 TOOL_REGISTRY 一致性
 */
import { describe, it, expect } from 'vitest'

import { TOOL_REGISTRY, TOOL_DEFINITIONS } from '../registry'

const EXPECTED_TOOLS = ['get_current_time', 'calculate', 'get_system_info']

describe('TOOL_REGISTRY', () => {
  it('包含全部预期工具键', () => {
    expect(Object.keys(TOOL_REGISTRY).sort()).toEqual(EXPECTED_TOOLS.sort())
  })

  it.each(EXPECTED_TOOLS)('%s 拥有 definition 和 execute', name => {
    const handler = TOOL_REGISTRY[name]
    expect(handler).toBeDefined()
    expect(typeof handler.definition).toBe('object')
    expect(typeof handler.execute).toBe('function')
  })

  it.each(EXPECTED_TOOLS)('%s 的 definition.type 为 "function"', name => {
    expect(TOOL_REGISTRY[name].definition.type).toBe('function')
  })

  it.each(EXPECTED_TOOLS)('%s 的 definition.function.name 与注册键一致', name => {
    expect(TOOL_REGISTRY[name].definition.function.name).toBe(name)
  })
})

describe('TOOL_DEFINITIONS', () => {
  it('长度与 TOOL_REGISTRY 条目数相同', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(Object.keys(TOOL_REGISTRY).length)
  })

  it('每个 definition 都能在 TOOL_REGISTRY 中找到对应 handler', () => {
    for (const def of TOOL_DEFINITIONS) {
      expect(TOOL_REGISTRY[def.function.name]).toBeDefined()
    }
  })
})
