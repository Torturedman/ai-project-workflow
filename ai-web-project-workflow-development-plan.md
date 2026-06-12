# AI Web Project Workflow 详细开发规划

> **For agentic workers:** 后续 AI 必须先阅读本文件，再开发代码。实现时使用 `superpowers:subagent-driven-development` 或 `superpowers:executing-plans` 按任务逐项推进。所有步骤使用 checkbox 状态追踪。

**Goal:** 实现一个本地 CLI 编排器 `ai-factory`，把一句 Web 项目需求自动转成项目理解、开源调研、技术路线裁决、任务 DAG、多 Agent 开发、审查、测试、启动和验收证据。

**Architecture:** 主控系统采用 TypeScript/Node.js 的模块化 CLI。`.ai-factory` 文件协议是每个生成项目的权威状态源，SQLite 只做全局索引、审计和日志查询加速。Agent 之间不直接通信，全部通过主控、任务文件、状态文件、报告、日志和 workspace 交接。

**Tech Stack:** Node.js 20 LTS、TypeScript 5、npm、Commander、Zod、Execa、Pino、YAML、Vitest、Playwright、SQLite。MVP 首先实现 `node-next` Profile，随后补齐 `python-fastapi-react` 与 `java-spring-vue`。

---

## 1. 开发边界

### 1.1 本阶段必须实现

- 本地 CLI：`ai-factory create "<需求>"`、`plan`、`run`、`resume`、`status`、`logs`、`doctor`、`profiles`。
- 文件协议：`.ai-factory` 目录、项目状态、任务 DAG、Agent 报告、审查报告、测试报告、启动证据、验收报告。
- 技术栈 Profile：统一配置格式、Profile 选择规则、Profile 校验、模板命令约束。
- Agent Runner：统一 `AgentRunner.run(task, workspace, context)` 接口，MVP 内置 `mock` 与 `codex-cli` 两个适配器。
- 决策流：Intake、Planner、Research、Judge、Architect、Task Graph 的文件输出和状态流转。
- 执行流：根据 DAG 并行调度 Dev Agent，审查失败后返工，测试失败后回流，超过阈值进入 `blocked`。
- 启动与验收：执行 Profile 声明的 lint/test/build/e2e/start 命令，输出 localhost 地址、API 文档地址和启动证据。
- 日志与审计：结构化 JSONL 日志、Agent stdout/stderr 原始日志、SQLite 全局运行索引、敏感信息脱敏。

### 1.2 本阶段不实现

- Web 控制台。
- Kubernetes 部署。
- 生产级权限系统。
- 多租户平台。
- 远程任务队列。
- 付费、短信、复杂消息队列、分布式事务。
- 任意语言任意框架的无限制生成。

### 1.3 强制开发规则

- `stack_profile` 是生成项目的技术栈真相源，Agent 不允许自行替换包管理器、数据库、目录结构或启动命令。
- `.ai-factory` 文件是项目状态权威源，SQLite 只做索引和审计缓存；SQLite 损坏时必须能从 `.ai-factory` 重建索引。
- 所有机器可读输出必须是 JSON 或 YAML，不从自然语言 stdout 中解析关键状态。
- Agent 执行结束必须写入 `report.json` 和 `report.md`；缺少报告视为失败。
- 审查、测试、启动证据必须落盘，不能只打印在终端。
- CLI 的 `--json` 模式 stdout 只能输出一个 JSON 对象，进度和日志写 stderr 或日志文件。
- 默认只在两个点打断用户：输入需求、确认计划。执行阶段除 `blocked` 外不再询问。

---

## 2. 仓库项目结构

```text
ai-project-workflow/
  README.md
  ai-web-project-workflow-plan.md
  ai-web-project-workflow-development-plan.md
  package.json
  package-lock.json
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
  eslint.config.js
  .gitignore
  bin/
    ai-factory.js
  src/
    cli/
      index.ts
      commands/
        create.ts
        plan.ts
        run.ts
        resume.ts
        status.ts
        logs.ts
        doctor.ts
        profiles.ts
    config/
      config-loader.ts
      default-config.ts
      env.ts
      schema.ts
    domain/
      agent.ts
      api-response.ts
      artifacts.ts
      errors.ts
      project.ts
      profile.ts
      review.ts
      startup.ts
      state-machine.ts
      task-graph.ts
      test-report.ts
    persistence/
      file-store.ts
      sqlite-store.ts
      artifact-index.ts
      migrations/
        001_init.sql
    logging/
      logger.ts
      redact.ts
      log-paths.ts
    profiles/
      registry.ts
      selector.ts
      validator.ts
      builtins/
        node-next.ts
        python-fastapi-react.ts
        java-spring-vue.ts
    protocol/
      factory-layout.ts
      report-writer.ts
      schemas.ts
      validators.ts
    agents/
      prompts/
        intake.md
        planner.md
        research.md
        judge.md
        architect.md
        task-graph.md
        dev.md
        review.md
        test-qa.md
      context-builder.ts
      agent-orchestrator.ts
    runners/
      agent-runner.ts
      mock-runner.ts
      codex-cli-runner.ts
      process-runner.ts
    planning/
      intake-service.ts
      planner-service.ts
      research-service.ts
      judge-service.ts
      architect-service.ts
      task-graph-service.ts
    execution/
      scheduler.ts
      workspace-manager.ts
      task-executor.ts
      retry-policy.ts
      integration-manager.ts
    review/
      review-service.ts
      issue-router.ts
    testing/
      command-suite.ts
      startup-verifier.ts
      acceptance-service.ts
      port-utils.ts
    templates/
      template-engine.ts
      profile-template.ts
      node-next/
      python-fastapi-react/
      java-spring-vue/
    utils/
      fs.ts
      json.ts
      time.ts
      ids.ts
      hash.ts
  tests/
    unit/
    integration/
    fixtures/
      minimal-project/
      invalid-task-graph/
      profile-configs/
    e2e/
  docs/
    protocol.md
    profile-authoring.md
    runner-adapters.md
```

### 2.1 目录职责

| 目录 | 职责 |
|---|---|
| `src/cli` | CLI 参数解析、命令注册、输出规则、退出码映射 |
| `src/config` | 全局配置、项目配置、环境变量、优先级合并、Zod 校验 |
| `src/domain` | 纯类型、枚举、接口、错误码、状态机定义，不依赖文件系统 |
| `src/persistence` | `.ai-factory` 文件读写、SQLite 索引、artifact 哈希 |
| `src/logging` | Pino logger、JSONL 日志、脱敏、日志路径 |
| `src/profiles` | 内置 Profile、Profile 选择、Profile 验证 |
| `src/protocol` | `.ai-factory` 布局、报告写入、schema 校验 |
| `src/agents` | Agent prompt、上下文构造、角色输入输出约束 |
| `src/runners` | AI CLI/API 适配层、进程执行、mock runner |
| `src/planning` | Intake/Planner/Research/Judge/Architect/Task Graph 阶段编排 |
| `src/execution` | DAG 调度、workspace 管理、任务执行、重试、集成 |
| `src/review` | Review Agent 调度、问题归属、返工投递 |
| `src/testing` | lint/test/build/e2e/start 命令执行、端口与 HTTP 检查、验收报告 |
| `src/templates` | 生成项目工程模板，按 Profile 分目录 |
| `tests` | 单元、集成、端到端和 fixture |

---

## 3. 生成项目结构

MVP 生成项目必须符合下面结构。不同 Profile 可以改变 `apps/backend` 的内部框架，但不得改变 `.ai-factory` 协议。

```text
generated-project/
  README.md
  docker-compose.yml
  .env.example
  .gitignore
  apps/
    backend/
    frontend/
  packages/
    shared/
  tests/
    e2e/
  .ai-factory/
    status.json
    input/
      user-request.md
      initial-requirements.json
    planning/
      project-understanding.md
      project-understanding.json
    research/
      open-source-candidates.md
      open-source-candidates.json
    decision/
      final-decision.md
      final-decision.json
      stack-profile.md
      stack-profile.json
    architecture/
      architecture.md
      service-map.md
      data-model.md
    contracts/
      openapi.yaml
      auth-flow.md
      error-codes.md
      events.md
    tasks/
      task-graph.json
      task-graph.md
      task-files/
        auth-contract.task.md
        db-schema.task.md
    agents/
      intake/
        status.json
        report.json
        report.md
      planner/
        status.json
        report.json
        report.md
      dev-backend/
        status.json
        report.json
        report.md
      dev-frontend/
        status.json
        report.json
        report.md
      review/
        status.json
        report.json
        report.md
      test-qa/
        status.json
        report.json
        report.md
    reviews/
      review-report.json
      review-report.md
    tests/
      test-report.json
      e2e-report.md
    startup/
      startup-evidence.json
      startup-evidence.md
    acceptance/
      acceptance-report.json
      acceptance-report.md
    logs/
      orchestrator.jsonl
      commands/
      agents/
```

---

## 4. CLI 接口

### 4.1 命令列表

```bash
ai-factory create "<需求>" [--profile node-next] [--architecture standard] [--output ./generated-project] [--runner codex-cli] [--auto-approve] [--json]
ai-factory plan <project-dir> [--json]
ai-factory run <project-dir> [--json]
ai-factory resume <project-dir> [--json]
ai-factory status <project-dir> [--watch] [--json]
ai-factory logs <project-dir> [--agent dev-backend] [--task auth-api] [--tail 200]
ai-factory doctor [--json]
ai-factory profiles list [--json]
ai-factory profiles validate <profile-file> [--json]
```

### 4.2 命令职责

| 命令 | 职责 | 成功产物 |
|---|---|---|
| `create` | 创建项目目录，完成需求解析、规划、调研、决策、任务图；默认停在 `awaiting_user_approval`，`--auto-approve` 会继续执行 | `.ai-factory/status.json`、规划文件、决策文件、任务图 |
| `plan` | 对已有 `.ai-factory/input` 重新生成计划，不执行开发 | planning/research/decision/architecture/tasks |
| `run` | 从已确认计划开始执行 DAG、审查、测试、启动、验收 | code、reports、startup evidence |
| `resume` | 从当前状态恢复执行，处理失败重试或继续未完成任务 | 更新后的状态和报告 |
| `status` | 查看项目状态、任务状态、最近错误和启动地址 | 人类摘要或 JSON |
| `logs` | 查看结构化日志或 Agent 原始日志 | 终端输出，不改变状态 |
| `doctor` | 检查 Node、npm、Git、Docker、AI CLI、端口和配置 | 环境诊断报告 |
| `profiles list` | 列出内置 Profile 和可用命令 | Profile 列表 |
| `profiles validate` | 校验外部 Profile 文件 | 校验结果 |

### 4.3 返回规则

#### 4.3.1 默认人类输出

- stdout 输出简洁状态、下一步和关键文件路径。
- stderr 输出进度、警告和非结构化诊断。
- 成功时最后必须打印生成项目目录、前端地址、后端地址、API 文档地址、验收报告路径。

#### 4.3.2 `--json` 输出

`--json` 模式 stdout 只能输出一个 JSON 对象。所有日志写 stderr 或 `.ai-factory/logs`。

成功格式：

```json
{
  "ok": true,
  "code": "OK",
  "message": "Project workflow completed",
  "run_id": "run_01HZX8V2Q4Z9C4X5V5Y3X3K0R2",
  "project_id": "proj_01HZX8V2Q4Z9C4X5V5Y3X3K0R1",
  "data": {
    "project_dir": "E:/work/generated-project",
    "status": "completed",
    "frontend_url": "http://localhost:3000",
    "backend_url": "http://localhost:3000",
    "api_docs_url": "http://localhost:3000/api/docs",
    "acceptance_report": ".ai-factory/acceptance/acceptance-report.md"
  },
  "warnings": [],
  "evidence": {
    "startup_evidence": ".ai-factory/startup/startup-evidence.json",
    "test_report": ".ai-factory/tests/test-report.json"
  }
}
```

失败格式：

```json
{
  "ok": false,
  "code": "TEST_FAILED",
  "message": "Profile test command failed",
  "run_id": "run_01HZX8V2Q4Z9C4X5V5Y3X3K0R2",
  "project_id": "proj_01HZX8V2Q4Z9C4X5V5Y3X3K0R1",
  "retryable": true,
  "details": {
    "task_id": "auth-api",
    "command": "npm test",
    "exit_code": 1
  },
  "evidence": {
    "test_report": ".ai-factory/tests/test-report.json",
    "log": ".ai-factory/logs/commands/npm-test-20260613T012233Z.stderr.log"
  }
}
```

### 4.4 退出码

| 退出码 | 含义 |
|---:|---|
| `0` | 成功 |
| `1` | 参数、配置、Profile 校验失败 |
| `2` | 用户取消或未确认计划 |
| `3` | 规划/调研/裁决阶段进入 blocked |
| `4` | Agent Runner 执行失败 |
| `5` | lint/test/build/e2e 失败 |
| `6` | 本地启动或健康检查失败 |
| `7` | 内部错误 |
| `130` | 用户中断 |

---

## 5. TypeScript 核心接口

### 5.1 API Response

```ts
export interface ApiResponse<TData = unknown> {
  ok: boolean;
  code: string;
  message: string;
  run_id?: string;
  project_id?: string;
  data?: TData;
  warnings?: string[];
  retryable?: boolean;
  details?: Record<string, unknown>;
  evidence?: Record<string, string>;
}
```

### 5.2 Stack Profile

```ts
export type ArchitectureMode = "simple" | "standard" | "microservice";

export interface StackProfile {
  id: string;
  display_name: string;
  architecture_modes: ArchitectureMode[];
  backend: {
    language: string;
    framework: string;
    package_manager: string;
    root_dir: string;
    dev_command: string;
    build_command: string;
    test_command: string;
    lint_command: string;
    api_docs_path: string;
    healthcheck_path: string;
  };
  frontend: {
    language: string;
    framework: string;
    package_manager: string;
    root_dir: string;
    dev_command: string;
    build_command: string;
    test_command: string;
    lint_command: string;
    port: number;
  };
  database: {
    engine: "postgresql" | "mysql" | "sqlite";
    version: string;
    orm: string;
    migration_command: string;
    seed_command: string;
    connection_env: string;
  };
  container: {
    compose_file: string;
    up_command: string;
    down_command: string;
  };
  verification: {
    install_command: string;
    lint_command: string;
    test_command: string;
    build_command: string;
    e2e_command: string;
    dev_command: string;
  };
  template: {
    id: string;
    root: string;
  };
}
```

### 5.3 Agent Runner

```ts
export type AgentRole =
  | "intake"
  | "planner"
  | "research"
  | "judge"
  | "architect"
  | "task-graph"
  | "dev-backend"
  | "dev-frontend"
  | "dev-db"
  | "review"
  | "test-qa";

export interface AgentTask {
  id: string;
  role: AgentRole;
  title: string;
  task_file: string;
  workspace_dir: string;
  expected_outputs: string[];
  constraints: string[];
}

export interface AgentContext {
  project_dir: string;
  factory_dir: string;
  run_id: string;
  project_id: string;
  stack_profile: StackProfile;
  status_file: string;
  task_graph_file: string;
  memory_file?: string;
  retry?: {
    attempt: number;
    previous_issues: ReviewIssue[];
  };
}

export interface AgentResult {
  ok: boolean;
  role: AgentRole;
  task_id: string;
  invocation_id: string;
  exit_code: number;
  started_at: string;
  ended_at: string;
  stdout_log: string;
  stderr_log: string;
  report_json: string;
  report_md: string;
  changed_files: string[];
  errors: FactoryError[];
}

export interface AgentRunner {
  id: string;
  run(task: AgentTask, context: AgentContext): Promise<AgentResult>;
}
```

### 5.4 Task Graph

```ts
export type TaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "ready_for_review"
  | "reviewing"
  | "changes_requested"
  | "fixing"
  | "approved"
  | "integrated"
  | "testing"
  | "failed"
  | "tested"
  | "accepted"
  | "blocked";

export interface TaskNode {
  id: string;
  title: string;
  owner: AgentRole;
  status: TaskStatus;
  depends_on: string[];
  stack_profile: string;
  workspace: string;
  inputs: string[];
  outputs: string[];
  allowed_paths: string[];
  verification_commands: string[];
  attempt: number;
  max_attempts: number;
}

export interface TaskGraph {
  version: "1.0";
  project_id: string;
  run_id: string;
  tasks: TaskNode[];
}
```

### 5.5 Review Report

```ts
export type IssueSeverity = "critical" | "high" | "medium" | "low";

export interface ReviewIssue {
  id: string;
  severity: IssueSeverity;
  owner: AgentRole;
  task_id: string;
  file: string;
  line?: number;
  problem: string;
  expected_fix: string;
  evidence?: string;
}

export interface ReviewReport {
  version: "1.0";
  approved: boolean;
  run_id: string;
  reviewed_at: string;
  summary: string;
  issues: ReviewIssue[];
}
```

### 5.6 Test 和启动证据

```ts
export type VerificationStatus = "passed" | "failed" | "skipped";

export interface CommandEvidence {
  name: string;
  command: string;
  cwd: string;
  status: VerificationStatus;
  exit_code: number;
  started_at: string;
  ended_at: string;
  stdout_log: string;
  stderr_log: string;
}

export interface TestReport {
  version: "1.0";
  run_id: string;
  status: VerificationStatus;
  commands: CommandEvidence[];
  failures: FactoryError[];
}

export interface StartupEvidence {
  version: "1.0";
  run_id: string;
  status: VerificationStatus;
  started_at: string;
  services: Array<{
    name: string;
    url: string;
    port: number;
    healthcheck_url?: string;
    status: VerificationStatus;
    http_status?: number;
    pid?: number;
    container?: string;
    log_tail: string;
  }>;
  frontend_url?: string;
  backend_url?: string;
  api_docs_url?: string;
  evidence_files: string[];
}
```

---

## 6. 配置入口

### 6.1 配置文件路径

配置加载优先级从高到低：

1. CLI flags。
2. 环境变量。
3. 项目配置：`<project-dir>/ai-factory.config.yaml`。
4. 全局配置：`~/.ai-factory/config.yaml`。
5. 内置默认配置：`src/config/default-config.ts`。

### 6.2 项目配置格式

```yaml
default_profile: node-next
default_runner: codex-cli
architecture_mode: standard

paths:
  global_home: ~/.ai-factory
  default_output_dir: ./generated

execution:
  max_parallel_agents: 3
  agent_timeout_seconds: 1800
  command_timeout_seconds: 900
  require_user_approval_before_execution: true

retry:
  max_fix_rounds: 5
  max_same_issue_rounds: 3
  max_runner_retries: 2

logging:
  level: info
  retain_project_logs: true
  global_retention_days: 30
  max_log_file_mb: 50

supported_profiles:
  - node-next
  - python-fastapi-react
  - java-spring-vue
```

### 6.3 环境变量

| 变量 | 用途 | 默认值 |
|---|---|---|
| `AI_FACTORY_HOME` | 全局数据目录 | `~/.ai-factory` |
| `AI_FACTORY_CONFIG` | 显式指定全局配置文件 | 空 |
| `AI_FACTORY_DEFAULT_RUNNER` | 默认 Agent Runner | `mock` |
| `AI_FACTORY_CODEX_BIN` | Codex CLI 可执行文件路径 | `codex` |
| `AI_FACTORY_CLAUDE_BIN` | Claude Code CLI 可执行文件路径 | `claude` |
| `AI_FACTORY_GEMINI_BIN` | Gemini CLI 可执行文件路径 | `gemini` |
| `AI_FACTORY_LOG_LEVEL` | 日志级别 | `info` |
| `OPENAI_API_KEY` | OpenAI API 或 Codex 需要时使用 | 空 |
| `ANTHROPIC_API_KEY` | Claude API 需要时使用 | 空 |

### 6.4 内置 Profile

MVP 内置 Profile 定义在 `src/profiles/builtins`。初始状态：

| Profile | 状态 | 数据库 | 说明 |
|---|---|---|---|
| `node-next` | 必须完整实现 | PostgreSQL + Prisma | MVP 主路径，生成 Next.js 全栈应用 |
| `python-fastapi-react` | 必须完成 schema 和模板骨架，第二阶段补齐生成质量 | PostgreSQL + SQLAlchemy/Alembic | 数据工具和 API 服务 |
| `java-spring-vue` | 必须完成 schema 和模板骨架，第二阶段补齐生成质量 | MySQL + MyBatis Plus/Flyway | 企业后台 |

---

## 7. 状态机设计

### 7.1 项目状态

```ts
export type ProjectStatus =
  | "intake"
  | "planning"
  | "researching"
  | "deciding"
  | "awaiting_user_approval"
  | "executing"
  | "integrating"
  | "testing"
  | "fixing"
  | "accepting"
  | "completed"
  | "blocked";
```

合法流转：

```text
intake -> planning
planning -> researching
researching -> deciding
deciding -> awaiting_user_approval
awaiting_user_approval -> executing
executing -> integrating
integrating -> testing
testing -> fixing
fixing -> executing
testing -> accepting
accepting -> completed
任何状态 -> blocked
```

### 7.2 `.ai-factory/status.json`

```json
{
  "version": "1.0",
  "project_id": "proj_01HZX8V2Q4Z9C4X5V5Y3X3K0R1",
  "run_id": "run_01HZX8V2Q4Z9C4X5V5Y3X3K0R2",
  "status": "awaiting_user_approval",
  "raw_request": "做一个课程预约系统，有学生端、教师端和后台管理",
  "selected_profile": "node-next",
  "architecture_mode": "standard",
  "approval": {
    "required": true,
    "approved": false,
    "approved_at": null
  },
  "current_phase": "deciding",
  "frontend_url": null,
  "backend_url": null,
  "api_docs_url": null,
  "last_error": null,
  "created_at": "2026-06-13T01:00:00.000Z",
  "updated_at": "2026-06-13T01:05:00.000Z"
}
```

### 7.3 blocked 报告

进入 `blocked` 时必须写入 `.ai-factory/blocked-report.md` 和 `.ai-factory/blocked-report.json`。

```json
{
  "version": "1.0",
  "run_id": "run_01HZX8V2Q4Z9C4X5V5Y3X3K0R2",
  "blocked_at": "2026-06-13T02:00:00.000Z",
  "reason": "同一测试失败重复 3 次",
  "failed_task_id": "auth-api",
  "error_code": "MAX_RETRY_EXCEEDED",
  "attempted_fixes": [
    "重新生成 auth service",
    "修复 Prisma schema",
    "重跑 npm test"
  ],
  "current_logs": [
    ".ai-factory/logs/commands/npm-test-20260613T015955Z.stderr.log"
  ],
  "manual_actions": [
    "检查 apps/backend/src/auth/session.ts 的 cookie 设置",
    "确认测试数据库是否完成迁移"
  ]
}
```

---

## 8. 数据库设计

### 8.1 存储策略

- 项目级权威状态：`<project-dir>/.ai-factory/**/*.json|md|yaml`。
- 全局索引数据库：`~/.ai-factory/ai-factory.db`，SQLite。
- SQLite 用途：列出历史项目、查询运行记录、查询 Agent 调用和日志索引。
- SQLite 不保存秘密内容，不保存完整 prompt 正文，只保存文件路径和摘要。
- 启动时如果 SQLite 缺失或损坏，执行 `ai-factory doctor --rebuild-index` 可以扫描项目目录重建。

### 8.2 SQLite DDL

文件：`src/persistence/migrations/001_init.sql`

```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL UNIQUE,
  current_status TEXT NOT NULL,
  selected_profile TEXT,
  active_run_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  command TEXT NOT NULL,
  raw_request TEXT,
  status TEXT NOT NULL,
  config_snapshot_json TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  error_code TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  task_key TEXT NOT NULL,
  owner TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  depends_on_json TEXT NOT NULL,
  outputs_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE IF NOT EXISTS agent_invocations (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  task_id TEXT,
  role TEXT NOT NULL,
  adapter TEXT NOT NULL,
  workspace_path TEXT NOT NULL,
  prompt_path TEXT NOT NULL,
  stdout_path TEXT NOT NULL,
  stderr_path TEXT NOT NULL,
  report_json_path TEXT,
  report_md_path TEXT,
  exit_code INTEGER,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  FOREIGN KEY (run_id) REFERENCES runs(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT,
  run_id TEXT,
  task_id TEXT,
  level TEXT NOT NULL,
  event TEXT NOT NULL,
  message TEXT NOT NULL,
  data_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE INDEX IF NOT EXISTS idx_runs_project_id ON runs(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_run_id ON tasks(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_run_id ON agent_invocations(run_id);
CREATE INDEX IF NOT EXISTS idx_events_run_id ON events(run_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_run_id ON artifacts(run_id);
```

### 8.3 生成项目数据库

每个 Profile 必须声明生成项目数据库：

- `node-next`：PostgreSQL 16、Prisma、迁移命令 `npx prisma migrate deploy`、开发命令 `npx prisma migrate dev`。
- `python-fastapi-react`：PostgreSQL 16、SQLAlchemy、Alembic、迁移命令 `alembic upgrade head`。
- `java-spring-vue`：MySQL 8、MyBatis Plus、Flyway、迁移命令 `mvn -pl apps/backend flyway:migrate`。

生成项目的业务数据库 schema 由 Architect Agent 写入 `.ai-factory/architecture/data-model.md`，再由 Dev DB task 生成实际 migration。MVP 演示项目必须包含用户、角色、课程、预约四类基础表。

---

## 9. 日志设计

### 9.1 日志路径

```text
~/.ai-factory/
  logs/
    ai-factory-global.jsonl
  ai-factory.db

<project-dir>/.ai-factory/logs/
  orchestrator.jsonl
  commands/
    npm-test-20260613T015955Z.stdout.log
    npm-test-20260613T015955Z.stderr.log
  agents/
    dev-backend/
      auth-api-inv_01HZX8.stdout.log
      auth-api-inv_01HZX8.stderr.log
      auth-api-inv_01HZX8.prompt.md
```

### 9.2 JSONL 日志字段

```json
{
  "ts": "2026-06-13T01:59:55.000Z",
  "level": "info",
  "event": "task.started",
  "message": "Started task auth-api",
  "project_id": "proj_01HZX8V2Q4Z9C4X5V5Y3X3K0R1",
  "run_id": "run_01HZX8V2Q4Z9C4X5V5Y3X3K0R2",
  "task_id": "auth-api",
  "agent_role": "dev-backend",
  "data": {
    "workspace": "workspaces/dev-backend"
  }
}
```

### 9.3 日志留存和脱敏

- 项目日志默认随项目永久保留。
- 全局日志默认保留 30 天。
- 单个日志文件超过 50 MB 时滚动，命名为 `<name>.1.jsonl`。
- 脱敏规则必须覆盖：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、JWT、Bearer token、数据库 URL 密码、AWS/GitHub token 常见格式。
- `report.md` 可以保留错误摘要，不允许写入完整密钥、完整 Cookie、完整 Authorization header。

---

## 10. 错误处理

### 10.1 FactoryError

```ts
export interface FactoryError {
  code: FactoryErrorCode;
  message: string;
  retryable: boolean;
  phase?: string;
  task_id?: string;
  agent_role?: AgentRole;
  cause?: string;
  evidence?: Record<string, string>;
}
```

### 10.2 错误码

| 错误码 | retryable | 说明 |
|---|---:|---|
| `CONFIG_NOT_FOUND` | false | 显式配置文件不存在 |
| `CONFIG_INVALID` | false | YAML/JSON 或 Zod 校验失败 |
| `PROFILE_UNSUPPORTED` | false | 请求的 Profile 未注册 |
| `PROFILE_INVALID` | false | Profile 缺少启动、测试或目录定义 |
| `USER_APPROVAL_REQUIRED` | false | 计划生成完毕但未确认 |
| `PLAN_REJECTED` | false | 用户拒绝计划 |
| `TASK_GRAPH_INVALID` | false | 任务图 schema 错误 |
| `TASK_GRAPH_CYCLE` | false | DAG 存在环 |
| `TASK_OUTPUT_MISSING` | true | Agent 未生成声明产物 |
| `AGENT_COMMAND_FAILED` | true | AI CLI 非零退出 |
| `AGENT_TIMEOUT` | true | Agent 超时 |
| `AGENT_REPORT_MISSING` | true | Agent 未写 `report.json` |
| `REVIEW_HIGH_ISSUES` | true | Review 发现 high/critical 问题 |
| `TEST_FAILED` | true | lint/test/build/e2e 失败 |
| `STARTUP_HEALTHCHECK_FAILED` | true | 服务启动但健康检查失败 |
| `PORT_UNAVAILABLE` | true | Profile 声明端口被占用 |
| `DB_MIGRATION_FAILED` | true | 生成项目数据库迁移失败 |
| `MAX_RETRY_EXCEEDED` | false | 超过最大返工次数 |
| `INTERNAL_ERROR` | false | 未分类内部错误 |

### 10.3 重试规则

- `AGENT_COMMAND_FAILED`：同一 invocation 最多重试 2 次。
- `AGENT_REPORT_MISSING`：重新投递同一任务 1 次，仍缺失则 `changes_requested`。
- `REVIEW_HIGH_ISSUES`：回流给 issue owner，项目状态进入 `fixing`。
- `TEST_FAILED`：根据失败命令和文件路径路由到对应 task owner，最多 5 轮。
- 同一 `ReviewIssue.problem` 或同一测试签名重复失败 3 次，升级给 Judge Agent 重新裁决。
- 超过 `retry.max_fix_rounds` 后进入 `blocked`，必须生成 blocked 报告。

---

## 11. Agent 通信协议

### 11.1 Agent 输入

每个 Agent 的 prompt 必须包含：

- 当前角色和职责。
- 任务文件路径。
- 允许修改的路径。
- 必须读取的上下文文件。
- `stack-profile.json`。
- 必须生成的输出文件。
- 禁止事项。
- 报告格式。

Dev Agent prompt 中必须包含下面约束：

```text
你只能修改 allowed_paths 中列出的文件或目录。
你必须使用 stack-profile.json 中声明的语言、框架、包管理器、数据库、目录和命令。
你不能自行更换技术栈。
完成后必须写入 report.json 和 report.md。
report.json 必须包含 changed_files、verification、risks、next_actions。
```

### 11.2 Agent report.json

```json
{
  "version": "1.0",
  "run_id": "run_01HZX8V2Q4Z9C4X5V5Y3X3K0R2",
  "task_id": "auth-api",
  "role": "dev-backend",
  "status": "completed",
  "summary": "Implemented auth API endpoints and session handling",
  "changed_files": [
    "apps/backend/src/app/api/auth/login/route.ts",
    "apps/backend/src/lib/auth.ts"
  ],
  "created_files": [
    "apps/backend/src/app/api/auth/logout/route.ts"
  ],
  "verification": [
    {
      "command": "npm test -- auth",
      "status": "passed",
      "log": ".ai-factory/logs/commands/npm-test-auth.stdout.log"
    }
  ],
  "risks": [],
  "next_actions": []
}
```

### 11.3 机器判定规则

- `status` 只能是 `completed`、`failed`、`blocked`。
- `changed_files` 和 `created_files` 必须相对项目根目录。
- `verification` 至少包含一个命令；如果任务是纯文档或纯规划，命令写 `ai-factory protocol validate <project-dir>`。
- Agent stdout 中的自然语言不作为成功依据。
- 成功依据是：进程退出码为 0、`report.json` 合法、声明产物存在、产物通过 schema 校验。

---

## 12. 规划与决策流程

### 12.1 Intake

输入：CLI 原始需求。

输出：

- `.ai-factory/input/user-request.md`
- `.ai-factory/input/initial-requirements.json`

`initial-requirements.json` 格式：

```json
{
  "raw_request": "做一个课程预约系统，有学生端、教师端和后台管理",
  "domain": "education_booking",
  "project_type": "fullstack_web",
  "preferred_stack": [],
  "stack_profile": "auto",
  "must_have_roles": ["student", "teacher", "admin"],
  "unknowns": [
    "是否需要支付",
    "是否需要短信通知",
    "是否需要移动端"
  ],
  "defaults_applied": [
    "包含登录注册",
    "包含后台管理",
    "使用 Docker Compose 本地启动",
    "先做 MVP"
  ]
}
```

### 12.2 Planner

输出：

- `.ai-factory/planning/project-understanding.md`
- `.ai-factory/planning/project-understanding.json`

必须写清：

- 项目类型。
- 用户角色。
- 核心业务流。
- MVP 范围。
- deferred scope。
- 推荐架构模式。
- 推荐 Profile。
- 验收标准。

### 12.3 Research

输出：

- `.ai-factory/research/open-source-candidates.md`
- `.ai-factory/research/open-source-candidates.json`

网络不可用时必须生成离线调研说明：

```json
{
  "research_mode": "offline",
  "reason": "network unavailable or disabled",
  "candidates": [],
  "fallback": "template",
  "notes": [
    "未完成实时开源项目验证，按内置 Profile 模板继续"
  ]
}
```

### 12.4 Judge

输出：

- `.ai-factory/decision/final-decision.md`
- `.ai-factory/decision/final-decision.json`

裁决结果只能是：

- `reuse`
- `template`
- `scratch`

裁决优先级：

1. 能稳定本地运行。
2. 许可证允许。
3. 改造成本可控。
4. 技术栈符合用户偏好。
5. 测试和验收可自动化。
6. 架构复杂度不过度。

### 12.5 Architect

输出：

- `.ai-factory/architecture/architecture.md`
- `.ai-factory/architecture/service-map.md`
- `.ai-factory/architecture/data-model.md`
- `.ai-factory/contracts/openapi.yaml`
- `.ai-factory/contracts/auth-flow.md`
- `.ai-factory/contracts/error-codes.md`
- `.ai-factory/contracts/events.md`

Architect 必须先生成契约，再允许前后端开发任务进入 `ready`。

### 12.6 Task Graph

输出：

- `.ai-factory/tasks/task-graph.json`
- `.ai-factory/tasks/task-graph.md`
- `.ai-factory/tasks/task-files/*.task.md`

任务图必须是 DAG。校验失败直接阻止执行。

---

## 13. 调度与工作区

### 13.1 MVP 工作区策略

MVP 使用独立 workspace，目录在生成项目内：

```text
<project-dir>/.ai-factory/workspaces/
  dev-backend/
  dev-frontend/
  dev-db/
  review/
  test-qa/
```

每个 workspace 保存该 Agent 的临时上下文、prompt、报告和 diff。集成由 `integration-manager` 把允许路径内变更合并回项目根目录。

### 13.2 第二阶段 Git worktree

第二阶段增加 `--workspace-strategy git-worktree`：

```text
<project-dir>/
  main/
  worktrees/
    dev-backend-auth/
    dev-frontend-login/
```

MVP 代码必须保留接口扩展点：

```ts
export interface WorkspaceManager {
  prepare(task: TaskNode, context: AgentContext): Promise<string>;
  collectChanges(task: TaskNode, workspaceDir: string): Promise<string[]>;
  integrate(task: TaskNode, workspaceDir: string, projectDir: string): Promise<void>;
  cleanup(task: TaskNode, workspaceDir: string): Promise<void>;
}
```

---

## 14. 审查、测试与验收

### 14.1 Review

Review Agent 输入：

- 任务文件。
- changed files。
- 相关 contract。
- `stack-profile.json`。
- diff 或 workspace 文件列表。

Review Agent 输出：

- `.ai-factory/reviews/review-report.json`
- `.ai-factory/reviews/review-report.md`

判定：

- 有 `critical` 或 `high`：`approved=false`，任务回到 `changes_requested`。
- 只有 `medium` 或 `low`：MVP 可以继续，但必须记录到 `risks`。
- 无问题：任务进入 `approved`。

### 14.2 Test

Test/QA Agent 按 Profile 顺序执行：

1. `install_command`
2. `lint_command`
3. `test_command`
4. `build_command`
5. `e2e_command`

所有命令写入 `.ai-factory/tests/test-report.json`。

### 14.3 Startup

Startup Verifier 执行：

1. 检查端口是否可用。
2. 执行 Profile `dev_command` 或 `container.up_command`。
3. 等待服务启动。
4. 请求 frontend URL。
5. 请求 backend healthcheck URL。
6. 请求 API docs URL。
7. 保存日志尾部和进程/container 信息。

启动证据文件：

- `.ai-factory/startup/startup-evidence.json`
- `.ai-factory/startup/startup-evidence.md`

### 14.4 Acceptance

验收通过条件：

- Review 无 `critical` 或 `high`。
- lint/test/build/e2e 全部通过。
- 数据库迁移通过。
- 前端 URL 可访问。
- 后端 healthcheck 可访问。
- API 文档 URL 可访问。
- 核心业务 E2E 流程通过。
- `acceptance-report.md` 写明访问地址和证据路径。

---

## 15. Profile 模板要求

### 15.1 `node-next`

生成结构：

```text
apps/
  web/
    package.json
    next.config.ts
    prisma/
      schema.prisma
      migrations/
    src/
      app/
      components/
      lib/
      modules/
      styles/
packages/
  shared/
tests/
  e2e/
docker-compose.yml
```

命令：

```yaml
install_command: npm install
lint_command: npm run lint
test_command: npm test
build_command: npm run build
e2e_command: npm run e2e
dev_command: npm run dev
frontend_port: 3000
backend_port: 3000
api_docs_path: api/docs
healthcheck_path: api/health
```

### 15.2 `python-fastapi-react`

生成结构：

```text
apps/
  backend/
    pyproject.toml
    app/
      main.py
      api/
      core/
      models/
      services/
    alembic/
  frontend/
    package.json
    src/
packages/
  shared/
tests/
  e2e/
docker-compose.yml
```

命令：

```yaml
install_command: uv sync && npm install --prefix apps/frontend
lint_command: uv run ruff check apps/backend && npm run lint --prefix apps/frontend
test_command: uv run pytest
build_command: uv run python -m compileall apps/backend/app && npm run build --prefix apps/frontend
e2e_command: npm run e2e
dev_command: docker compose up
frontend_port: 5173
backend_port: 8000
api_docs_path: docs
healthcheck_path: health
```

### 15.3 `java-spring-vue`

生成结构：

```text
apps/
  backend/
    pom.xml
    src/main/java/
    src/test/java/
    src/main/resources/db/migration/
  frontend/
    package.json
    src/
packages/
  shared/
tests/
  e2e/
docker-compose.yml
```

命令：

```yaml
install_command: npm install --prefix apps/frontend
lint_command: mvn -pl apps/backend test -DskipTests=false && npm run lint --prefix apps/frontend
test_command: mvn test
build_command: mvn package && npm run build --prefix apps/frontend
e2e_command: npm run e2e
dev_command: docker compose up
frontend_port: 5173
backend_port: 8080
api_docs_path: swagger-ui.html
healthcheck_path: actuator/health
```

---

## 16. 安全与命令执行规则

- 所有本地命令使用 `execa(file, args, { shell: false })`，除非 Profile 明确声明需要 shell。
- 命令参数必须由 parser 拆分，不能把用户输入拼接进 shell 字符串。
- 执行前记录 cwd、command、args、env 白名单。
- 默认传递环境变量白名单：`PATH`、`HOME`、`USERPROFILE`、`TEMP`、`TMP`、Profile 需要的 DB URL、AI CLI 必需变量。
- 日志写入前必须经过脱敏。
- Agent 不允许修改 `.env`，只能创建或修改 `.env.example`。
- 如果需要真实密钥，进入 `blocked` 并说明需要用户手动配置，不在日志中请求用户粘贴密钥。

---

## 17. 测试策略

### 17.1 单元测试

使用 Vitest，覆盖：

- config 合并和校验。
- Profile registry 和 selector。
- 状态机合法流转。
- task graph DAG 校验和 ready task 计算。
- error code 到 exit code 映射。
- 日志脱敏。
- file-store 原子写入。

命令：

```bash
npm test
```

### 17.2 集成测试

覆盖：

- `ai-factory create "课程预约系统" --runner mock --profile node-next --auto-approve --json`
- mock Agent 写报告后状态流转。
- 人为构造 high review issue 后回流给 owner。
- 人为构造 test failure 后进入 fixing。
- 超过重试次数后生成 blocked report。

命令：

```bash
npm run test:integration
```

### 17.3 E2E 测试

覆盖：

- CLI 从空目录生成演示项目。
- `node-next` 模板安装、构建、启动。
- Playwright 打开首页、登录页、后台页、核心业务页。
- 生成 startup evidence 和 acceptance report。

命令：

```bash
npm run test:e2e
```

### 17.4 交付前验证命令

每次阶段完成前必须运行：

```bash
npm run lint
npm test
npm run build
node dist/cli/index.js doctor --json
```

完成执行流后额外运行：

```bash
node dist/cli/index.js create "做一个课程预约系统，有学生端、教师端和后台管理" --runner mock --profile node-next --auto-approve --json
```

---

## 18. 分阶段开发任务

### Task 1: 工程初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `eslint.config.js`
- Create: `src/cli/index.ts`
- Create: `src/domain/api-response.ts`

- [ ] 创建 Node.js + TypeScript 工程。
- [ ] 配置 `npm run build` 输出到 `dist`。
- [ ] 配置 `npm test` 使用 Vitest。
- [ ] 配置 CLI 入口 `bin/ai-factory.js`。
- [ ] 验证：`npm run build` 成功，`node dist/cli/index.js --help` 输出命令帮助。

### Task 2: 配置系统

**Files:**
- Create: `src/config/schema.ts`
- Create: `src/config/default-config.ts`
- Create: `src/config/env.ts`
- Create: `src/config/config-loader.ts`
- Test: `tests/unit/config-loader.test.ts`

- [ ] 用 Zod 定义配置 schema。
- [ ] 实现 CLI/env/project/global/default 五层优先级合并。
- [ ] 实现 `AI_FACTORY_HOME` 和 `AI_FACTORY_DEFAULT_RUNNER`。
- [ ] 验证无效 YAML 返回 `CONFIG_INVALID`。
- [ ] 测试覆盖配置合并顺序。

### Task 3: Domain 类型和错误码

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

- [ ] 实现本文件第 5、10 节定义的接口。
- [ ] 实现 `FactoryErrorCode` 到退出码映射。
- [ ] 实现 `toApiResponse(error)`。
- [ ] 测试所有错误码都有退出码。

### Task 4: `.ai-factory` 文件协议

**Files:**
- Create: `src/protocol/factory-layout.ts`
- Create: `src/protocol/validators.ts`
- Create: `src/protocol/report-writer.ts`
- Create: `src/persistence/file-store.ts`
- Test: `tests/unit/file-store.test.ts`

- [ ] 实现目录初始化。
- [ ] 实现 JSON 原子写入：先写 `.tmp`，再 rename。
- [ ] 实现 status、task graph、report 的读写。
- [ ] 实现 schema 校验失败返回 `CONFIG_INVALID` 或 `TASK_GRAPH_INVALID`。
- [ ] 测试重复初始化不破坏已有文件。

### Task 5: SQLite 索引和日志

**Files:**
- Create: `src/persistence/migrations/001_init.sql`
- Create: `src/persistence/sqlite-store.ts`
- Create: `src/persistence/artifact-index.ts`
- Create: `src/logging/logger.ts`
- Create: `src/logging/redact.ts`
- Create: `src/logging/log-paths.ts`
- Test: `tests/unit/redact.test.ts`
- Test: `tests/integration/sqlite-store.test.ts`

- [ ] 创建 SQLite migration。
- [ ] 实现 projects/runs/tasks/agent_invocations/events/artifacts 写入。
- [ ] 实现 Pino JSONL logger。
- [ ] 实现日志脱敏。
- [ ] 实现命令 stdout/stderr 日志路径生成。
- [ ] 测试 API key、Bearer token、数据库密码会脱敏。

### Task 6: Profile Registry

**Files:**
- Create: `src/profiles/builtins/node-next.ts`
- Create: `src/profiles/builtins/python-fastapi-react.ts`
- Create: `src/profiles/builtins/java-spring-vue.ts`
- Create: `src/profiles/registry.ts`
- Create: `src/profiles/selector.ts`
- Create: `src/profiles/validator.ts`
- Test: `tests/unit/profile-registry.test.ts`

- [ ] 实现三个内置 Profile。
- [ ] 实现 Profile schema 校验。
- [ ] 实现基于用户需求关键词的 Profile 选择。
- [ ] 用户明确指定 Node/Python/Java 时优先匹配。
- [ ] 缺少启动、测试、构建命令时返回 `PROFILE_INVALID`。

### Task 7: CLI 基础命令

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

### Task 8: Planning Pipeline

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

### Task 9: Agent Runner

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

### Task 10: DAG Scheduler 和执行流

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

### Task 11: Review 和返工

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

### Task 12: 测试、启动和验收

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

### Task 13: `node-next` 模板

**Files:**
- Create: `src/templates/template-engine.ts`
- Create: `src/templates/profile-template.ts`
- Create directory: `src/templates/node-next/`
- Test: `tests/e2e/node-next-template.spec.ts`

- [ ] 生成 Next.js 项目骨架。
- [ ] 生成 Prisma schema 和 PostgreSQL docker-compose。
- [ ] 生成登录注册基础模块。
- [ ] 生成 OpenAPI docs 路由或 API docs 页面。
- [ ] 生成 Playwright e2e 基础测试。
- [ ] 模板不依赖 AI 时可安装、构建、启动。

### Task 14: Python 与 Java 模板骨架

**Files:**
- Create directory: `src/templates/python-fastapi-react/`
- Create directory: `src/templates/java-spring-vue/`
- Test: `tests/unit/profile-template.test.ts`

- [ ] 生成目录骨架和配置文件。
- [ ] 生成 docker-compose。
- [ ] 生成 healthcheck。
- [ ] 生成基础 README。
- [ ] Profile validate 必须通过。
- [ ] 本阶段不要求业务模块完整度超过 `node-next`。

### Task 15: 最终端到端验收

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

---

## 19. 验收定义

项目第一版完成时必须满足：

- `ai-factory create "<一句话需求>"` 可以生成完整计划。
- 用户未传 `--auto-approve` 时停在 `awaiting_user_approval`。
- 用户传 `--auto-approve` 时执行 mock 全流程。
- 至少 3 个 Agent 角色在一次 run 中协作：Planner、Dev、Review/Test。
- Task Graph 是可校验 DAG。
- Review high issue 能回流返工。
- Test failure 能回流返工。
- 重复失败能进入 `blocked` 并生成 blocked report。
- `node-next` Profile 模板可以生成可启动项目。
- 最终输出 frontend/backend/API docs URL。
- 终端输出、JSON 输出、日志、SQLite 索引中的状态一致。

---

## 20. 后续扩展顺序

1. 把 workspace 策略从独立目录扩展到 Git worktree。
2. 补齐 `python-fastapi-react` 的完整业务生成能力。
3. 补齐 `java-spring-vue` 的完整业务生成能力。
4. 增加 Claude Code、Gemini CLI、OpenAI API、Claude API Runner。
5. 增加开源项目实时调研缓存和评分数据库。
6. 增加 Web 控制台。
7. 增加 Profile 市场和模板市场。
8. 增加安全扫描、依赖扫描和性能压测。

---

## 21. 后续 AI 开发检查清单

开发任何任务前：

- [ ] 已阅读 `ai-web-project-workflow-plan.md`。
- [ ] 已阅读本文件。
- [ ] 已确认当前任务对应第 18 节的哪个 Task。
- [ ] 已确认要修改的文件路径。
- [ ] 已确认不改变 `.ai-factory` 协议。
- [ ] 已确认不绕过 `stack_profile`。

提交任务前：

- [ ] 已运行该任务要求的测试。
- [ ] 已更新或生成对应报告。
- [ ] 已检查 `--json` 输出规则。
- [ ] 已检查错误码和退出码。
- [ ] 已检查日志脱敏。
- [ ] 已检查启动证据或说明该任务不涉及启动。

