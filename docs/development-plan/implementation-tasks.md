# 分阶段开发任务

每个任务开始前必须读取 [ai-development-rules.md](ai-development-rules.md)。涉及环境搭建或最小验证时必须读取 [environment-setup.md](environment-setup.md)。每个任务完成前必须运行对应测试。涉及 JSON 输出、错误码、日志、启动证据、依赖版本、命令 cwd 的任务必须同时读取相关约束文档。

## Task 1: 工程初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `eslint.config.js`
- Create: `src/cli/index.ts`
- Create: `src/domain/api-response.ts`

- [x] 创建 Node.js 24 LTS + TypeScript 5.9 稳定线工程。
- [x] 执行 [environment-setup.md](environment-setup.md) 中的最小环境检查，确认当前 shell 使用 Node.js 24 LTS。
- [x] 按 [dependency-versions.md](dependency-versions.md) 锁定主控 `package.json` 依赖版本。
- [x] 配置 `npm run build` 输出到 `dist`。
- [x] 配置 `npm test` 使用 Vitest。
- [x] 配置 CLI 入口 `bin/ai-factory.js`。
- [x] 验证：`npm run build` 成功，`node dist/cli/index.js --help` 输出命令帮助。

## Task 2: 配置系统

**Files:**
- Create: `src/config/schema.ts`
- Create: `src/config/default-config.ts`
- Create: `src/config/env.ts`
- Create: `src/config/config-loader.ts`
- Test: `tests/unit/config-loader.test.ts`

- [x] 用 Zod 定义配置 schema。
- [x] 实现 CLI/env/project/global/default 五层优先级合并。
- [x] 实现 `AI_FACTORY_HOME` 和 `AI_FACTORY_DEFAULT_RUNNER`。
- [x] 验证无效 YAML 返回 `CONFIG_INVALID`。
- [x] 测试覆盖配置合并顺序。

## Task 3: Domain 类型和错误码

**Files:**
- Create: `src/domain/errors.ts`
- Create: `src/domain/project.ts`
- Create: `src/domain/profile.ts`
- Create: `src/domain/task-graph.ts`
- Create: `src/domain/agent.ts`
- Create: `src/domain/review.ts`
- Create: `src/domain/test-report.ts`
- Create: `src/domain/startup.ts`
- Test: `tests/unit/errors.test.ts`

- [x] 实现核心接口。
- [x] 实现 `FactoryErrorCode` 到退出码映射。
- [x] 实现 `toApiResponse(error)`。
- [x] 测试所有错误码都有退出码。

## Task 4: `.ai-factory` 文件协议

**Files:**
- Create: `src/protocol/factory-layout.ts`
- Create: `src/protocol/validators.ts`
- Create: `src/protocol/report-writer.ts`
- Create: `src/persistence/file-store.ts`
- Test: `tests/unit/file-store.test.ts`

- [x] 实现目录初始化。
- [x] 实现 JSON 原子写入：先写 `.tmp`，再 rename。
- [x] 实现 status、task graph、report 的读写。
- [x] 实现 schema 校验失败返回 `CONFIG_INVALID` 或 `TASK_GRAPH_INVALID`。
- [x] 测试重复初始化不破坏已有文件。

## Task 5: SQLite 索引和日志

**Files:**
- Create: `src/persistence/migrations/001_init.sql`
- Create: `src/persistence/sqlite-store.ts`
- Create: `src/persistence/artifact-index.ts`
- Create: `src/logging/logger.ts`
- Create: `src/logging/redact.ts`
- Create: `src/logging/log-paths.ts`
- Test: `tests/unit/redact.test.ts`
- Test: `tests/integration/sqlite-store.test.ts`

- [x] 创建 SQLite migration。
- [x] 实现索引表写入。
- [x] 实现 Pino JSONL logger。
- [x] 实现日志脱敏。
- [x] 实现命令 stdout/stderr 日志路径生成。
- [x] 测试 API key、Bearer token、数据库密码会脱敏。

## Task 6: Profile Registry

**Files:**
- Create: `src/profiles/builtins/node-next.ts`
- Create: `src/profiles/builtins/python-fastapi-react.ts`
- Create: `src/profiles/builtins/java-spring-vue.ts`
- Create: `src/profiles/registry.ts`
- Create: `src/profiles/selector.ts`
- Create: `src/profiles/validator.ts`
- Test: `tests/unit/profile-registry.test.ts`

- [ ] 实现三个内置 Profile。
- [ ] 按 [dependency-versions.md](dependency-versions.md) 为每个 Profile 声明运行时和依赖版本。
- [ ] Profile 命令 schema 支持 `cwd` 和命令数组。
- [ ] 实现 Profile schema 校验。
- [ ] 实现基于用户需求关键词的 Profile 选择。
- [ ] 用户明确指定 Node/Python/Java 时优先匹配。
- [ ] 缺少启动、测试、构建命令时返回 `PROFILE_INVALID`。

## Task 7: CLI 基础命令

**Files:**
- Create: `src/cli/commands/doctor.ts`
- Create: `src/cli/commands/profiles.ts`
- Create: `src/cli/commands/status.ts`
- Create: `src/cli/commands/logs.ts`
- Modify: `src/cli/index.ts`
- Test: `tests/integration/cli-basic.test.ts`

- [ ] 实现 `doctor --json`。
- [ ] 实现 `profiles list --json`。
- [ ] 实现 `profiles validate <file>`。
- [ ] 实现 `status <project-dir> --json`。
- [ ] 实现 `logs <project-dir> --tail 200`。
- [ ] 测试 `--json` stdout 只有一个 JSON 对象。

## Task 8: Planning Pipeline

**Files:**
- Create: `src/planning/intake-service.ts`
- Create: `src/planning/planner-service.ts`
- Create: `src/planning/research-service.ts`
- Create: `src/planning/judge-service.ts`
- Create: `src/planning/architect-service.ts`
- Create: `src/planning/task-graph-service.ts`
- Create: `src/cli/commands/create.ts`
- Create: `src/cli/commands/plan.ts`
- Test: `tests/integration/planning-pipeline.test.ts`

- [ ] `create` 写入 user request 和 initial requirements。
- [ ] mock 模式生成稳定的 project-understanding。
- [ ] offline research 生成 `research_mode=offline`。
- [ ] Judge 根据规则输出 `template`。
- [ ] Architect 生成 architecture、data-model、OpenAPI 占位契约。
- [ ] Task Graph 生成合法 DAG。
- [ ] 默认停在 `awaiting_user_approval`。
- [ ] `--auto-approve` 进入执行阶段。

## Task 9: Agent Runner

**Files:**
- Create: `src/runners/agent-runner.ts`
- Create: `src/runners/mock-runner.ts`
- Create: `src/runners/process-runner.ts`
- Create: `src/runners/codex-cli-runner.ts`
- Create: `src/agents/context-builder.ts`
- Test: `tests/integration/agent-runner.test.ts`

- [ ] 实现统一 `AgentRunner` 接口。
- [ ] `mock-runner` 根据任务生成声明产物和 report。
- [ ] `process-runner` 捕获退出码、stdout、stderr、超时。
- [ ] `codex-cli-runner` 读取 `AI_FACTORY_CODEX_BIN`。
- [ ] 缺少 report 返回 `AGENT_REPORT_MISSING`。
- [ ] 超时返回 `AGENT_TIMEOUT`。

## Task 10: DAG Scheduler 和执行流

**Files:**
- Create: `src/execution/scheduler.ts`
- Create: `src/execution/task-executor.ts`
- Create: `src/execution/retry-policy.ts`
- Create: `src/execution/workspace-manager.ts`
- Create: `src/execution/integration-manager.ts`
- Create: `src/cli/commands/run.ts`
- Create: `src/cli/commands/resume.ts`
- Test: `tests/unit/scheduler.test.ts`
- Test: `tests/integration/execution-flow.test.ts`

- [ ] 校验 task graph 无环。
- [ ] 计算 ready tasks。
- [ ] 按 `max_parallel_agents` 并发执行。
- [ ] 任务完成后校验 expected outputs。
- [ ] 集成 allowed paths 内的变更。
- [ ] 失败按 retry policy 回流。
- [ ] 超过重试生成 blocked report。

## Task 11: Review 和返工

**Files:**
- Create: `src/review/review-service.ts`
- Create: `src/review/issue-router.ts`
- Test: `tests/integration/review-loop.test.ts`

- [ ] Review Agent 读取 changed files 和 contracts。
- [ ] 输出 review-report.json。
- [ ] high/critical issue 路由到 owner。
- [ ] owner task 状态进入 `changes_requested`。
- [ ] 修复任务 prompt 包含原任务、issue、限制路径。
- [ ] 同一 issue 三次失败升级给 Judge。

## Task 12: 测试、启动和验收

**Files:**
- Create: `src/testing/command-suite.ts`
- Create: `src/testing/port-utils.ts`
- Create: `src/testing/startup-verifier.ts`
- Create: `src/testing/acceptance-service.ts`
- Test: `tests/integration/testing-flow.test.ts`

- [ ] 按 Profile 顺序执行 install/lint/test/build/e2e。
- [ ] 每条命令写 CommandEvidence。
- [ ] 端口占用返回 `PORT_UNAVAILABLE`。
- [ ] healthcheck 失败返回 `STARTUP_HEALTHCHECK_FAILED`。
- [ ] 生成 startup-evidence.json/md。
- [ ] 生成 acceptance-report.json/md。
- [ ] 成功时 CLI 输出本地访问地址。

## Task 13: `node-next` 模板

**Files:**
- Create: `src/templates/template-engine.ts`
- Create: `src/templates/profile-template.ts`
- Create directory: `src/templates/node-next/`
- Test: `tests/e2e/node-next-template.spec.ts`

- [ ] 生成 Next.js 项目骨架。
- [ ] 按 [dependency-versions.md](dependency-versions.md) 锁定 Next.js、React、Prisma、Playwright 等版本。
- [ ] 生成 Prisma schema 和 PostgreSQL docker-compose。
- [ ] 生成登录注册基础模块。
- [ ] 生成 OpenAPI docs 路由或 API docs 页面。
- [ ] 生成 Playwright e2e 基础测试。
- [ ] 模板不依赖 AI 时可安装、构建、启动。

## Task 14: Python 与 Java 模板骨架

**Files:**
- Create directory: `src/templates/python-fastapi-react/`
- Create directory: `src/templates/java-spring-vue/`
- Test: `tests/unit/profile-template.test.ts`

- [ ] 生成目录骨架和配置文件。
- [ ] 按 [dependency-versions.md](dependency-versions.md) 锁定 Python 和前端依赖版本。
- [ ] 通过 `.venv` 在当前目录隔离 Python 3.12.x，不修改系统 Python。
- [ ] Java Profile 实现前二次核验 Maven 依赖版本，并更新版本矩阵。
- [ ] 生成 docker-compose。
- [ ] 生成 healthcheck。
- [ ] 生成基础 README。
- [ ] Profile validate 必须通过。
- [ ] 本阶段不要求业务模块完整度超过 `node-next`。

## Task 15: 最终端到端验收

**Files:**
- Test: `tests/e2e/ai-factory-create.spec.ts`

- [ ] 运行 `npm run lint`。
- [ ] 运行 `npm test`。
- [ ] 运行 `npm run build`。
- [ ] 运行 `node dist/cli/index.js doctor --json`。
- [ ] 运行 `node dist/cli/index.js create "做一个课程预约系统，有学生端、教师端和后台管理" --runner mock --profile node-next --auto-approve --json`。
- [ ] 检查输出 JSON `ok=true`。
- [ ] 检查 `.ai-factory/acceptance/acceptance-report.md` 存在。
- [ ] 检查 `.ai-factory/startup/startup-evidence.json` 存在。
