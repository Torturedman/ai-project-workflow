# Task 5 优先修复清单

本清单只覆盖 `Task 5: SQLite 索引和日志` 的遗留问题。Task 6 及之后的内容不在本次范围内。

## 必须优先处理

- [x] 让构建后的程序能够读取 `001_init.sql`。
  - 证据：`src/persistence/sqlite-store.ts` 在运行时通过 `join(import.meta.dirname, "migrations", fileName)` 读取 migration。
  - 修复：`npm run build` 现在会执行 `scripts/copy-build-assets.mjs`，把已知 migration 复制到 `dist/persistence/migrations/`。
  - 影响：发布版或 `dist` 运行方式下，SQLite 初始化会直接失败。
  - 验证：`npm test -- tests/integration/build-artifacts.test.ts`、`npm run build`。

- [x] 打开 SQLite 连接时启用外键约束。
  - 证据：`src/persistence/sqlite-store.ts` 的 `SqliteStore.open()` 只创建数据库并执行 migration，没有开启 `PRAGMA foreign_keys = ON`。
  - 修复：打开连接后显式执行 `PRAGMA foreign_keys = ON`，并给 `events.project_id/run_id/task_id` 补外键约束。
  - 影响：`runs`、`tasks`、`events`、`artifacts` 可能写入孤儿记录，索引完整性会失真。
  - 验证：`npm test -- tests/integration/sqlite-store.test.ts`。

- [x] 日志脱敏要覆盖 `message` 文本，而不只是结构化 `data`。
  - 证据：`src/logging/logger.ts` 里 `createJsonlLogger()` 只对 `data` 调用 `redactValue()`，`message` 原样写入。
  - 修复：`createJsonlLogger()` 写入 `info/warn/error` 时对 `message` 调用 `redactText()`。
  - 影响：如果调用方把 token、Cookie、Authorization、密码写进消息文本，会直接泄露到 JSONL 日志。
  - 验证：`npm test -- tests/unit/redact.test.ts`。

## 已通过核对

- `resources/` 已按 `database/`、`global/`、`logs/` 分类，不存在根目录直放文件。
- `redactText()` 和 `redactValue()` 已覆盖常见 API key、Bearer token、数据库密码、Cookie、Authorization。
- 当前 `npm run lint`、`npm test`、`npm run build`、`node dist/cli/index.js --help` 已重新完整验收通过。

## 暂不纳入本次清单

- `doctor --json`、`profiles` CLI 功能，属于 Task 7。
- Profile Registry、模板版本矩阵、启动与验收流程，属于 Task 6 及之后。
