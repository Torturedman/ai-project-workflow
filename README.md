# AI Project Workflow

AI Project Workflow 是一个本地 AI 软件工厂规划项目。目标是实现 `ai-factory` CLI：用户输入一句 Web 项目需求后，系统先完成需求理解、开源调研、技术路线裁决、架构设计和任务拆分，再调度多个 AI Agent 执行开发、审查、测试、启动和验收。

第一版聚焦通用 Web 项目，包括管理后台、CRM、预约系统、内容社区、电商系统、SaaS 工具、数据看板、文件管理系统和企业内部流程系统。主控系统本身不绑定具体业务技术栈，而是通过 `stack_profile` 选择 Node.js、Python、Java 等工程模板。主控运行时目标为 Node.js 24 LTS，具体依赖版本见开发文档中的版本矩阵。

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
- AI 开发行为约束：[docs/development-plan/ai-development-rules.md](docs/development-plan/ai-development-rules.md)
- 依赖版本矩阵：[docs/development-plan/dependency-versions.md](docs/development-plan/dependency-versions.md)
- 环境搭建与最小验证：[docs/development-plan/environment-setup.md](docs/development-plan/environment-setup.md)

后续 AI 开发前必须先读取开发文档索引和 AI 开发行为约束，再按任务类型读取对应约束文档。例如测试相关任务读取 `testing-acceptance.md`，CLI 相关任务读取 `cli-api.md`。

## 后续 AI 必读规则

- 不允许静默偏离文档。任何依赖、命令、目录、协议、状态机、错误码、数据库、日志、测试或启动方式的变更，都必须说明原因并同步更新相关文档。
- 遇到依赖版本问题时，必须记录原版本、新版本、错误证据、修改理由和验证命令，不能直接改成 `latest`。
- 依赖选择遵循稳定兼容基线，不盲目追最新主版本；如果需要改版本，必须说明与其它组件的兼容关系。
- 任务完成时必须说明改了哪些文件、为什么改、是否偏离原文档、更新了哪些文档、运行了哪些验证命令。

## 当前状态

当前仓库已完成主控 TypeScript 工程初始化、最小 CLI 骨架验证、Task 2 配置系统、Task 3 Domain 类型和错误码、Task 4 `.ai-factory` 文件协议、Task 5 SQLite 索引和日志。Python 3.12 已通过当前目录 `.venv/` 完成隔离；Node.js 24 LTS 与 npm 11 已通过 nvm symlink 可用。下一步应按 [docs/development-plan/implementation-tasks.md](docs/development-plan/implementation-tasks.md) 继续 Task 6 Profile Registry。
