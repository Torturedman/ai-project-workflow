# 执行、调度与返工约束

## 1. Task Graph

任务图必须是 DAG，不能只是 Todo List。

```json
{
  "version": "1.0",
  "project_id": "proj_01HZX8V2Q4Z9C4X5V5Y3X3K0R1",
  "run_id": "run_01HZX8V2Q4Z9C4X5V5Y3X3K0R2",
  "tasks": [
    {
      "id": "auth-contract",
      "title": "Auth API contract",
      "owner": "architect",
      "status": "pending",
      "depends_on": [],
      "stack_profile": "node-next",
      "workspace": ".ai-factory/workspaces/architect",
      "inputs": [],
      "outputs": ["contracts/openapi.yaml"],
      "allowed_paths": [".ai-factory/contracts"],
      "verification_commands": ["ai-factory protocol validate"],
      "attempt": 0,
      "max_attempts": 5
    }
  ]
}
```

## 2. Scheduler

Scheduler 必须：

- 校验任务图无环。
- 根据 `depends_on` 计算 ready tasks。
- 按 `execution.max_parallel_agents` 并行执行。
- 任务完成后校验 `expected_outputs`。
- 任务失败后按 retry policy 回流。
- 超过重试阈值后生成 blocked report。

## 3. Workspace 策略

MVP 使用独立 workspace：

```text
<project-dir>/.ai-factory/workspaces/
  dev-backend/
  dev-frontend/
  dev-db/
  review/
  test-qa/
```

接口必须保留 Git worktree 扩展点：

```ts
export interface WorkspaceManager {
  prepare(task: TaskNode, context: AgentContext): Promise<string>;
  collectChanges(task: TaskNode, workspaceDir: string): Promise<string[]>;
  integrate(task: TaskNode, workspaceDir: string, projectDir: string): Promise<void>;
  cleanup(task: TaskNode, workspaceDir: string): Promise<void>;
}
```

## 4. Review 和返工

Review Agent 输入：

- 任务文件。
- changed files。
- 相关 contract。
- `stack-profile.json`。
- diff 或 workspace 文件列表。

判定：

- 有 `critical` 或 `high`：`approved=false`，任务回到 `changes_requested`。
- 只有 `medium` 或 `low`：MVP 可以继续，但必须记录到 `risks`。
- 无问题：任务进入 `approved`。

## 5. Issue 路由

Review issue 必须包含：

- `id`
- `severity`
- `owner`
- `task_id`
- `file`
- `problem`
- `expected_fix`

主控根据 `owner` 和 `task_id` 把问题投递给对应 Agent。修复 prompt 必须包含原任务、issue、限制路径和原报告。

