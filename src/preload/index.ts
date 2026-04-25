import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

/**
 * Preload — 安全桥梁
 *
 * contextBridge.exposeInMainWorld 是唯一合法通道：
 * - 对暴露对象做深度克隆和类型校验
 * - renderer 只能调用这里明确暴露的方法
 * - 防止 renderer 通过原型链污染 Node.js 环境
 */
contextBridge.exposeInMainWorld('electronAPI', {
  startStream: (messages: unknown[]): void => {
    ipcRenderer.send('chat:stream:start', messages)
  },

  onChunk: (cb: (delta: string) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, delta: string): void => cb(delta)
    ipcRenderer.on('chat:stream:chunk', handler)
    return () => ipcRenderer.removeListener('chat:stream:chunk', handler)
  },

  onDone: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.once('chat:stream:done', handler)
    return () => ipcRenderer.removeListener('chat:stream:done', handler)
  },

  onError: (cb: (message: string) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, message: string): void => cb(message)
    ipcRenderer.once('chat:stream:error', handler)
    return () => ipcRenderer.removeListener('chat:stream:error', handler)
  }
})
