# Electron + React + OpenAI 流式对话 Demo

---

## 技术选型

| 层次 | 技术 | 理由 |
|------|------|------|
| 构建工具 | electron-vite | 官方推荐，主/preload/渲染三进程开箱即用，HMR 支持 |
| 桌面框架 | Electron 28+ | contextIsolation 默认开启，安全沙箱架构 |
| UI 框架 | React 18 + TypeScript | JD 必须项 |
| 状态管理 | Zustand | 轻量，适合 Demo 快速迭代 |
| 样式 | Tailwind CSS | 无需手写 CSS，快速布局 |
| AI SDK | openai (官方 Node SDK) | 支持 AsyncIterator 流式读取 |
| Markdown 渲染 | react-markdown + remark-gfm | 渲染 LLM 输出的 Markdown |

---

## 项目结构

核心思路：模块化、关注点分离、可维护、易扩展。按照功能域对模块进行划分，而非文件类型（Feature-Sliced Design）划分。

将这个项目分成3层：

1. 主进程：负责AI调用和工具执行，拥有完整的nodejs权限；
2. preload：唯一安全桥梁，用contextBridge精确把控渲染进程可用的接口，避免恶意代码通过污染原型链的方式破坏主进程代码；
3. 渲染进程：只做React UI。

```
electron-ai-demo/
├── src/
│   ├── shared/                        # 跨进程共享（主进程/preload/渲染进程均可引用）
│   │   ├── constants/
│   │   │   └── ipc-channels.ts        # 集中管理 IPC 频道名，消除魔法字符串
│   │   └── types/
│   │       ├── message.ts             # Message、ToolCall 等核心数据类型
│   │       ├── ipc.ts                 # IPC payload 类型
│   │       └── index.ts              # barrel export
│   ├── main/                          # 主进程（Node.js 完整权限）
│   │   ├── index.ts                   # 入口：窗口创建，调用 registerAll()
│   │   ├── ai/
│   │   │   ├── client.ts              # OpenAI 单例（懒加载，读取环境变量）
│   │   │   └── loop.ts                # ReAct 循环（纯业务逻辑，无 IPC 耦合）
│   │   ├── ipc/
│   │   │   ├── index.ts               # IPC 注册聚合器：registerAll()
│   │   │   └── chat.ts                # Chat IPC 处理器（IPC 胶水层）
│   │   └── tools/
│   │       ├── registry.ts            # 工具注册表（单一扩展点）
│   │       ├── executor.ts            # 工具调度器：executeTool(name, args)
│   │       ├── index.ts               # barrel export
│   │       └── builtin/
│   │           ├── time.ts            # 内置工具：获取当前时间
│   │           ├── calculate.ts       # 内置工具：数学计算
│   │           └── sysinfo.ts         # 内置工具：系统信息
│   ├── preload/
│   │   ├── index.ts                   # contextBridge 安全桥梁
│   │   └── index.d.ts                 # ElectronAPI 类型声明
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── App.tsx                # 根组件
│           ├── main.tsx               # 渲染进程入口
│           ├── index.css
│           └── features/
│               └── chat/              # Chat 功能域（Feature-Sliced Design）
│                   ├── components/
│                   │   ├── ChatPanel.tsx
│                   │   ├── MessageList.tsx
│                   │   ├── MessageItem.tsx
│                   │   ├── InputBar.tsx
│                   │   └── ToolCallBubble.tsx
│                   ├── hooks/
│                   │   └── useStreamChat.ts
│                   ├── store/
│                   │   └── chatStore.ts
│                   └── index.ts       # 功能域公共 API（barrel export）
├── electron.vite.config.ts
├── package.json
└── tsconfig.json
```

---

## Day 1：项目初始化 + Electron IPC 架构

### 初始化命令

```bash
npm create @quick-start/electron electron-ai-demo -- --template react-ts
cd electron-ai-demo
npm install
npm install openai zustand react-markdown remark-gfm
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 核心架构（面试必讲）

```
Main Process (Node.js)
  └── ipcMain.on('chat:stream:start')
      → 调用 OpenAI API（API Key 安全存储于环境变量）
      → event.sender.send('chat:stream:chunk', delta)
           ↓ IPC 安全通道
Preload Script (contextBridge)
  exposeInMainWorld('electronAPI', { startStream, onChunk, onDone, onError })
           ↓ window.electronAPI
Renderer Process (React)
  useStreamChat() hook 订阅 chunk → 更新 Zustand state → 触发重渲染
```

### 关键知识点（面试素材）

- **为什么 API Key 放主进程？** renderer 是 Chromium，DevTools 可读内存，主进程读环境变量更安全
- **contextIsolation 的作用？** 隔离 renderer JS 上下文与 Node.js 环境，防止原型链污染攻击
- **preload 的职责？** 唯一合法桥梁，contextBridge 精确控制暴露的 API，做深度克隆和类型校验

### 当天产出 Checklist

- [ ] 项目启动正常（`npm run dev`）
- [ ] ipcMain ↔ ipcRenderer ping/pong 跑通
- [ ] 三层架构代码可讲解

---

## Day 2：流式对话核心实现

### 主进程流式处理（src/main/ipc.ts）

```typescript
import { ipcMain } from 'electron'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export function registerIpcHandlers() {
  ipcMain.on('chat:stream:start', async (event, messages: OpenAI.ChatCompletionMessageParam[]) => {
    try {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        stream: true,
      })
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (delta) event.sender.send('chat:stream:chunk', delta)
      }
      event.sender.send('chat:stream:done')
    } catch (err) {
      event.sender.send('chat:stream:error', (err as Error).message)
    }
  })
}
```

> 关键点：`ipcMain.handle` 只能返回一次值，不适合流式。用 `ipcMain.on` + `event.sender.send` 逐 chunk 推送。

### Preload 桥接（src/preload/index.ts）

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  startStream: (messages: unknown[]) =>
    ipcRenderer.send('chat:stream:start', messages),
  onChunk: (cb: (delta: string) => void) => {
    const handler = (_: unknown, delta: string) => cb(delta)
    ipcRenderer.on('chat:stream:chunk', handler)
    return () => ipcRenderer.removeListener('chat:stream:chunk', handler)
  },
  onDone: (cb: () => void) => {
    const handler = () => cb()
    ipcRenderer.once('chat:stream:done', handler)
    return () => ipcRenderer.removeListener('chat:stream:done', handler)
  },
  onError: (cb: (msg: string) => void) => {
    const handler = (_: unknown, msg: string) => cb(msg)
    ipcRenderer.once('chat:stream:error', handler)
    return () => ipcRenderer.removeListener('chat:stream:error', handler)
  },
})
```

### 核心 Hook（src/renderer/src/hooks/useStreamChat.ts）

```typescript
import { useState, useCallback, useRef } from 'react'
import { useChatStore } from '../store/chatStore'

export function useStreamChat() {
  const [streaming, setStreaming] = useState(false)
  const { addMessage, updateLastAssistantMessage, messages } = useChatStore()
  const cleanupRef = useRef<(() => void)[]>([])

  const sendMessage = useCallback((userInput: string) => {
    addMessage({ role: 'user', content: userInput })
    addMessage({ role: 'assistant', content: '' })
    setStreaming(true)

    const offChunk = window.electronAPI.onChunk((delta) => {
      updateLastAssistantMessage(delta)
    })
    const offDone = window.electronAPI.onDone(() => {
      setStreaming(false)
      cleanupRef.current.forEach(fn => fn())
    })
    const offError = window.electronAPI.onError((msg) => {
      console.error('Stream error:', msg)
      setStreaming(false)
    })

    cleanupRef.current = [offChunk, offDone, offError]

    window.electronAPI.startStream([
      { role: 'system', content: 'You are a helpful assistant.' },
      ...messages,
      { role: 'user', content: userInput },
    ])
  }, [messages, addMessage, updateLastAssistantMessage])

  return { sendMessage, streaming }
}
```

### Zustand Store（src/renderer/src/store/chatStore.ts）

```typescript
import { create } from 'zustand'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatStore {
  messages: Message[]
  addMessage: (msg: Message) => void
  updateLastAssistantMessage: (delta: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  updateLastAssistantMessage: (delta) =>
    set((state) => {
      const msgs = [...state.messages]
      const last = msgs[msgs.length - 1]
      if (last?.role === 'assistant') {
        msgs[msgs.length - 1] = { ...last, content: last.content + delta }
      }
      return { messages: msgs }
    }),
  clearMessages: () => set({ messages: [] }),
}))
```

### 当天产出 Checklist

- [ ] 流式对话完整跑通
- [ ] 打字机效果正常
- [ ] Markdown 实时渲染（代码块、列表等）
- [ ] 多轮上下文正确传递
- [ ] 事件监听器正确清理（无内存泄漏）

---

## Day 3：亮点功能 + 面试话术准备

### 加分项优先级

| 优先级 | 功能 | 预估时间 | 对应 JD 关键词 |
|--------|------|---------|--------------|
| P0 | Tool Use（时间/计算工具） | 2h | "Tool Use 等创新交互功能" |
| P1 | System Prompt 编辑器 | 1h | Generative UI 理解 |
| P1 | 对话导出为本地 Markdown 文件 | 1h | Electron 文件系统能力 |
| P2 | 自动更新 stub（electron-updater） | 2h | JD 明确提到"自动更新" |

### Tool Use 核心实现

```typescript
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: '获取当前系统时间',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
]

function executeTool(name: string, args: Record<string, unknown>): string {
  if (name === 'get_current_time') return new Date().toLocaleString('zh-CN')
  return '未知工具'
}
```

---

## 面试高频问题 & 标准答案

### Q1：为什么在主进程而不是渲染进程调用 OpenAI API？

安全性是核心原因。renderer 是 Chromium 进程，用户可以通过 DevTools 检查内存，API Key 放在渲染进程等于明文暴露。主进程是 Node.js 环境，可以读取环境变量或加密存储，不会被前端工具访问到。另外主进程有完整的 Node.js 能力，直接使用 openai Node SDK，不需要考虑浏览器兼容性。

### Q2：流式响应怎么从主进程传到 React 组件？

`ipcMain.handle` 只能返回一个 Promise，不适合流式场景。正确做法是用 `ipcMain.on` 接收启动信号，然后用 `event.sender.send` 主动向渲染进程推送每个 chunk。渲染进程通过 preload 暴露的 `onChunk` 监听器接收，每次收到 delta 就调用 Zustand 的 `updateLastAssistantMessage` 更新 state，触发 React 重渲染，形成打字机效果。注意会话结束时要移除监听器，避免内存泄漏。

### Q3：contextBridge 的作用是什么？

Electron 开启 `contextIsolation` 后，渲染进程的 JS 环境与 Node.js 环境完全隔离，渲染进程无法直接访问 `require`、`process` 等 Node API。`contextBridge.exposeInMainWorld` 是唯一合法的通道，它把允许暴露的 API 注入到渲染进程的 `window` 对象上，并做了深度克隆和类型校验，防止渲染进程通过原型链污染攻击 Node.js 环境。

### Q4：如果做生产级 Electron 应用你会额外考虑什么？

- **自动更新**：`electron-updater` 对接 GitHub Releases 或私有服务器
- **崩溃恢复**：监听 `app.on('render-process-gone')` 自动重启渲染进程
- **内存优化**：避免在主进程维护大型对象，渲染进程用 `requestIdleCallback` 做非关键渲染
- **安全加固**：CSP 头部配置、禁用 `nodeIntegration`、`webSecurity` 不关闭
- **离线能力**：Service Worker 缓存静态资源，主进程检测网络状态切换降级模式

### Q5：说说你对 AI Agent 编排的理解？

Agent 编排的本质是让 LLM 具备"规划-执行-观察"循环（ReAct 模式）：
1. LLM 输出工具调用意图（Function Calling）
2. 宿主程序执行对应工具（文件读写、API 调用、代码执行等）
3. 把工具结果作为 `tool` 角色消息追加到上下文
4. 再次调用 LLM，直到 LLM 不再需要工具调用，直接给出最终回答

Electron 做 Agent 有天然优势：主进程有完整系统权限，可执行文件操作、启动子进程、访问本地数据库，这些在纯 Web 环境中是做不到的。

---

## 面试现场代码展示顺序

1. **IPC 架构图**（白板手绘）→ 说明三层分离原因和安全边界
2. `src/main/ipc.ts` → 展示 `for await` 流式循环 + `event.sender.send`
3. `src/preload/index.ts` → 展示 `contextBridge` 暴露 API 及清理函数
4. `src/renderer/hooks/useStreamChat.ts` → 展示 React hook 订阅模式 + Zustand 状态更新
5. Tool Use 实现 → 展示 function calling JSON schema 定义 + ReAct 循环

---

## 参考资料

- [electron-vite 官方文档](https://electron-vite.org/)
- [Electron 安全最佳实践](https://www.electronjs.org/docs/latest/tutorial/security)
- [OpenAI Streaming API](https://platform.openai.com/docs/api-reference/streaming)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [Zustand 文档](https://zustand-demo.pmnd.rs/)
