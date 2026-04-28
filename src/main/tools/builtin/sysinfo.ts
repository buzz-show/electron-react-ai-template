import os from 'os'

import type OpenAI from 'openai'

const definition: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_system_info',
    description: '获取当前系统信息：操作系统、CPU 型号、内存使用情况',
    parameters: { type: 'object', properties: {}, required: [] },
  },
}

const execute = (): string =>
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
  )

export default { definition, execute }
