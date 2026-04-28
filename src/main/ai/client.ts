import OpenAI from 'openai'

/**
 * OpenAI 客户端懒加载单例
 *
 * 首次调用时读取环境变量，确保 dotenv 已在 index.ts 中加载完毕。
 * 支持 OPENAI_API_BASE_URL 覆盖（兼容私有部署、国内镜像）。
 */
let client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env['OPENAI_API_KEY']
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY 未设置。请将 .env.example 复制为 .env 并填入你的 API Key。')
    }
    const baseURL = process.env['OPENAI_API_BASE_URL']
    if (baseURL) console.log('Using custom OpenAI base URL:', baseURL)
    client = new OpenAI({ apiKey, baseURL })
  }
  return client
}
