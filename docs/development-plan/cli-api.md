# CLI 与返回规则

## 1. 命令列表

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

## 2. 命令职责

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

## 3. 默认人类输出

- stdout 输出简洁状态、下一步和关键文件路径。
- stderr 输出进度、警告和非结构化诊断。
- 成功时最后必须打印生成项目目录、前端地址、后端地址、API 文档地址、验收报告路径。

## 4. `--json` 输出

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

## 5. 退出码

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

