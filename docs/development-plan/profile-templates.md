# Profile 模板约束

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
install_command: npm install
lint_command: npm run lint
test_command: npm test
build_command: npm run build
e2e_command: npm run e2e
dev_command: npm run dev
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
install_command: uv sync && npm install --prefix apps/frontend
lint_command: uv run ruff check apps/backend && npm run lint --prefix apps/frontend
test_command: uv run pytest
build_command: uv run python -m compileall apps/backend/app && npm run build --prefix apps/frontend
e2e_command: npm run e2e
dev_command: docker compose up
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
install_command: npm install --prefix apps/frontend
lint_command: mvn -pl apps/backend test -DskipTests=false && npm run lint --prefix apps/frontend
test_command: mvn test
build_command: mvn package && npm run build --prefix apps/frontend
e2e_command: npm run e2e
dev_command: docker compose up
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

