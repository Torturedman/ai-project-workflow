# 配置入口约束

## 1. 配置加载优先级

从高到低：

1. CLI flags。
2. 环境变量。
3. 项目配置：`<project-dir>/ai-factory.config.yaml`。
4. 全局配置：`~/.ai-factory/config.yaml`。
5. 内置默认配置：`src/config/default-config.ts`。

## 2. 项目配置格式

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

## 3. 环境变量

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

## 4. Profile 约束

MVP 内置 Profile 定义在 `src/profiles/builtins`：

| Profile | 状态 | 数据库 | 说明 |
|---|---|---|
| `node-next` | 必须完整实现 | PostgreSQL + Prisma | MVP 主路径，生成 Next.js 全栈应用 |
| `python-fastapi-react` | 必须完成 schema 和模板骨架，第二阶段补齐生成质量 | PostgreSQL + SQLAlchemy/Alembic | 数据工具和 API 服务 |
| `java-spring-vue` | 必须完成 schema 和模板骨架，第二阶段补齐生成质量 | MySQL + MyBatis Plus/Flyway | 企业后台 |

Profile 缺少安装、lint、test、build、e2e、dev 命令时必须返回 `PROFILE_INVALID`。

Profile 命令必须支持结构化 `cwd`：

```yaml
lint_command:
  cwd: apps/web
  command: npm run lint
```

多段命令必须使用数组，不允许把跨目录命令合并成一条 shell 字符串：

```yaml
install_commands:
  - cwd: apps/backend
    command: uv sync
  - cwd: apps/frontend
    command: npm install
```

Profile schema 的命令字段以顶层扁平字段为准：`install_command` / `install_commands`、`lint_command` / `lint_commands`、`test_command`、`build_command` / `build_commands`、`e2e_command`、`dev_command`。实现时必须归一化单数和复数字段；不得要求 `verification.*` 嵌套命令结构。

运行时和依赖版本以 [dependency-versions.md](dependency-versions.md) 为准。
