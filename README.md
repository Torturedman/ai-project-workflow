# AI Project Workflow

AI Project Workflow 是一个本地 AI 软件工厂规划项目。目标是实现 `ai-factory` CLI：用户输入一句 Web 项目需求后，系统先完成需求理解、开源调研、技术路线裁决、架构设计和任务拆分，再调度多个 AI Agent 执行开发、审查、测试、启动和验收。

第一版聚焦通用 Web 项目，包括管理后台、CRM、预约系统、内容社区、电商系统、SaaS 工具、数据看板、文件管理系统和企业内部流程系统。主控系统本身不绑定具体业务技术栈，而是通过 `stack_profile` 选择 Node.js、Python、Java 等工程模板。

## 核心思路

- 决策先于开发：先生成项目理解、调研报告、技术路线和验收标准，再写代码。
- 文件协议驱动协作：Agent 之间不直接聊天，全部通过 `.ai-factory` 状态文件、任务图、报告和日志交接。
- Profile 约束技术栈：每个生成项目必须遵守 `stack_profile` 声明的目录、包管理器、数据库、启动命令和测试命令。
- 自动返工闭环：审查或测试失败后，主控把结构化问题重新投递给对应 Agent。
- 本地可验收：最终必须输出前端地址、后端地址、API 文档地址、启动证据和验收报告。

## 文档入口

- 原始需求：[ai-web-project-workflow-plan.md](ai-web-project-workflow-plan.md)
- 完整开发规划原稿：[ai-web-project-workflow-development-plan.md](ai-web-project-workflow-development-plan.md)
- 拆分后的开发文档索引：[docs/development-plan/README.md](docs/development-plan/README.md)

后续 AI 开发前必须先读取开发文档索引，再按任务类型读取对应约束文档。例如测试相关任务读取 `testing-acceptance.md`，CLI 相关任务读取 `cli-api.md`。

## 当前状态

当前仓库处于规划与文档阶段，尚未开始实现 CLI 代码。下一步应按 [docs/development-plan/implementation-tasks.md](docs/development-plan/implementation-tasks.md) 从工程初始化任务开始开发。
