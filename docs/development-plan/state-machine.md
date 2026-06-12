# 状态机约束

## 1. 项目状态

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

## 2. 任务状态

```text
pending
  -> ready
  -> running
  -> ready_for_review
  -> reviewing
  -> changes_requested
  -> fixing
  -> ready_for_review
  -> approved
  -> integrated
  -> testing
  -> failed
  -> fixing
  -> tested
  -> accepted
```

失败超过阈值后进入：

```text
blocked
```

## 3. `status.json`

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

## 4. blocked 报告

进入 `blocked` 时必须写入：

- `.ai-factory/blocked-report.md`
- `.ai-factory/blocked-report.json`

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

