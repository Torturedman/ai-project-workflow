# 通用 Web 项目 AI 自动研发工作流计划

## 1. 目标

建立一套通用 AI 自动研发工作流。用户只输入一句项目需求，系统先由决策 AI 理解项目、调研开源项目和成熟框架，再由多个决策 AI 互相审查并生成完整项目计划。用户确认计划后，主控系统自动分配多个开发 AI 并行工作，持续完成代码开发、审查、测试、修复、集成和本地启动。

第一版目标不是生成任意复杂系统，而是覆盖大部分通用 Web 项目：

- 管理后台
- CRM
- 预约系统
- 内容社区
- 电商系统
- SaaS 工具
- 数据看板
- 文件管理系统
- 企业内部流程系统

这套工作流本身不绑定某一种编程语言。主控系统通过 `stack_profile` 选择具体技术栈和工程模板，例如 Java / Node.js / Python / Go / .NET / PHP 等。第一版可以优先内置少量成熟 Profile，但文件协议、Agent 分工、状态机、任务图、审查和验收机制必须保持语言无关。

## 2. 核心原则

### 2.1 研发流程固定，业务项目可变

不同项目的业务不同，但研发流程应该稳定：

```text
一句话需求
  -> 项目理解
  -> 开源调研
  -> 技术路线决策
  -> 项目设计
  -> 任务拆分
  -> 用户确认
  -> 多 AI 并行开发
  -> 审查
  -> 测试
  -> 修复
  -> 集成
  -> 本地启动
  -> 自动验收
```

### 2.2 决策先于开发

AI 不能收到一句话后直接写代码。正确流程是先回答这些问题：

- 这是哪类 Web 项目？
- 是否有成熟开源项目可以复用？
- 是否有成熟框架或脚手架可以使用？
- 用户是否指定技术栈？如果没有，应该选择哪个 `stack_profile`？
- 是否应该单体、模块化单体，还是微服务？
- 哪些模块必须第一版完成？
- 哪些能力可以作为扩展点？
- 如何验证项目真的完成？

### 2.3 能复用就复用，不能复用再从零搭建

系统优先寻找成熟开源项目、框架、模板和脚手架。如果复用收益高于改造成本，则基于它继续开发。如果开源项目质量差、过重、许可证不合适或启动困难，则回退到固定工程底座从零构建。

### 2.4 Agent 短生命周期，主控长期运行

每个 AI 不需要一直在线。它可以完成一个任务后退出。主控系统保存任务状态、代码目录、报告和测试结果。需要返工时，主控重新启动同一角色的 AI，并把上下文重新投递给它。

### 2.5 所有交接都结构化

Agent 之间不直接聊天。所有交接通过主控、文件协议、Git 工作区、状态文件和报告完成。

## 3. 系统总架构

```text
User
  |
  v
Orchestrator 主控系统
  |
  +-- Intake Agent            需求接收
  +-- Planner Agent           项目理解与方案规划
  +-- Research Agent          开源项目和框架调研
  +-- Judge Agent             反向审查和技术路线裁决
  +-- Architect Agent         架构设计和接口契约
  +-- Task Graph Agent        任务图生成和任务分配
  |
  +-- Dev Agent(s)            前后端/数据库/基础设施开发
  +-- Review Agent            代码审查
  +-- Test/QA Agent           测试和端到端验收
  |
  v
Local Project Output
  |
  +-- source code
  +-- docs
  +-- tests
  +-- docker-compose.yml
  +-- local startup URL
```

## 4. 阶段划分

## 阶段 1：需求接收

用户输入一句自然语言需求，例如：

```text
做一个课程预约系统，有学生端、教师端和后台管理。
```

Intake Agent 将它转成初始需求对象：

```json
{
  "raw_request": "做一个课程预约系统，有学生端、教师端和后台管理。",
  "domain": "education_booking",
  "project_type": "fullstack_web",
  "preferred_stack": [],
  "stack_profile": "auto",
  "must_have_roles": ["student", "teacher", "admin"],
  "unknowns": [
    "是否有指定技术栈",
    "是否需要支付",
    "是否需要消息通知",
    "是否需要移动端"
  ]
}
```

如果用户要求确认前尽量少打断，系统采用默认规则自动补全：

- 默认 Web 项目包含登录注册。
- 默认包含后台管理。
- 默认数据库由 `stack_profile` 决定，优先选择 PostgreSQL 或 MySQL 这类成熟关系型数据库。
- 默认本地 Docker Compose 启动。
- 默认根据项目类型和用户偏好选择成熟 `stack_profile`。
- 默认先做 MVP，复杂功能留扩展点。

## 阶段 2：项目理解

Planner Agent 负责正向分析项目：

- 项目属于哪类业务系统。
- 用户角色有哪些。
- 核心业务流程是什么。
- 第一版必须完成哪些功能。
- 哪些功能可以暂缓。
- 适合哪种架构模式。

输出文件：

```text
planning/project-understanding.md
planning/project-understanding.json
```

示例结构：

```json
{
  "project_category": "business_management_system",
  "core_workflows": [
    "user_login",
    "resource_management",
    "booking_flow",
    "admin_review"
  ],
  "recommended_architecture": "modular_monolith",
  "recommended_stack_profile": "auto-selected",
  "mvp_scope": [
    "auth",
    "role_permission",
    "course_management",
    "booking_management",
    "admin_dashboard"
  ],
  "deferred_scope": [
    "payment",
    "sms_notification",
    "mobile_app"
  ]
}
```

## 阶段 3：开源项目和框架调研

Research Agent 负责寻找可复用基础：

- GitHub/Gitee 开源项目
- 成熟脚手架
- 后台管理框架
- 后端框架和微服务框架
- 前端管理后台模板
- 认证权限框架
- 文件上传组件
- 常见业务模块模板

调研维度：

| 维度 | 说明 |
|---|---|
| 功能匹配度 | 是否接近用户需求 |
| 技术栈匹配度 | 是否符合用户指定或系统选择的 `stack_profile` |
| 许可证 | 是否允许二次开发和商用 |
| 维护活跃度 | 最近提交、Issue、Release 是否正常 |
| 启动难度 | 本地是否容易运行 |
| 文档质量 | 是否有清晰部署和开发说明 |
| 代码质量 | 模块是否清楚，是否容易被 AI 改造 |
| 测试情况 | 是否已有测试或可补测试 |
| 复杂度 | 是否过重，是否引入不必要模块 |
| 安全风险 | 是否存在明显过时依赖或危险实现 |

输出文件：

```text
research/open-source-candidates.md
research/open-source-candidates.json
```

候选项目评分示例：

```json
{
  "candidates": [
    {
      "name": "example-admin-framework",
      "url": "https://github.com/example/example-admin-framework",
      "license": "MIT",
      "stack_profile": "node-next",
      "stack_match": 9,
      "feature_match": 7,
      "maintenance": 8,
      "startup_difficulty": 4,
      "ai_modification_suitability": 8,
      "risk_level": "medium",
      "recommendation": "template"
    }
  ]
}
```

## 阶段 4：规划、质疑和裁决

Planner Agent 和 Judge Agent 不直接自由聊天，而是进行有限轮次的结构化审查。

### 4.1 Planner Agent 职责

Planner Agent 负责提出正向方案：

- 推荐复用哪个开源项目或框架。
- 如果不复用，推荐哪套工程底座。
- 推荐架构模式。
- 推荐模块划分。
- 推荐任务拆分。
- 推荐验收方式。

### 4.2 Judge Agent 质疑职责

Judge Agent 先负责质疑方案：

- 这个开源项目是否过重？
- 许可证是否有风险？
- 是否能稳定启动？
- 是否适合 AI 继续改造？
- 服务拆分是否过度？
- 任务边界是否会导致多个 AI 冲突？
- 测试和验收是否足够具体？

### 4.3 讨论轮次

最多 3 轮。

```text
Round 1:
  Planner 提出方案
  Judge 提出问题

Round 2:
  Planner 修正方案
  Judge 复查风险

Round 3:
  Planner 给最终建议
  Judge 给裁决结果
```

如果 3 轮后仍有争议，Judge Agent 必须按固定规则裁决，避免流程卡死。

### 4.4 Judge Agent 裁决

Judge Agent 根据固定规则裁决：

优先级顺序：

1. 能稳定本地运行。
2. 许可证允许。
3. 改造成本可控。
4. 技术栈符合用户偏好。
5. 测试和验收可自动化。
6. 架构复杂度不过度。

裁决结果只能是三类之一：

```text
reuse     基于开源项目二次开发
template  使用成熟框架或脚手架搭建
scratch   使用固定工程底座从零构建
```

输出文件：

```text
decision/final-decision.md
decision/final-decision.json
```

## 5. 架构模式

## 5.1 Simple：简单单体

适合小型项目、演示系统、内部工具。

```text
spring-boot-app
frontend-app
mysql
redis optional
```

优点：

- 生成速度快。
- 启动简单。
- 测试简单。
- 适合 MVP。

缺点：

- 后期服务拆分需要重构。

## 5.2 Standard：模块化单体，默认推荐

适合大部分通用 Web 项目。

```text
backend
  auth
  user
  permission
  business
  admin
  file
  common

frontend
  pages
  components
  services
  stores
```

优点：

- 结构清楚。
- 比微服务稳定。
- 后续可拆服务。
- 适合 AI 并行开发。

缺点：

- 不是完整分布式架构。

## 5.3 Microservice：微服务模式

适合用户明确要求企业级、微服务、分布式、高并发架构时启用。

微服务模式不固定绑定某一种语言。系统根据 `stack_profile` 选择对应的服务框架、网关、服务发现、RPC/HTTP 客户端、配置中心和启动方式。

Profile 示例：

```text
java-spring-cloud:
  Spring Boot / Spring Cloud Alibaba / Nacos / Spring Cloud Gateway / OpenFeign

node-nest:
  NestJS / Fastify or Express / OpenAPI / optional message queue

python-fastapi:
  FastAPI / Uvicorn / SQLAlchemy / Alembic / optional Celery

go-gin:
  Gin or Fiber / sqlc or GORM / OpenAPI / optional gRPC

dotnet-aspire:
  ASP.NET Core / Minimal API / Aspire / Entity Framework Core
```

可选能力：

```text
Sentinel
Seata
RabbitMQ / Kafka
MinIO
Elasticsearch
SkyWalking
OpenTelemetry
Prometheus / Grafana
```

第一版不默认启用这些可选能力，除非项目明确需要。

微服务目录示例：

```text
project-root
  api-gateway
  auth-service
  user-service
  business-service
  file-service
  admin-service
  common-lib
  frontend-app
  docker-compose.yml
```

微服务模式必须先生成接口契约：

```text
contracts/openapi.yaml
contracts/service-map.md
contracts/auth-flow.md
contracts/error-codes.md
contracts/events.md
```

## 5.4 技术栈 Profile 机制

`stack_profile` 是系统实现多语言支持的核心。它把“使用什么语言和框架”从研发流程里抽离出来，变成可配置的工程能力。主控流程只依赖统一协议，不直接关心底层是 Java、Node.js、Python、Go、.NET 还是 PHP。

每个 Profile 必须定义：

- 后端语言、框架和包管理器。
- 前端框架和构建工具。
- 数据库、ORM 或迁移工具。
- 认证权限方案。
- API 文档生成方式。
- 本地启动方式。
- 静态检查、单元测试、集成测试和 E2E 测试命令。
- Dockerfile / docker-compose 模板。
- 目录结构、代码风格和 Agent 开发约束。

推荐首批 Profile：

| Profile | 后端 | 前端 | 适用场景 |
|---|---|---|---|
| `java-spring-vue` | Spring Boot / MyBatis Plus 或 JPA | Vue / Vite | 传统管理后台、企业系统 |
| `node-next` | Next.js API Routes 或 NestJS | Next.js / React | SaaS、内容系统、快速全栈产品 |
| `python-fastapi-react` | FastAPI / SQLAlchemy / Alembic | React / Vite | 数据工具、AI 辅助后台、API 服务 |
| `go-gin-react` | Gin / GORM 或 sqlc | React / Vite | 高性能 API、轻量服务 |
| `dotnet-react` | ASP.NET Core / EF Core | React / Vite | .NET 团队和企业内部系统 |
| `php-laravel-vue` | Laravel / Eloquent | Vue / Vite | 传统业务系统、内容和后台管理 |

Profile 选择规则：

```text
如果用户明确指定语言或框架：
  优先选择匹配的 stack_profile。

如果用户没有指定：
  根据项目类型、团队偏好、生态成熟度、本地启动难度和测试可自动化程度选择默认 Profile。

如果候选开源项目质量明显高于固定模板：
  可以临时采用开源项目自身的技术栈，但必须生成 stack_profile 补充说明。

如果 Profile 缺少可验证的启动和测试命令：
  不允许进入自动开发阶段。
```

Profile 输出文件：

```text
decision/stack-profile.json
decision/stack-profile.md
```

示例：

```json
{
  "id": "python-fastapi-react",
  "backend": {
    "language": "python",
    "framework": "fastapi",
    "package_manager": "uv",
    "root_dir": "apps/backend",
    "api_docs_path": "docs",
    "healthcheck_path": "health"
  },
  "frontend": {
    "language": "typescript",
    "framework": "react",
    "package_manager": "npm",
    "root_dir": "apps/frontend",
    "port": 5173
  },
  "install_commands": [
    { "cwd": "apps/backend", "command": "uv sync" },
    { "cwd": "apps/frontend", "command": "npm install" }
  ],
  "lint_commands": [
    { "cwd": "apps/backend", "command": "uv run ruff check app tests" },
    { "cwd": "apps/frontend", "command": "npm run lint" }
  ],
  "test_command": { "cwd": "apps/backend", "command": "uv run pytest" },
  "build_commands": [
    { "cwd": "apps/backend", "command": "uv run python -m compileall app" },
    { "cwd": "apps/frontend", "command": "npm run build" }
  ],
  "e2e_command": { "cwd": ".", "command": "npm run e2e" },
  "dev_command": { "cwd": ".", "command": "docker compose up" },
  "database": {
    "engine": "postgresql",
    "version": "17",
    "orm": "sqlalchemy",
    "migration_command": "uv run alembic upgrade head",
    "connection_env": "DATABASE_URL"
  },
  "container": {
    "compose_file": "docker-compose.yml",
    "up_command": "docker compose up"
  },
  "api_contract": "openapi"
}
```

## 6. 复用决策机制

系统在开发前必须判断使用哪条路线。

### 6.1 reuse：基于开源项目二次开发

适用条件：

- 开源项目与需求高度接近。
- 许可证允许。
- 本地可启动。
- 代码结构清楚。
- 改造成本低于从零开发。

执行方式：

```text
clone 开源项目
  -> 启动验证
  -> 代码结构分析
  -> 生成或补全 stack_profile
  -> 生成改造计划
  -> 分配 Agent 修改模块
  -> 测试和验收
```

### 6.2 template：基于成熟框架或脚手架

适用条件：

- 没有高度匹配的完整项目。
- 有适合的后台框架、权限框架、前端模板或微服务脚手架。
- 项目需要快速搭建规范基础。

执行方式：

```text
选择 stack_profile
  -> 初始化工程模板
  -> 添加业务模块
  -> 添加页面
  -> 添加 API
  -> 添加测试
  -> 本地启动
```

### 6.3 scratch：从固定底座构建

适用条件：

- 没有合适开源基础。
- 用户需求特殊。
- 开源项目过重或质量差。
- 需要完全控制代码结构。

执行方式：

```text
选择 stack_profile
  -> 生成固定工程底座
  -> 生成数据库模型
  -> 生成后端模块
  -> 生成前端页面
  -> 生成测试
  -> 集成启动
```

## 7. Agent 角色设计（10 个以内）

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
| Review Agent | 审查代码质量 | git diff | review-report.json |
| Test/QA Agent | 按 Profile 运行测试并执行端到端验收 | running app + code + stack-profile | test-report.json / acceptance-report.md |

## 8. 主控系统职责

Orchestrator 是唯一长期运行的核心。

职责：

- 创建项目目录。
- 维护状态机。
- 生成任务文件。
- 启动 AI CLI。
- 读取 Agent 输出。
- 管理 Git worktree 或独立 workspace。
- 调度并行任务。
- 处理任务依赖。
- 触发代码审查。
- 触发测试。
- 把失败问题重新分配给对应 Agent。
- 控制最大重试次数。
- 输出最终本地访问地址和验收报告。

## 9. Agent 通信协议

Agent 之间不直接通信。所有通信通过文件和主控完成。

推荐目录：

```text
.ai-factory
  status.json
  input
    user-request.md
  planning
    project-understanding.md
    project-understanding.json
  research
    open-source-candidates.md
    open-source-candidates.json
  decision
    final-decision.md
    final-decision.json
    stack-profile.md
    stack-profile.json
  architecture
    architecture.md
    service-map.md
    data-model.md
  contracts
    openapi.yaml
    auth-flow.md
    error-codes.md
  tasks
    task-graph.json
    task-graph.md
    task-files
      dev-backend.task.md
      dev-frontend.task.md
  agents
    intake
      status.json
      memory.md
      report.md
    planner
      status.json
      memory.md
      report.md
    dev-backend
      status.json
      memory.md
      report.md
    dev-frontend
      status.json
      memory.md
      report.md
    review
      status.json
      memory.md
      report.md
    test-qa
      status.json
      memory.md
      report.md
  reviews
    review-report.json
  tests
    test-report.json
    e2e-report.md
  startup
    startup-evidence.json
    startup-evidence.md
  acceptance
    acceptance-report.json
    acceptance-report.md
  blocked-report.json
  blocked-report.md
  logs
    orchestrator.log
```

## 10. 状态机

每个任务都有状态。

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

项目整体状态：

```text
intake
  -> planning
  -> researching
  -> deciding
  -> awaiting_user_approval
  -> executing
  -> integrating
  -> testing
  -> fixing
  -> accepting
  -> completed
```

如果失败超过阈值：

```text
blocked
```

进入 blocked 时必须输出：

- 阻塞原因。
- 已尝试的修复。
- 当前失败日志。
- 建议人工处理点。

## 11. 任务图

任务图不能只是 Todo List，必须是 DAG。

示例：

```json
 {
  "tasks": [
    {
      "id": "auth-contract",
      "owner": "architect",
      "depends_on": [],
      "stack_profile": "node-next",
      "outputs": ["contracts/openapi.yaml"]
    },
    {
      "id": "db-schema",
      "owner": "dev-db",
      "depends_on": ["auth-contract"],
      "stack_profile": "node-next",
      "outputs": ["apps/backend/db/migrations"]
    },
    {
      "id": "auth-api",
      "owner": "dev-backend",
      "depends_on": ["db-schema"],
      "stack_profile": "node-next",
      "outputs": ["apps/backend/src/modules/auth"]
    },
    {
      "id": "login-page",
      "owner": "dev-frontend",
      "depends_on": ["auth-contract"],
      "stack_profile": "node-next",
      "outputs": ["apps/frontend/src/pages/Login.tsx"]
    },
    {
      "id": "auth-e2e",
      "owner": "test-qa",
      "depends_on": ["auth-api", "login-page"],
      "stack_profile": "node-next",
      "outputs": ["tests/e2e/auth.spec.ts"]
    }
  ]
}
```

主控根据依赖关系并行启动任务。

## 12. 工作区策略

### 12.1 独立 workspace

第一版可以使用独立目录：

```text
workspaces
  dev-backend
  dev-frontend
  dev-db
  review
  test-qa
```

优点：

- 实现简单。
- 不依赖复杂 Git 操作。
- 适合原型验证。

缺点：

- 合并成本较高。

### 12.2 Git worktree

成熟版本使用 Git worktree：

```text
project
  main
  worktrees
    backend-user
    frontend-admin
    test-auth
```

优点：

- 变更可追踪。
- 合并更清楚。
- 方便审查和回滚。

缺点：

- 主控需要处理分支和冲突。

建议：

- MVP 使用独立 workspace。
- 第二阶段升级为 Git worktree。

## 13. 审查和返工机制

当开发 Agent 完成任务后，它退出。主控检测到状态为 `ready_for_review`，启动 Review Agent。

Review Agent 输出结构化报告：

```json
{
  "approved": false,
  "issues": [
    {
      "id": "R001",
      "severity": "high",
      "owner": "dev-frontend",
      "file": "frontend/src/pages/Login.vue",
      "problem": "登录失败时没有显示后端错误信息",
      "expected_fix": "在表单区域展示后端返回的错误消息"
    }
  ]
}
```

主控根据 `owner` 重新启动对应 Agent：

```text
你是 dev-frontend。
你的原始任务在 tasks/login-page.task.md。
你之前的代码在当前 workspace。
审查发现以下问题：R001。
请只修复这些问题，不要重构无关代码。
修复后更新 agents/dev-frontend/report.md。
```

这样即使开发 AI 已停止，也可以继续完成返工。

## 14. 测试和验收机制

测试分四层。

Test/QA Agent 负责静态检查、单元测试、集成测试和 E2E 验收。

### 14.1 静态检查

- 后端按 `stack_profile` 执行编译、类型检查或语法检查。
- 前端按 `stack_profile` 执行 TypeScript / lint / build 检查。
- 格式检查。
- 依赖安全基础扫描。

### 14.2 单元测试

- Service 层测试。
- 工具函数测试。
- 权限判断测试。

### 14.3 集成测试

- API 测试。
- 数据库读写测试。
- 认证流程测试。
- 文件上传测试。

### 14.4 E2E 验收

使用浏览器自动化测试核心路径：

- 打开首页。
- 注册或登录。
- 完成核心业务流程。
- 后台管理能查看数据。
- 页面没有明显报错。

验收报告：

```text
acceptance/acceptance-report.md
```

验收通过条件：

- 后端服务启动成功。
- 前端服务启动成功。
- 数据库启动成功。
- 核心 API 测试通过。
- 核心 E2E 测试通过。
- Review Agent 没有 critical 或 high severity 问题。
- 本地访问地址可打开。

## 15. 自动决策规则

为了实现用户确认后系统一直运转，必须提前定义默认决策。

```text
如果需求有歧义：
  按通用 Web 项目默认实践决策。

如果功能过多：
  先做 MVP，其他进入 deferred scope。

如果开源项目无法启动：
  放弃 reuse，转 template 或 scratch。

如果依赖版本冲突：
  优先选择当前 LTS 或生态稳定版本。

如果用户没有指定技术栈：
  根据项目类型、成熟模板、启动难度和测试可自动化程度选择 stack_profile。

如果用户指定的技术栈缺少可用 Profile：
  生成 Profile 缺口说明，并建议使用相邻成熟 Profile 或进入 blocked 等待人工补充。

如果微服务复杂度过高：
  降级为模块化单体，除非用户明确要求微服务。

如果测试失败：
  自动回流给对应 Agent，最多 5 轮。

如果同一问题重复失败 3 次：
  升级给 Judge Agent 重新判断方案。

如果仍无法解决：
  标记 blocked，生成阻塞报告。
```

## 16. 用户参与点

第一版建议只有两个用户参与点。

### 16.1 输入需求

用户只输入一句或一段需求。

### 16.2 确认计划

系统展示完整计划：

- 项目理解。
- 是否复用开源项目。
- 技术路线。
- 架构模式。
- 模块拆分。
- Agent 分工。
- 任务依赖图。
- 验收标准。
- 风险说明。

用户确认后，系统自动执行。

执行过程中默认不再询问用户，除非进入 blocked。

## 17. MVP 范围

第一版先做一个本地 CLI 编排器，不做复杂 UI。

### 17.1 MVP 输入

```bash
ai-factory create "做一个课程预约系统，有学生端、教师端和后台管理"
```

用户也可以显式指定技术栈：

```bash
ai-factory create "用 Python FastAPI 和 React 做一个课程预约系统，有学生端、教师端和后台管理"
```

### 17.2 MVP 输出

```text
generated-project
  apps
    backend
    frontend
  docker-compose.yml
  README.md
  .ai-factory
```

最后输出：

```text
项目已启动：
前端：http://localhost:<frontend_port>
后端：http://localhost:<backend_port>
API 文档：http://localhost:<backend_port>/<api_docs_path>
验收报告：.ai-factory/acceptance/acceptance-report.md
```

### 17.3 MVP 支持能力

- 一句话输入。
- 需求分析。
- 开源调研报告。
- Planner/Judge 决策。
- 自动选择或识别 `stack_profile`。
- 生成计划并等待用户确认。
- 基于受支持 Profile 生成全栈 Web 项目。
- 自动调用多个 AI CLI。
- 自动审查。
- 自动测试。
- 自动修复。
- Docker Compose 本地启动。

### 17.4 MVP 暂不支持

- Kubernetes 部署。
- 多环境发布。
- 复杂支付。
- 高并发压测。
- 分布式事务强一致性。
- 生产级安全合规审计。
- 任意语言任意框架的无限制覆盖。
- 缺少 Profile 的冷门框架自动生成。

## 18. 推荐技术实现

### 18.1 主控语言

推荐优先级：

1. Node.js / TypeScript
2. Python
3. Java

理由：

- Node.js 适合调用 CLI、处理 JSON、管理子进程和前端生态。
- Python 适合快速原型和脚本编排。
- Java 适合工程化，但写编排器成本更高。

建议 MVP 用 TypeScript。

### 18.2 AI CLI 适配层

不要把主控绑定到某一个 AI 工具。设计统一接口：

```text
AgentRunner
  run(task, workspace, context) -> AgentResult
```

适配：

- Codex CLI
- Claude Code
- Gemini CLI
- OpenAI API
- Claude API

第一版可以只接一个 CLI，但接口要能扩展到多个。

### 18.3 配置文件

```yaml
default_profile: node-next
default_runner: codex-cli
architecture_mode: standard

supported_profiles:
  - node-next
  - python-fastapi-react
  - java-spring-vue

execution:
  max_parallel_agents: 3
  agent_timeout_seconds: 1800
  command_timeout_seconds: 900

retry:
  max_fix_rounds: 5
  max_same_issue_rounds: 3

approval:
  require_user_approval_before_execution: true
```

项目配置只声明启用哪些 Profile。完整 `stack_profile` 字段、命令结构和依赖版本由内置 Profile 与开发约束文档统一定义，不能在项目配置中维护另一套命令 schema。

## 19. 第一阶段开发计划

### 19.1 第 1 步：文件协议和状态机

完成：

- `.ai-factory` 目录规范。
- `status.json` 格式。
- `task-graph.json` 格式。
- `review-report.json` 格式。
- `test-report.json` 格式。

验收：

- 可以用假数据跑完整状态流转。

### 19.2 第 2 步：主控 CLI 原型

完成：

- `ai-factory create "<需求>"`
- 解析用户显式指定的语言、框架和数据库偏好。
- 创建工作目录。
- 生成初始需求文件。
- 调用 Planner/Judge。
- 生成或选择 `stack-profile.json`。
- 输出计划。
- 等待用户确认。

验收：

- 输入一句话后能生成完整计划文件。

### 19.3 第 3 步：Agent Runner

完成：

- 封装 AI CLI 调用。
- 支持传入任务文件。
- 支持指定 workspace。
- 支持读取退出码、日志和报告。

验收：

- 能启动一个开发 Agent 完成简单文件生成任务。

### 19.4 第 4 步：技术栈 Profile 模板

完成：

- `node-next` 全栈模板。
- `java-spring-vue` 全栈模板。
- `python-fastapi-react` 全栈模板。
- 每个 Profile 的数据库配置和迁移方案。
- Docker Compose。
- 登录注册基础模块。
- 每个 Profile 的启动、测试、lint 命令。

验收：

- 不依赖 AI 时，每个内置 Profile 模板本身可以启动并通过基础测试。

### 19.5 第 5 步：任务图并行执行

完成：

- 根据 `task-graph.json` 找出可运行任务。
- 将 `stack-profile.json` 注入每个 Agent 的任务上下文。
- 要求 Agent 只能使用 Profile 声明的包管理器、目录结构和验证命令。
- 并行启动多个 Agent。
- 保存每个 Agent 报告。
- 任务失败后进入重试。

验收：

- 至少两个 Agent 可以并行完成不同模块。

### 19.6 第 6 步：审查和返工循环

完成：

- Review Agent 审查 git diff 或 workspace diff。
- 输出结构化问题。
- 主控把问题重新投递给对应 Agent。

验收：

- 人为制造一个缺陷，系统能让对应 Agent 修复。

### 19.7 第 7 步：测试和本地启动

完成：

- 将 Profile 的单数/复数命令字段归一化为命令组。
- 执行 Profile 的 `lint_command` 或 `lint_commands`。
- 执行 Profile 的 `test_command`。
- 执行 Profile 的 `build_command` 或 `build_commands`。
- 执行 Profile 的 `e2e_command`。
- 使用 Profile 的 `dev_command` 或 Docker Compose 启动。
- 输出 Profile 声明的 localhost 地址和 API 文档地址。

验收：

- 生成项目可以自动启动并通过核心验收。

## 20. 风险和应对

| 风险 | 表现 | 应对 |
|---|---|---|
| 开源项目质量差 | 启动失败、依赖过时 | 先启动验证，失败后转 template |
| Agent 并行冲突 | 多个 AI 改同一文件 | 任务图限制文件所有权 |
| 接口不一致 | 前后端字段对不上 | 先生成 OpenAPI 契约 |
| AI 无限返工 | 同一问题反复失败 | 设置最大修复轮数 |
| 微服务过度复杂 | 本地难以启动 | 默认模块化单体 |
| 测试覆盖不足 | 看似完成但无法使用 | 验收标准前置生成 |
| 用户需求过大 | 一次做不完 | 自动收敛 MVP |
| CLI 输出不稳定 | 主控难解析 | 要求 Agent 必须写结构化报告 |
| Profile 不完整 | Agent 不知道如何启动、测试或生成代码 | 缺少启动/测试/目录/包管理器定义时禁止执行 |
| AI 自行更换技术栈 | 代码和模板不一致 | 任务上下文强制注入 `stack-profile.json`，Review Agent 检查偏离 |

## 21. 成功标准

第一版成功标准：

- 用户输入一句通用 Web 项目需求。
- 系统自动生成项目计划。
- 系统能识别用户指定技术栈，或自动选择合适的 `stack_profile`。
- 系统能说明是否复用开源项目或从零构建。
- 系统能输出 `stack-profile.json`，并用其中的命令完成启动、测试和验收。
- 用户确认后，至少 3 个 Agent 实例可以协同完成项目。
- 项目能本地启动。
- 核心业务流程能通过自动验收。
- 失败能自动回流修复。
- 最终输出本地访问地址和验收报告。

## 22. 建议的第一版演示项目

为了验证系统，不建议第一版直接挑战大型社区或商城。建议选择中等复杂度项目：

```text
课程预约系统
```

原因：

- 有多角色：学生、教师、管理员。
- 有权限：不同角色看到不同页面。
- 有典型 CRUD：课程、预约、用户。
- 有核心流程：学生预约课程。
- 有后台管理。
- 不涉及复杂支付或高并发。
- 很适合验证全栈生成、测试和验收。

## 23. 后续扩展

当 MVP 跑通后，再扩展：

- Web 控制台。
- 项目模板市场。
- 技术栈 Profile 市场。
- 更多语言和框架 Profile。
- 开源项目缓存和评分库。
- 多模型投票。
- 更复杂的微服务模板。
- Kubernetes 部署。
- 自动生成产品原型图。
- 自动压测。
- 自动安全扫描。
- 自动生成使用文档。
- 多项目持续维护。

## 24. 最终形态

最终系统应该像一个本地 AI 软件工厂：

```text
用户提出目标
  -> 决策 AI 理解业务
  -> 调研 AI 寻找可复用基础
  -> 主控选择或生成技术栈 Profile
  -> 决策 AI 互相审查
  -> 裁决 AI 锁定路线
  -> 主控生成任务图
  -> 多个开发 AI 并行工作
  -> 审查 AI 发现问题
  -> 测试 AI 验证结果
  -> 主控自动返工
  -> 本地服务启动
  -> 交付可运行项目
```

这套工作流的关键价值不是单次代码生成，而是把项目从想法到可运行系统的过程标准化、自动化、可审查、可复用。
