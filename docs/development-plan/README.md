# AI Web Project Workflow 开发文档索引

后续 AI 开发代码前必须先读取本索引。不要一次性读取所有文档，先按当前任务从“任务路由”选择需要的约束文档。

原始需求文档：[ai-web-project-workflow-plan.md](../../ai-web-project-workflow-plan.md)  
完整总规划原稿：[ai-web-project-workflow-development-plan.md](../../ai-web-project-workflow-development-plan.md)

## 1. 全局强制约束

这些约束适用于所有开发任务：

- 后续 AI 写代码前必须读取 [ai-development-rules.md](ai-development-rules.md)。遇到依赖、命令、协议、测试、启动、数据库、日志、安全等问题时，必须说明原因并同步更新相关文档。
- `stack_profile` 是生成项目的技术栈真相源。Agent 不允许自行替换包管理器、数据库、目录结构或启动命令。
- `.ai-factory` 文件协议是每个生成项目的权威状态源。SQLite 只做索引和审计缓存。
- 所有机器可读输出必须是 JSON 或 YAML，不从自然语言 stdout 中解析关键状态。
- Agent 执行结束必须写入 `report.json` 和 `report.md`。缺少报告视为失败。
- 审查、测试、启动证据必须落盘，不能只打印在终端。
- CLI 的 `--json` 模式 stdout 只能输出一个 JSON 对象。进度和日志写 stderr 或日志文件。
- 默认只在两个点打断用户：输入需求、确认计划。执行阶段除 `blocked` 外不再询问。
- 命令执行必须避免 shell 字符串拼接用户输入，日志写入前必须脱敏。
- 依赖版本采用稳定兼容基线，不追求最新主版本；选择时必须兼顾真实开源项目验证、官方模板、兼容矩阵和 peer dependency 证据。

## 2. 任务路由

| 当前任务 | 先读文档 | 再按需读取 |
|---|---|---|
| 任何代码开发、修复、调依赖、改命令 | [ai-development-rules.md](ai-development-rules.md) | 当前任务对应主题文档 |
| 理解项目目标、范围、技术栈 | [overview.md](overview.md) | [implementation-tasks.md](implementation-tasks.md) |
| 创建或调整目录结构 | [project-structure.md](project-structure.md) | [protocol.md](protocol.md) |
| 写 CLI 命令、JSON 输出、退出码 | [cli-api.md](cli-api.md) | [errors.md](errors.md) |
| 写 TypeScript 类型、接口、领域模型 | [interfaces.md](interfaces.md) | [state-machine.md](state-machine.md) |
| 写配置加载、环境变量、Profile 注册 | [configuration.md](configuration.md) | [profile-templates.md](profile-templates.md) |
| 写依赖、package.json、pyproject.toml、pom.xml、Dockerfile | [dependency-versions.md](dependency-versions.md) | [profile-templates.md](profile-templates.md) |
| 判断或搭建本地环境、做最小代码验证 | [environment-setup.md](environment-setup.md) | [dependency-versions.md](dependency-versions.md) |
| 写 `.ai-factory` 文件协议、报告格式 | [protocol.md](protocol.md) | [state-machine.md](state-machine.md) |
| 写 Agent prompt、Runner、交接报告 | [agents-and-runners.md](agents-and-runners.md) | [protocol.md](protocol.md) |
| 写 DAG 调度、workspace、集成、返工 | [execution-workflow.md](execution-workflow.md) | [state-machine.md](state-machine.md) |
| 写审查、测试、启动、验收 | [testing-acceptance.md](testing-acceptance.md) | [logging-database.md](logging-database.md) |
| 写数据库、SQLite、日志、审计 | [logging-database.md](logging-database.md) | [security.md](security.md) |
| 写错误处理、重试、blocked 报告 | [errors.md](errors.md) | [state-machine.md](state-machine.md) |
| 写安全、命令执行、脱敏 | [security.md](security.md) | [logging-database.md](logging-database.md) |
| 按阶段执行开发计划 | [implementation-tasks.md](implementation-tasks.md) | 对应任务的主题文档 |

## 3. 推荐读取方式

测试任务示例：

1. 读取本索引。
2. 根据任务路由读取 [testing-acceptance.md](testing-acceptance.md)。
3. 如涉及测试报告、命令日志、启动证据，再读取 [logging-database.md](logging-database.md)。
4. 如需要错误码和重试规则，再读取 [errors.md](errors.md)。

CLI 任务示例：

1. 读取本索引。
2. 读取 [cli-api.md](cli-api.md)。
3. 如涉及返回错误，读取 [errors.md](errors.md)。
4. 如涉及配置参数，读取 [configuration.md](configuration.md)。

Agent Runner 任务示例：

1. 读取本索引。
2. 读取 [agents-and-runners.md](agents-and-runners.md)。
3. 读取 [protocol.md](protocol.md)，确认报告和 `.ai-factory` 交接规则。
4. 读取 [logging-database.md](logging-database.md)，确认 stdout/stderr 日志证据。

## 4. 文档清单

- [overview.md](overview.md)：目标、阶段边界、技术栈、强制规则。
- [ai-development-rules.md](ai-development-rules.md)：后续 AI 开发、修复、依赖变更和文档同步规则。
- [project-structure.md](project-structure.md)：仓库结构和生成项目结构。
- [cli-api.md](cli-api.md)：CLI 命令、返回规则、JSON 输出、退出码。
- [interfaces.md](interfaces.md)：TypeScript 核心接口。
- [configuration.md](configuration.md)：配置入口、环境变量、内置 Profile 策略。
- [dependency-versions.md](dependency-versions.md)：运行时、框架、包版本和命令 cwd 锁定。
- [environment-setup.md](environment-setup.md)：本地环境隔离、Python 3.12 `.venv`、Node 24 要求、npm cache 约束和最小验证。
- [protocol.md](protocol.md)：`.ai-factory` 文件协议、Agent 产物、报告格式。
- [state-machine.md](state-machine.md)：项目状态、任务状态、blocked 报告。
- [agents-and-runners.md](agents-and-runners.md)：Agent 角色、AgentRunner、prompt 和 report 规则。
- [execution-workflow.md](execution-workflow.md)：DAG 调度、workspace、集成、返工。
- [testing-acceptance.md](testing-acceptance.md)：测试、启动证据、验收条件。
- [logging-database.md](logging-database.md)：SQLite、日志路径、日志留存、审计。
- [errors.md](errors.md)：错误码、退出码、重试规则。
- [profile-templates.md](profile-templates.md)：`node-next`、`python-fastapi-react`、`java-spring-vue` 模板要求。
- [security.md](security.md)：命令执行安全、环境变量、敏感信息处理。
- [implementation-tasks.md](implementation-tasks.md)：分阶段开发任务。
