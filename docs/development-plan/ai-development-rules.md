# AI 开发行为约束

后续 AI 在本项目中写代码、改配置、调依赖、修测试或修改架构时，必须遵守本文件。本文优先级高于单个任务文档中的宽泛描述；如果发生冲突，先按本文执行，再同步修正文档冲突。

## 1. 总原则

- 不允许静默偏离文档。任何偏离都必须说明原因，并更新对应文档。
- 不允许只改代码不改规划。只要实现决策改变了依赖、命令、目录、协议、状态机、错误码、数据库、日志、测试或启动方式，就必须同步更新文档。
- 不允许用“临时绕过”当作完成。临时方案必须写入风险、后续处理和验证方式。
- 不允许删除失败证据。失败日志、测试输出、blocked 报告和修复说明必须保留到对应 `.ai-factory` 或开发文档约定位置。
- 不允许扩大范围时不说明。新增框架、服务、数据库、队列、中间件或外部 API 都必须有明确理由。

## 2. 依赖问题处理规则

遇到依赖安装失败、版本冲突、peer dependency 冲突、运行时不兼容、包不存在、安全漏洞或构建器不支持时，必须按以下顺序处理：

1. 先确认错误证据：记录命令、cwd、退出码、关键错误日志。
2. 检查 [dependency-versions.md](dependency-versions.md) 是否已有锁定版本和核验命令。
3. 如果必须修改版本，必须说明：
   - 原锁定版本。
   - 新版本。
   - 触发修改的错误或证据。
   - 为什么不能通过配置、命令 cwd 或锁文件解决。
   - 修改后运行了哪些验证命令。
4. 同步更新：
   - [dependency-versions.md](dependency-versions.md)
   - 涉及 Profile 时更新 [profile-templates.md](profile-templates.md)
   - 涉及任务计划时更新 [implementation-tasks.md](implementation-tasks.md)
   - 涉及 README 描述时更新根 [README.md](../../README.md)
5. 提交或最终回复必须列出依赖变更摘要。

禁止事项：

- 禁止把精确版本改成 `latest`。
- 禁止为了通过安装随意降级主运行时。
- 禁止同时升级多个无关依赖来掩盖根因。
- 禁止只改 lockfile 不说明根因。
- 禁止忽略 peer dependency 警告，除非文档说明该警告不会影响运行和测试。

## 3. 命令和工作目录问题处理规则

如果命令失败是因为 cwd、路径、shell、包管理器或平台差异：

- 优先修正 Profile 的结构化命令定义，而不是在调用处硬编码特殊分支。
- 每条命令必须有明确 `cwd`。
- 多段跨目录命令必须拆成命令数组。
- 不允许把用户输入拼接进 shell 字符串。
- 修改命令后必须更新 [profile-templates.md](profile-templates.md)、[configuration.md](configuration.md) 和必要的测试文档。

必须说明：

- 失败命令和 cwd。
- 正确 cwd 或命令结构。
- 为什么这个修正属于 Profile 约束，而不是一次性脚本修补。

## 4. 文件协议和接口问题处理规则

如果实现时发现 `.ai-factory` 协议、JSON schema、TypeScript 接口或报告格式不足：

- 先更新 [interfaces.md](interfaces.md) 或 [protocol.md](protocol.md)。
- 再更新对应实现。
- 再更新测试 fixture。
- 如果变更影响状态流转，必须更新 [state-machine.md](state-machine.md)。

必须保持：

- 机器判定依据是 JSON/YAML，不是自然语言 stdout。
- `report.json` 和 `report.md` 仍然是 Agent 完成任务的硬性产物。
- 旧字段弃用时必须说明兼容策略，不能无说明删除。

## 5. 测试和验收问题处理规则

测试失败时必须先定位失败层级：

- install
- lint
- unit test
- integration test
- build
- e2e
- startup
- acceptance

处理规则：

- 不允许删除测试来通过验证，除非测试本身与最新需求冲突，并同步更新需求文档和替代测试。
- 不允许把失败测试标记为 skipped，除非写明阻塞原因、恢复条件和跟踪任务。
- 修复测试基础设施时必须更新 [testing-acceptance.md](testing-acceptance.md)。
- 启动、端口、healthcheck、API docs 的变更必须更新启动证据规则。

最终说明必须包含：

- 失败命令。
- 修复点。
- 重新运行的验证命令。
- 仍未覆盖的风险。

## 6. 数据库和迁移问题处理规则

遇到数据库版本、迁移工具、schema、seed 或容器启动问题时：

- 不允许直接切换数据库引擎，除非 `stack_profile` 和文档同步修改。
- 迁移命令变更必须更新 [logging-database.md](logging-database.md)、[profile-templates.md](profile-templates.md) 和 [dependency-versions.md](dependency-versions.md)。
- schema 变更必须同步更新 `.ai-factory/architecture/data-model.md` 的生成规则。
- 数据库容器版本变更必须说明原因和兼容影响。

## 7. 日志、安全和凭据问题处理规则

如果实现涉及日志、环境变量、AI CLI、数据库 URL、token 或密钥：

- 必须读取 [security.md](security.md)。
- 不允许把真实密钥写入代码、文档、日志或示例。
- 新增敏感字段必须同步更新脱敏规则。
- 环境变量白名单变更必须说明必要性。
- 如果需要用户手动配置密钥，进入 blocked 或输出明确人工处理点，不能在日志里要求粘贴密钥。

## 8. 架构和范围变更规则

如果实现过程中发现原设计不可行，需要改变架构、Profile、目录或执行策略：

1. 写明不可行证据。
2. 给出最小可行替代方案。
3. 更新受影响文档。
4. 标注哪些任务需要重排。
5. 如果影响 MVP 范围，必须更新 [overview.md](overview.md) 和 [implementation-tasks.md](implementation-tasks.md)。

禁止把模块化单体升级为微服务，除非用户明确要求或文档中已有裁决。

## 9. 最终回复和提交说明要求

每次完成开发任务后，最终回复或提交说明必须包含：

- 改了哪些文件。
- 为什么改。
- 是否偏离原文档。
- 如果偏离，更新了哪些文档。
- 运行了哪些验证命令。
- 哪些风险仍然存在。

涉及依赖、命令、协议、状态机、数据库、日志、安全、测试、启动的变更，缺少文档同步说明视为任务未完成。

