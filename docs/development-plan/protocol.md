# `.ai-factory` 文件协议

## 1. 目录布局

```text
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
  agents/
    <agent-role>/
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

## 2. 写入规则

- JSON 写入必须原子化：先写临时文件，再 rename。
- 所有 JSON 文件必须经过 Zod schema 校验。
- markdown 是人类可读说明，JSON/YAML 是机器判定依据。
- 缺失声明产物时任务失败，错误码 `TASK_OUTPUT_MISSING`。

## 3. Intake 输出

`input/initial-requirements.json`：

```json
{
  "raw_request": "做一个课程预约系统，有学生端、教师端和后台管理",
  "domain": "education_booking",
  "project_type": "fullstack_web",
  "preferred_stack": [],
  "stack_profile": "auto",
  "must_have_roles": ["student", "teacher", "admin"],
  "unknowns": ["是否需要支付", "是否需要短信通知", "是否需要移动端"],
  "defaults_applied": ["包含登录注册", "包含后台管理", "使用 Docker Compose 本地启动", "先做 MVP"]
}
```

## 4. Research 离线输出

网络不可用时必须生成离线调研说明：

```json
{
  "research_mode": "offline",
  "reason": "network unavailable or disabled",
  "candidates": [],
  "fallback": "template",
  "notes": ["未完成实时开源项目验证，按内置 Profile 模板继续"]
}
```

## 5. Judge 输出

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

## 6. Agent report.json

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

机器判定规则：

- `status` 只能是 `completed`、`failed`、`blocked`。
- `changed_files` 和 `created_files` 必须相对项目根目录。
- `verification` 至少包含一个命令。
- Agent stdout 中的自然语言不作为成功依据。
- 成功依据是进程退出码为 0、`report.json` 合法、声明产物存在、产物通过 schema 校验。

