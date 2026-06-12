# 项目结构约束

## 1. 仓库结构

```text
ai-project-workflow/
  README.md
  ai-web-project-workflow-plan.md
  ai-web-project-workflow-development-plan.md
  docs/
    development-plan/
  package.json
  package-lock.json
  tsconfig.json
  vitest.config.ts
  playwright.config.ts
  eslint.config.js
  .gitignore
  bin/
    ai-factory.js
  src/
    cli/
      index.ts
      commands/
        create.ts
        plan.ts
        run.ts
        resume.ts
        status.ts
        logs.ts
        doctor.ts
        profiles.ts
    config/
      config-loader.ts
      default-config.ts
      env.ts
      schema.ts
    domain/
      agent.ts
      api-response.ts
      artifacts.ts
      errors.ts
      project.ts
      profile.ts
      review.ts
      startup.ts
      state-machine.ts
      task-graph.ts
      test-report.ts
    persistence/
      file-store.ts
      sqlite-store.ts
      artifact-index.ts
      migrations/
        001_init.sql
    logging/
      logger.ts
      redact.ts
      log-paths.ts
    profiles/
      registry.ts
      selector.ts
      validator.ts
      builtins/
        node-next.ts
        python-fastapi-react.ts
        java-spring-vue.ts
    protocol/
      factory-layout.ts
      report-writer.ts
      schemas.ts
      validators.ts
    agents/
      prompts/
        intake.md
        planner.md
        research.md
        judge.md
        architect.md
        task-graph.md
        dev.md
        review.md
        test-qa.md
      context-builder.ts
      agent-orchestrator.ts
    runners/
      agent-runner.ts
      mock-runner.ts
      codex-cli-runner.ts
      process-runner.ts
    planning/
      intake-service.ts
      planner-service.ts
      research-service.ts
      judge-service.ts
      architect-service.ts
      task-graph-service.ts
    execution/
      scheduler.ts
      workspace-manager.ts
      task-executor.ts
      retry-policy.ts
      integration-manager.ts
    review/
      review-service.ts
      issue-router.ts
    testing/
      command-suite.ts
      startup-verifier.ts
      acceptance-service.ts
      port-utils.ts
    templates/
      template-engine.ts
      profile-template.ts
      node-next/
      python-fastapi-react/
      java-spring-vue/
    utils/
      fs.ts
      json.ts
      time.ts
      ids.ts
      hash.ts
  tests/
    unit/
    integration/
    fixtures/
    e2e/
```

## 2. 目录职责

| 目录 | 职责 |
|---|---|
| `src/cli` | CLI 参数解析、命令注册、输出规则、退出码映射 |
| `src/config` | 全局配置、项目配置、环境变量、优先级合并、Zod 校验 |
| `src/domain` | 纯类型、枚举、接口、错误码、状态机定义 |
| `src/persistence` | `.ai-factory` 文件读写、SQLite 索引、artifact 哈希 |
| `src/logging` | Pino logger、JSONL 日志、脱敏、日志路径 |
| `src/profiles` | 内置 Profile、Profile 选择、Profile 验证 |
| `src/protocol` | `.ai-factory` 布局、报告写入、schema 校验 |
| `src/agents` | Agent prompt、上下文构造、角色输入输出约束 |
| `src/runners` | AI CLI/API 适配层、进程执行、mock runner |
| `src/planning` | Intake/Planner/Research/Judge/Architect/Task Graph 阶段编排 |
| `src/execution` | DAG 调度、workspace 管理、任务执行、重试、集成 |
| `src/review` | Review Agent 调度、问题归属、返工投递 |
| `src/testing` | lint/test/build/e2e/start 命令执行、端口与 HTTP 检查、验收报告 |
| `src/templates` | 生成项目工程模板 |

## 3. 生成项目结构

```text
generated-project/
  README.md
  docker-compose.yml
  .env.example
  .gitignore
  apps/
    backend/
    frontend/
  packages/
    shared/
  tests/
    e2e/
  .ai-factory/
    status.json
    input/
    planning/
    research/
    decision/
    architecture/
    contracts/
    tasks/
    agents/
    reviews/
    tests/
    startup/
    acceptance/
    logs/
```

不同 Profile 可以改变 `apps/backend` 和 `apps/frontend` 内部结构，但不得改变 `.ai-factory` 协议目录。

