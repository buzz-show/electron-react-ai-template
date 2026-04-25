// 为渲染进程提供 window.electronAPI 的 TypeScript 类型
// 此文件被 tsconfig.web.json 包含

export interface ElectronAPI {
  startStream: (messages: unknown[]) => void
  onChunk: (cb: (delta: string) => void) => () => void
  onDone: (cb: () => void) => () => void
  onError: (cb: (message: string) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
