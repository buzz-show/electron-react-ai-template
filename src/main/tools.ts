import os from 'os'
import OpenAI from 'openai'

/**
 * Tool Registry — 工具注册表
 *
 * 扩展方式：在 TOOL_REGISTRY 中追加一条新记录即可。
 * 无需修改 ipc.ts 或其他任何文件。
 *
 * execute() 的返回值会作为 tool role 消息的 content 发回给 LLM。
 */

interface ToolHandler {
  definition: OpenAI.ChatCompletionTool
  execute(args: Record<string, unknown>): string
}

// 白名单正则：只允许数字、基本运算符、小数点、空格、括号
const SAFE_EXPR_RE = /^[\d+\-*/().\s]+$/

const TOOL_REGISTRY: Record<string, ToolHandler> = {
  get_current_time: {
    definition: {
      type: 'function',
      function: {
        name: 'get_current_time',
        description: '获取当前系统时间，返回本地格式化字符串',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    },
    execute: () => new Date().toLocaleString('zh-CN'),
  },

  calculate: {
    definition: {
      type: 'function',
      function: {
        name: 'calculate',
        description: '对数学表达式求值，支持加减乘除和括号，例如 "(3+5)*2"',
        parameters: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: '只包含数字和 + - * / ( ) . 的数学表达式',
            },
          },
          required: ['expression'],
        },
      },
    },
    execute: ({ expression }) => {
      const expr = String(expression)
      if (!SAFE_EXPR_RE.test(expr)) {
        return '错误：表达式包含不允许的字符，只支持数字和 + - * / ( ) .'
      }
      try {
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${expr})`)()
        return String(result)
      } catch {
        return '错误：表达式求值失败，请检查语法'
      }
    },
  },

  get_system_info: {
    definition: {
      type: 'function',
      function: {
        name: 'get_system_info',
        description: '获取当前系统信息：操作系统、CPU 型号、内存使用情况',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    },
    execute: () =>
      JSON.stringify(
        {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release(),
          cpuModel: os.cpus()[0]?.model ?? 'unknown',
          cpuCount: os.cpus().length,
          totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
          freeMemMB: Math.round(os.freemem() / 1024 / 1024),
          hostname: os.hostname(),
        },
        null,
        2
      ),
  },
}

/** 所有工具的 OpenAI schema 定义，传给 chat.completions.create */
export const TOOL_DEFINITIONS: OpenAI.ChatCompletionTool[] = Object.values(TOOL_REGISTRY).map(
  (h) => h.definition
)

/**
 * 执行工具，捕获所有运行时异常并返回错误字符串（而不是抛出）。
 * 返回值直接作为 tool role 消息的 content。
 */
export function executeTool(name: string, args: Record<string, unknown>): string {
  const handler = TOOL_REGISTRY[name]
  if (!handler) return `错误：未知工具 "${name}"`
  try {
    return handler.execute(args)
  } catch (err) {
    return `错误：工具执行失败 — ${err instanceof Error ? err.message : String(err)}`
  }
}
