# Profile 模板约束

具体依赖版本和命令工作目录以 [dependency-versions.md](dependency-versions.md) 为准。本文只描述模板结构和 Profile 级命令入口。

## 1. `node-next`

生成结构：

```text
apps/
  web/
    package.json
    next.config.ts
    prisma/
      schema.prisma
      migrations/
    src/
      app/
      components/
      lib/
      modules/
      styles/
packages/
  shared/
tests/
  e2e/
docker-compose.yml
```

命令：

```yaml
install_command:
  cwd: apps/web
  command: npm install
lint_command:
  cwd: apps/web
  command: npm run lint
test_command:
  cwd: apps/web
  command: npm test
build_command:
  cwd: apps/web
  command: npm run build
e2e_command:
  cwd: .
  command: npm run e2e
dev_command:
  cwd: apps/web
  command: npm run dev
frontend_port: 3000
backend_port: 3000
api_docs_path: api/docs
healthcheck_path: api/health
```

## 2. `python-fastapi-react`

生成结构：

```text
apps/
  backend/
    pyproject.toml
    app/
      main.py
      api/
      core/
      models/
      services/
    alembic/
  frontend/
    package.json
    src/
packages/
  shared/
tests/
  e2e/
docker-compose.yml
```

命令：

```yaml
install_commands:
  - cwd: apps/backend
    command: uv sync
  - cwd: apps/frontend
    command: npm install
lint_commands:
  - cwd: apps/backend
    command: uv run ruff check app tests
  - cwd: apps/frontend
    command: npm run lint
test_command:
  cwd: apps/backend
  command: uv run pytest
build_commands:
  - cwd: apps/backend
    command: uv run python -m compileall app
  - cwd: apps/frontend
    command: npm run build
e2e_command:
  cwd: .
  command: npm run e2e
dev_command:
  cwd: .
  command: docker compose up
frontend_port: 5173
backend_port: 8000
api_docs_path: docs
healthcheck_path: health
```

## 3. `java-spring-vue`

生成结构：

```text
apps/
  backend/
    pom.xml
    src/main/java/
    src/test/java/
    src/main/resources/db/migration/
  frontend/
    package.json
    src/
packages/
  shared/
tests/
  e2e/
docker-compose.yml
```

命令：

```yaml
install_command:
  cwd: apps/frontend
  command: npm install
lint_commands:
  - cwd: apps/backend
    command: mvn test
  - cwd: apps/frontend
    command: npm run lint
test_command:
  cwd: apps/backend
  command: mvn test
build_commands:
  - cwd: apps/backend
    command: mvn package
  - cwd: apps/frontend
    command: npm run build
e2e_command:
  cwd: .
  command: npm run e2e
dev_command:
  cwd: .
  command: docker compose up
frontend_port: 5173
backend_port: 8080
api_docs_path: swagger-ui.html
healthcheck_path: actuator/health
```

## 4. 模板共同要求

- 必须生成 `.env.example`，不能生成真实 `.env`。
- 必须包含 healthcheck。
- 必须包含基础 README。
- 必须包含 Docker Compose。
- 必须能通过 Profile validate。
- `node-next` 是 MVP 主路径，必须可安装、构建、启动。
- 每条命令必须声明 `cwd`，禁止依赖调用方猜测工作目录。
- Profile schema 以本文的顶层扁平命令字段为准。实现时必须把 `install_command` / `install_commands`、`lint_command` / `lint_commands`、`build_command` / `build_commands` 归一化为命令数组；不使用 `verification.*` 嵌套命令结构。
- `database.seed_command` 和 `container.down_command` 是可选字段，缺失时不得返回 `PROFILE_INVALID`。
