import type OpenAI from 'openai'

const definition: OpenAI.ChatCompletionTool = {
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
}

// 白名单正则：只允许数字、基本运算符、小数点、空格、括号
const SAFE_EXPR_RE = /^[\d+\-*/().\s]+$/

const execute = ({ expression }: Record<string, unknown>): string => {
  const expr = String(expression)
  if (!SAFE_EXPR_RE.test(expr)) {
    return '错误：表达式包含不允许的字符，只支持数字和 + - * / ( ) .'
  }
  try {
     
    const result = new Function(`"use strict"; return (${expr})`)()
    return String(result)
  } catch {
    return '错误：表达式求值失败，请检查语法'
  }
}

export default { definition, execute }
