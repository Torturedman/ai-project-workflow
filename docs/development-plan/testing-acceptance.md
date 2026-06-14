# 测试、启动与验收约束

当任务涉及测试、启动、验收、报告或质量门禁时，先读取本文件。

## 1. 测试命令顺序

Test/QA Agent 必须按 Profile 顺序执行：

1. `install_command`
2. `lint_command`
3. `test_command`
4. `build_command`
5. `e2e_command`

所有命令必须写入 `.ai-factory/tests/test-report.json`，并保存 stdout/stderr 原始日志。

Profile 命令必须读取结构化 `cwd`，不能在测试模块中自行拼接 `--prefix` 或猜测目录。依赖和运行时版本以 [dependency-versions.md](dependency-versions.md) 为准。

## 2. Test Report

```ts
export interface CommandEvidence {
  name: string;
  command: string;
  cwd: string;
  status: "passed" | "failed" | "skipped";
  exit_code: number;
  started_at: string;
  ended_at: string;
  stdout_log: string;
  stderr_log: string;
}

export interface TestReport {
  version: "1.0";
  run_id: string;
  status: "passed" | "failed" | "skipped";
  commands: CommandEvidence[];
  failures: FactoryError[];
}
```

## 3. 启动验证流程

Startup Verifier 必须执行：

1. 检查 Profile 声明端口是否可用。
2. 执行 Profile `dev_command` 或 `container.up_command`。
3. 等待服务启动。
4. 请求 frontend URL。
5. 请求 backend healthcheck URL。
6. 请求 API docs URL。
7. 保存日志尾部和进程/container 信息。

启动证据文件：

- `.ai-factory/startup/startup-evidence.json`
- `.ai-factory/startup/startup-evidence.md`

## 4. Startup Evidence

```ts
export interface StartupEvidence {
  version: "1.0";
  run_id: string;
  status: "passed" | "failed" | "skipped";
  started_at: string;
  services: Array<{
    name: string;
    url: string;
    port: number;
    healthcheck_url?: string;
    status: "passed" | "failed" | "skipped";
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

## 5. 验收通过条件

验收通过必须同时满足：

- Review 无 `critical` 或 `high`。
- lint/test/build/e2e 全部通过。
- 数据库迁移通过。
- 前端 URL 可访问。
- 后端 healthcheck 可访问。
- API 文档 URL 可访问。
- 核心业务 E2E 流程通过。
- `acceptance-report.md` 写明访问地址和证据路径。

## 6. 交付前验证命令

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

## 7. 测试失败处理

- `lint_command`、`test_command`、`build_command`、`e2e_command` 任一失败，错误码为 `TEST_FAILED`。
- 测试失败必须包含失败命令、退出码、stdout/stderr 日志路径。
- 主控根据失败命令和文件路径路由到对应 task owner。
- 同一测试签名重复失败 3 次，升级给 Judge Agent 重新裁决。
- 超过 `retry.max_fix_rounds` 后进入 `blocked`。
