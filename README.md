# Electron React AI Template

基于 **Electron + React + OpenAI** 的桌面端流式 AI 对话应用模板，内置 ReAct 循环与工具调用能力，开箱即用的代码规范与 CI/CD 体系。

---

## 技术栈

| 层次          | 技术                                        |
| ------------- | ------------------------------------------- |
| 构建工具      | [electron-vite](https://electron-vite.org/) |
| 桌面框架      | Electron 28+                                |
| UI 框架       | React 18 + TypeScript                       |
| 状态管理      | Zustand                                     |
| 样式          | Tailwind CSS                                |
| AI SDK        | openai (官方 Node SDK，流式输出)            |
| Markdown 渲染 | react-markdown + remark-gfm                 |
| 测试          | Vitest + Testing Library                    |

---

## 功能特性

- **流式对话**：基于 OpenAI Streaming API，逐 token 实时输出
- **ReAct 循环**：AI 可自主决策调用工具，获取结果后继续推理
- **内置工具**：
  - `calculate` — 安全数学表达式求值
  - `get_current_time` — 获取当前时间
  - `get_system_info` — 获取系统信息
- **工具可扩展**：在 `src/main/tools/builtin/` 下新增文件并注册即可
- **安全架构**：主进程 / Preload(contextBridge) / 渲染进程三层隔离，渲染层无 Node.js 权限

---

## 项目结构

```
src/
├── main/                  # 主进程（Node.js 完整权限）
│   ├── index.ts           # 窗口创建 & IPC 注册
│   ├── ai/
│   │   ├── client.ts      # OpenAI 单例（懒加载）
│   │   └── loop.ts        # ReAct 循环核心逻辑
│   ├── ipc/
│   │   ├── index.ts       # IPC 注册聚合器
│   │   └── chat.ts        # Chat IPC 处理器
│   └── tools/
│       ├── registry.ts    # 工具注册表
│       ├── executor.ts    # 工具调度器
│       └── builtin/       # 内置工具实现
├── preload/               # 安全桥梁（contextBridge）
│   └── index.ts
├── renderer/              # 渲染进程（React UI）
│   └── src/
│       └── features/chat/ # 聊天功能模块
└── shared/                # 跨进程共享类型与常量
    ├── constants/
    └── types/
```

---

## 快速开始

### 前置要求

- Node.js >= 18
- OpenAI API Key

### 安装依赖

```bash
npm install
```

### 配置环境变量

在项目根目录创建 `.env` 文件：

```env
OPENAI_API_KEY=your_openai_api_key_here
# 可选，默认使用 gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 打包为可执行文件

```bash
npm run package
```

---

## 可用脚本

| 命令                    | 说明                |
| ----------------------- | ------------------- |
| `npm run dev`           | 启动开发模式（HMR） |
| `npm run build`         | 构建生产产物        |
| `npm run package`       | 打包为平台安装包    |
| `npm run lint`          | ESLint 检查         |
| `npm run lint:fix`      | ESLint 自动修复     |
| `npm run format`        | Prettier 格式化     |
| `npm run test`          | 运行单元测试        |
| `npm run test:coverage` | 生成测试覆盖率报告  |

---

## 扩展工具

在 `src/main/tools/builtin/` 下新建工具文件，参考 `calculate.ts` 实现 `definition`（OpenAI function schema）和 `execute` 函数，然后在 `src/main/tools/registry.ts` 中注册即可。

---

## 代码规范

- **ESLint** + **Prettier** 保证代码质量与风格一致
- **commitlint** 强制 [Conventional Commits](https://www.conventionalcommits.org/) 提交规范
- **lint-staged** + **husky** 在 `git commit` 前自动检查
- **gitleaks** 防止 API Key 等密钥泄漏

---

## License

MIT
