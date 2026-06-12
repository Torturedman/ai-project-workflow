# 错误处理和重试约束

## 1. FactoryError

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

## 2. 错误码

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

## 3. 重试规则

- `AGENT_COMMAND_FAILED`：同一 invocation 最多重试 2 次。
- `AGENT_REPORT_MISSING`：重新投递同一任务 1 次，仍缺失则 `changes_requested`。
- `REVIEW_HIGH_ISSUES`：回流给 issue owner，项目状态进入 `fixing`。
- `TEST_FAILED`：根据失败命令和文件路径路由到对应 task owner，最多 5 轮。
- 同一 `ReviewIssue.problem` 或同一测试签名重复失败 3 次，升级给 Judge Agent 重新裁决。
- 超过 `retry.max_fix_rounds` 后进入 `blocked`，必须生成 blocked 报告。

## 4. 退出码映射

| 错误类型 | 退出码 |
|---|---:|
| 参数、配置、Profile 校验失败 | `1` |
| 用户取消或未确认计划 | `2` |
| 规划/调研/裁决阶段 blocked | `3` |
| Agent Runner 执行失败 | `4` |
| lint/test/build/e2e 失败 | `5` |
| 本地启动或健康检查失败 | `6` |
| 内部错误 | `7` |

