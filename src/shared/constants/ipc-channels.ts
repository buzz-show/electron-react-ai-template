/**
 * IPC Channel 常量 — 唯一权威来源
 *
 * 主进程、Preload、渲染进程统一引用此处，消灭魔法字符串。
 * 修改 channel 名称只需改这一个文件。
 */
export const CHANNELS = {
  CHAT_STREAM_START: 'chat:stream:start',
  CHAT_STREAM_CHUNK: 'chat:stream:chunk',
  CHAT_STREAM_DONE: 'chat:stream:done',
  CHAT_STREAM_ERROR: 'chat:stream:error',
  CHAT_TOOL_CALL: 'chat:stream:tool-call',
  CHAT_TOOL_RESULT: 'chat:stream:tool-result',
} as const

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS]
