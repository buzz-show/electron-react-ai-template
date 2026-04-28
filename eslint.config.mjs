import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'

/** @type {import('eslint').Linter.Config[]} */
export default [
  // ── 全局忽略 ──────────────────────────────────────────────
  // .d.ts 是类型声明文件，只给编译器看的，不需要 lint
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**', '**/*.d.ts'],
  },

  // ── 基础层：覆盖所有 TS/TSX 文件（语法解析 + 通用规则）──
  // src/shared/ 等共享目录也会被这条规则覆盖
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
    },
    rules: {
      // TypeScript 推荐规则
      ...tsPlugin.configs['recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'warn',     // any 给警告，不直接报错
      '@typescript-eslint/no-unused-vars': 'error',     // 未使用变量必须清理

      // import 顺序：builtin → external → internal → 相对路径
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
        },
      ],
    },
  },

  // ── 主进程 & 预加载（Node.js 环境）────────────────────────
  // 在基础层之上，补充 Node.js 环境的全局变量
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // 主进程允许使用 console
    },
  },

  // ── 渲染进程（浏览器 + React 环境）────────────────────────
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        KeyboardEvent: 'readonly',
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect', // 自动检测 React 版本，无需手动填写
      },
    },
    rules: {
      // React 推荐规则
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ 不需要手动 import React
      'react/prop-types': 'off',         // 使用 TypeScript 类型替代 PropTypes

      // Hooks 规则（非常重要）
      'react-hooks/rules-of-hooks': 'error',  // Hooks 只能在函数组件顶层调用
      'react-hooks/exhaustive-deps': 'warn',  // useEffect 依赖数组必须完整

      'no-console': 'warn', // 渲染进程 console 给警告提醒
    },
  },
]
