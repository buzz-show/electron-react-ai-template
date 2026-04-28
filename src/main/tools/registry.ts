import OpenAI from 'openai'

import time from './builtin/time'
import calculate from './builtin/calculate'
import sysinfo from './builtin/sysinfo'

/**
 * 工具处理器接口
 *
 * 扩展工具：在 TOOL_REGISTRY 追加一条记录 + 在 builtin/ 新建对应文件。
 * 无需修改 executor.ts、ipc/ 或渲染进程任何文件。
 */
export interface ToolHandler {
  definition: OpenAI.ChatCompletionTool
  execute(args: Record<string, unknown>): string
}

export const TOOL_REGISTRY: Record<string, ToolHandler> = {
  get_current_time: time,
  calculate,
  get_system_info: sysinfo,
}

/** 传给 OpenAI chat.completions.create 的 tools 参数 */
export const TOOL_DEFINITIONS: OpenAI.ChatCompletionTool[] = Object.values(TOOL_REGISTRY).map(
  h => h.definition
)
