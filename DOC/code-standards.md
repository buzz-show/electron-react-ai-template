# 项目代码规范体系

> 目标：建立编码规范、提交规范、命名规范三位一体的规范体系，确保代码质量、风格统一、历史可追溯。

---

## 一、ESLint 配置策略

ESLint 负责**代码质量检查**，自动发现潜在问题和不规范写法。

### 规则层级

| 层级 | 包名 | 作用 |
|---|---|---|
| 基础规则 | `eslint:recommended` | 通用 JS 最佳实践 |
| TypeScript | `@typescript-eslint/recommended` | TS 类型安全规则 |
| React | `eslint-plugin-react` | JSX 规范检查 |
| React Hooks | `eslint-plugin-react-hooks` | Hooks 依赖数组等规则 |
| 导入排序 | `eslint-plugin-import` | import 顺序和路径规范 |

### AI 特定规则

- 禁止在代码中硬编码 API Key（自定义规则或 `no-secrets` 插件）
- AI 调用必须有 try/catch 错误处理
- Prompt 模板禁止内联在业务逻辑中，须提取为常量

### import 顺序约定

```
1. Node.js 内置模块（fs、path 等）
2. 第三方库（react、electron、openai 等）
3. 内部别名路径（@/）
4. 相对路径（./、../）
5. 样式文件（.css）
```

---

## 二、Prettier 配置

Prettier 负责**代码格式化**，只管外观，不管逻辑，与 ESLint 分工明确。

### 推荐配置（`.prettierrc`）

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

### 与 ESLint 协作

- 安装 `eslint-config-prettier` 关闭 ESLint 中与格式相关的规则，避免冲突
- Prettier 负责格式，ESLint 负责质量，两者互不干扰

---

## 三、TypeScript 规范

### tsconfig 严格模式

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 类型约定

- 禁止使用 `any`，用 `unknown` 替代，收窄后再使用
- 接口用 `interface`，联合/交叉类型用 `type`
- 组件 Props 必须定义类型，禁止省略
- AI 相关数据结构（Message、ToolCall 等）集中在 `shared/types/` 中定义

---

## 四、命名规范

| 类型 | 规范 | 示例 |
|---|---|---|
| 组件文件 | PascalCase | `ChatPanel.tsx` |
| 普通文件 | kebab-case | `ipc-channels.ts` |
| 组件名 | PascalCase | `MessageItem` |
| 函数/变量 | camelCase | `useStreamChat` |
| 常量 | UPPER_SNAKE_CASE | `IPC_CHANNELS` |
| 类型/接口 | PascalCase | `ChatMessage` |
| CSS 类名 | kebab-case（Tailwind 除外） | `chat-panel` |

### AI 相关命名约定

- Prompt 常量以 `PROMPT_` 前缀命名：`PROMPT_SYSTEM_DEFAULT`
- Tool 定义文件与实现文件同名，放在同一目录：`calculate.ts`
- Hook 以 `use` 开头：`useStreamChat`、`useToolCall`

---

## 五、Commitlint 提交规范

### 格式

```
<type>(<scope>): <description>

[可选 body]

[可选 footer]
```

### 标准类型

| 类型 | 说明 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 格式调整（不影响逻辑） |
| `refactor` | 重构（非新功能非修复） |
| `test` | 添加或修改测试 |
| `chore` | 构建/工具链/依赖变更 |

### AI 项目扩展类型

| 类型 | 说明 |
|---|---|
| `ai` | AI 逻辑变更（模型调用、loop 等） |
| `prompt` | Prompt 内容变更 |
| `tool` | Tool 定义或实现变更 |

### 范围（scope）约定

`chat`、`ai`、`tools`、`ipc`、`ui`、`config`

### 示例

```
feat(chat): 新增流式输出支持
fix(ai): 修复 tool call 循环未终止问题
prompt(chat): 优化系统提示词，增加语气限制
chore(config): 配置 electron-builder 禁用 snap 打包
```

---

## 六、Git Hooks 集成

通过 **husky** 管理 Git Hooks，**lint-staged** 只对暂存区文件执行检查。

### Hook 配置

| Hook | 触发时机 | 执行内容 |
|---|---|---|
| `pre-commit` | `git commit` 前 | ESLint 检查 + Prettier 格式化 |
| `commit-msg` | 提交信息保存后 | commitlint 验证格式 |
| `pre-push` | `git push` 前 | TypeScript 类型检查 + 核心测试 |

### lint-staged 配置示例

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

---

## 七、AI 代码专项规范

### Prompt 管理

- 所有 Prompt 模板集中在 `src/main/ai/prompts/` 目录
- 禁止在业务逻辑中拼接 Prompt 字符串
- 每个 Prompt 文件需注释说明用途、模型、预期输入输出

### Tool 规范

- Tool 的 JSON Schema 定义与 executor 实现分离
- Tool 输入参数必须做类型校验，防止注入
- 每个 Tool 单独一个文件，统一在 `registry.ts` 注册

### 安全规范

- API Key 只存 `.env` 文件，`.env` 必须在 `.gitignore` 中
- 用户输入传给 AI 前须做长度截断（建议最大 4000 字符）
- 敏感配置通过 `process.env` 读取，禁止硬编码

### 错误处理

- 所有 AI 调用必须有 try/catch
- 流式响应中断需有 fallback 提示
- Tool 执行失败须返回结构化错误信息，不能让 AI 死循环

---

## 八、目录结构规范

```
src/
  main/           # 主进程（Node.js 环境）
    ai/
      prompts/    # Prompt 模板（集中管理）
      client.ts   # AI 客户端封装
      loop.ts     # AI 对话循环
    ipc/          # IPC 通信处理
    tools/
      builtin/    # 内置工具实现
      registry.ts # 工具注册表
  preload/        # 预加载脚本
  renderer/       # 渲染进程（React）
    src/
      features/   # 按功能模块组织
      shared/     # 跨功能共享组件
  shared/         # 主进程与渲染进程共享
    types/        # 类型定义
    constants/    # 常量
```

---

## 九、工具链安装命令参考

```bash
# ESLint + TypeScript + React
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import

# Prettier
npm install -D prettier eslint-config-prettier

# Git Hooks
npm install -D husky lint-staged

# Commitlint
npm install -D @commitlint/cli @commitlint/config-conventional

# 初始化 husky
npx husky init
```
