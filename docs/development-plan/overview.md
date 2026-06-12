# 总览约束

## 1. 目标

实现本地 CLI 编排器 `ai-factory`。用户输入一句 Web 项目需求后，系统自动生成项目理解、开源调研、技术路线裁决、架构设计、任务 DAG，并调度多个 Agent 完成开发、审查、测试、启动和验收。

## 2. 架构选择

- 主控语言：TypeScript / Node.js 20 LTS。
- CLI 框架：Commander。
- 类型校验：Zod。
- 子进程执行：Execa。
- 日志：Pino JSONL。
- 测试：Vitest + Playwright。
- 全局索引：SQLite。
- MVP 默认 Profile：`node-next`。

## 3. 必须实现

- 本地 CLI：`create`、`plan`、`run`、`resume`、`status`、`logs`、`doctor`、`profiles`。
- `.ai-factory` 文件协议。
- 技术栈 Profile 选择、校验和模板命令约束。
- Agent Runner 统一接口，MVP 内置 `mock` 与 `codex-cli`。
- Intake、Planner、Research、Judge、Architect、Task Graph 阶段编排。
- DAG 并行执行、审查返工、测试回流、blocked 报告。
- lint/test/build/e2e/start 验证链路。
- SQLite 全局索引、JSONL 日志、日志脱敏。

## 4. 不在 MVP 范围

- Web 控制台。
- Kubernetes 部署。
- 生产级权限系统。
- 多租户平台。
- 远程任务队列。
- 复杂支付、短信、消息队列、分布式事务。
- 任意语言任意框架的无限制生成。

## 5. 关键原则

- 决策先于开发。
- 能复用就复用，不能复用再从固定模板构建。
- Agent 短生命周期，Orchestrator 长期运行。
- Agent 之间不直接通信，所有交接通过文件、状态、报告和 workspace。
- 用户确认计划后默认自动执行，除 `blocked` 外不再询问。

