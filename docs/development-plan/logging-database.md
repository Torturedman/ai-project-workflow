# 数据库、日志与审计约束

## 1. 存储策略

- 项目级权威状态：`<project-dir>/.ai-factory/**/*.json|md|yaml`。
- 全局索引数据库：`<repo-root>/resources/database/ai-factory.db`，SQLite。
- 仓库根目录 `resources/` 是资源类文件统一入口，但不得直接存放文件；数据库、全局日志、全局配置等资源必须进入分类子目录。
- SQLite 用途：列出历史项目、查询运行记录、查询 Agent 调用和日志索引。
- SQLite 不保存秘密内容，不保存完整 prompt 正文，只保存文件路径和摘要。
- SQLite 缺失或损坏时，`ai-factory doctor --rebuild-index` 必须能扫描项目目录重建。

## 2. SQLite DDL

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
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (run_id) REFERENCES runs(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
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

## 3. 日志路径

```text
<repo-root>/resources/
  database/
    ai-factory.db
  logs/
    ai-factory-global.jsonl
  global/
    config.yaml

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

## 4. JSONL 日志字段

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

## 5. 留存和脱敏

- 项目日志默认随项目永久保留。
- 全局日志默认保留 30 天。
- 单个日志文件超过 50 MB 时滚动，命名为 `<name>.1.jsonl`。
- JSONL 日志写入前必须同时脱敏 `message` 文本和结构化 `data`。
- 脱敏规则必须覆盖：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、JWT、Bearer token、数据库 URL 密码、AWS/GitHub token 常见格式。
- `report.md` 可以保留错误摘要，不允许写入完整密钥、完整 Cookie、完整 Authorization header。

## 6. 生成项目数据库

每个 Profile 必须声明生成项目数据库：

- `node-next`：PostgreSQL 16、Prisma、迁移命令 `npx prisma migrate deploy`、开发命令 `npx prisma migrate dev`。
- `python-fastapi-react`：PostgreSQL 16、SQLAlchemy、Alembic、迁移命令 `alembic upgrade head`。
- `java-spring-vue`：MySQL 8.4 LTS、MyBatis Plus、Flyway、迁移命令在 `apps/backend` cwd 下执行 `mvn flyway:migrate`。如果模板生成 Maven 聚合根 `pom.xml`，才允许使用 `mvn -pl apps/backend ...`。

生成项目的业务数据库 schema 由 Architect Agent 写入 `.ai-factory/architecture/data-model.md`，再由 Dev DB task 生成实际 migration。
