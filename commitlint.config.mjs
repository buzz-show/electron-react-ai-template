// commitlint.config.mjs
export default {
  // 继承 Conventional Commits 标准规范
  extends: ['@commitlint/config-conventional'],

  rules: {
    // ── type 规则 ─────────────────────────────────────────────
    // 在标准类型基础上，追加 AI 项目专属类型
    'type-enum': [
      2, // 2 = error（不符合就报错，阻止提交）
      'always',
      [
        // 标准类型
        'feat',      // 新功能
        'fix',       // Bug 修复
        'docs',      // 文档变更
        'style',     // 格式调整（不影响逻辑，如空格、分号）
        'refactor',  // 重构（非新功能、非修复）
        'test',      // 添加或修改测试
        'chore',     // 构建/工具链/依赖变更
        'perf',      // 性能优化
        'ci',        // CI 配置变更
        'revert',    // 回滚提交
        // AI 项目扩展类型
        'prompt',    // Prompt 内容变更
        'tool',      // Tool 定义或实现变更
        'ai',        // AI 逻辑变更（模型调用、loop 等）
      ],
    ],

    // scope 不强制（可选），但如果写了必须是小写
    'scope-case': [2, 'always', 'lower-case'],

    // subject（描述）不能为空
    'subject-empty': [2, 'never'],

    // subject 不能以句号结尾（"修复了bug." → 不允许）
    'subject-full-stop': [2, 'never', '.'],

    // header 总长度不超过 100 字符
    'header-max-length': [2, 'always', 100],
  },
}
