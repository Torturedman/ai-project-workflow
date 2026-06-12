# Agent 与 Runner 约束

## 1. Agent 角色

| Agent | 职责 | 主要输入 | 主要输出 |
|---|---|---|---|
| Orchestrator | 长期运行的主控，维护状态机并调度所有角色 | user request + project state | project output + logs |
| Intake Agent | 解析一句话需求并补全基础信息 | raw_request | initial-requirements.json |
| Planner Agent | 收敛项目理解、MVP 范围和架构倾向 | initial-requirements.json | project-understanding.md |
| Research Agent | 调研开源项目和框架 | project-understanding.md | open-source-candidates.md |
| Judge Agent | 审查规划和调研结果，并裁决技术路线 | planning + research | critique-report.md / final-decision.md |
| Architect Agent | 生成架构设计、契约、数据模型和 Profile 约束 | final-decision.md + stack-profile | architecture.md / contracts |
| Task Graph Agent | 生成任务依赖图和 worker 分配 | architecture.md | task-graph.json |
| Dev Agent | 按 Profile 开发后端、前端、数据库和基础设施模块 | assigned task + stack-profile | code + report |
| Review Agent | 审查代码质量 | git diff 或 workspace diff | review-report.json |
| Test/QA Agent | 运行测试并执行端到端验收 | running app + code + stack-profile | test-report.json / acceptance-report.md |

## 2. Agent Runner

统一接口：

```ts
export interface AgentRunner {
  id: string;
  run(task: AgentTask, context: AgentContext): Promise<AgentResult>;
}
```

MVP 必须实现：

- `mock-runner`：不调用外部 AI，用于测试状态机、DAG、报告和验收链路。
- `codex-cli-runner`：通过 `AI_FACTORY_CODEX_BIN` 调用 Codex CLI。
- `process-runner`：封装通用子进程执行、超时、stdout/stderr 捕获。

## 3. Agent 输入必须包含

- 当前角色和职责。
- 任务文件路径。
- 允许修改的路径。
- 必须读取的上下文文件。
- `stack-profile.json`。
- 必须生成的输出文件。
- 禁止事项。
- 报告格式。

Dev Agent prompt 必须包含：

```text
你只能修改 allowed_paths 中列出的文件或目录。
你必须使用 stack-profile.json 中声明的语言、框架、包管理器、数据库、目录和命令。
你不能自行更换技术栈。
完成后必须写入 report.json 和 report.md。
report.json 必须包含 changed_files、verification、risks、next_actions。
```

## 4. Runner 成功判定

Agent 成功必须同时满足：

- 子进程退出码为 0。
- `report.json` 存在且 schema 合法。
- `report.md` 存在。
- `expected_outputs` 全部存在。
- `changed_files` 不越过 `allowed_paths`。

缺少任一项时任务失败。

