# 依赖版本矩阵

本文件锁定开发规划使用的运行时、框架和核心依赖版本。后续 AI 在创建 `package.json`、`pyproject.toml`、`pom.xml`、Dockerfile 或 Profile 配置前必须先读取本文件。

版本核验日期：2026-06-14。  
Node.js 版本依据官方 Node Release schedule：Node 20 已于 2026-04-30 EOL，Node 24 为当前 LTS 线，Node 26 尚未进入 LTS。

## 1. 版本选择规则

- 主控项目和 `node-next` Profile 必须使用 Node.js 24 LTS，不再使用 Node.js 20。
- 文档中的精确依赖版本用于首次实现时锁定 `package.json`、`pyproject.toml`、`pom.xml`。
- 如果实现当天包注册表显示该版本存在严重安全问题、版本不存在、peer dependency 冲突、运行时不兼容或构建失败，允许修改版本，但必须按 [ai-development-rules.md](ai-development-rules.md) 说明原因、保留错误证据，并同步更新本文和相关 Profile 文档。
- `latest` 只能用于调研，不允许写进生成项目模板。
- 每个 Profile 的命令必须声明 `cwd`，不能依赖调用方猜测工作目录。
- Java Profile 的 Maven 版本在实现前必须用文档中的核验命令二次确认，因为当前环境访问 Maven 元数据不稳定。

## 2. 主控项目版本

| 依赖 | 锁定版本 | 用途 |
|---|---:|---|
| Node.js | `24.x LTS` | 主控 CLI 运行时 |
| npm | 随 Node 24 LTS | 包管理器 |
| TypeScript | `6.0.3` | 主控 TypeScript 编译 |
| Commander | `15.0.0` | CLI 命令解析 |
| Zod | `4.4.3` | 配置、协议和报告 schema 校验 |
| Execa | `9.6.1` | 子进程执行 |
| Pino | `10.3.1` | JSONL 结构化日志 |
| YAML | `2.9.0` | YAML 配置解析 |
| Vitest | `4.1.8` | 单元和集成测试 |
| `@playwright/test` | `1.60.0` | E2E 测试 |
| `better-sqlite3` | `12.10.1` | SQLite 全局索引 |
| ESLint | `10.5.0` | lint |
| tsx | `4.22.4` | 开发期 TypeScript 执行 |

主控 `package.json` 必须使用精确版本：

```json
{
  "engines": {
    "node": ">=24 <25",
    "npm": ">=11"
  },
  "dependencies": {
    "commander": "15.0.0",
    "zod": "4.4.3",
    "execa": "9.6.1",
    "pino": "10.3.1",
    "yaml": "2.9.0",
    "better-sqlite3": "12.10.1"
  },
  "devDependencies": {
    "typescript": "6.0.3",
    "vitest": "4.1.8",
    "@playwright/test": "1.60.0",
    "eslint": "10.5.0",
    "tsx": "4.22.4"
  }
}
```

## 3. `node-next` Profile 版本

| 依赖 | 锁定版本 | 用途 |
|---|---:|---|
| Node.js | `24.x LTS` | 生成项目运行时 |
| npm | 随 Node 24 LTS | 包管理器 |
| Next.js | `16.2.9` | 全栈 Web 框架 |
| React | `19.2.7` | UI |
| React DOM | `19.2.7` | UI 渲染 |
| TypeScript | `6.0.3` | 类型系统 |
| Prisma CLI | `7.8.0` | migration 和 schema |
| `@prisma/client` | `7.8.0` | 数据访问 |
| PostgreSQL | `16` | 业务数据库 |
| `@playwright/test` | `1.60.0` | E2E 测试 |
| Vitest | `4.1.8` | 单元测试 |
| ESLint | `10.5.0` | lint |

目录特例：

- `node-next` 是单 Next.js 全栈应用，应用根目录是 `apps/web`。
- 通用的 `apps/backend` / `apps/frontend` 结构不适用于该 Profile。
- API 路由、页面、Prisma 和 Playwright 都在 `apps/web` 或仓库根的对应目录中生成。

命令必须使用以下 `cwd`：

| 命令 | cwd | command |
|---|---|---|
| install | `apps/web` | `npm install` |
| lint | `apps/web` | `npm run lint` |
| test | `apps/web` | `npm test` |
| build | `apps/web` | `npm run build` |
| e2e | 项目根目录 | `npm run e2e` |
| dev | `apps/web` | `npm run dev` |
| migrate dev | `apps/web` | `npx prisma migrate dev` |
| migrate deploy | `apps/web` | `npx prisma migrate deploy` |

## 4. `python-fastapi-react` Profile 版本

| 依赖 | 锁定版本 | 用途 |
|---|---:|---|
| Python | `3.12.x` | 后端运行时 |
| uv | 实现时锁定最新稳定版 | Python 包管理 |
| FastAPI | `0.136.3` | API 框架 |
| Uvicorn | `0.49.0` | ASGI Server |
| SQLAlchemy | `2.0.50` | ORM |
| Alembic | `1.18.4` | migration |
| Pydantic | `2.13.4` | schema 和配置 |
| Pytest | `9.1.0` | 后端测试 |
| Ruff | `0.15.17` | Python lint |
| Node.js | `24.x LTS` | 前端运行时 |
| React | `19.2.7` | UI |
| Vite | `8.0.16` | 前端构建 |
| TypeScript | `6.0.3` | 前端类型系统 |
| PostgreSQL | `16` | 业务数据库 |

命令必须使用以下 `cwd`：

| 命令 | cwd | command |
|---|---|---|
| backend install | `apps/backend` | `uv sync` |
| frontend install | `apps/frontend` | `npm install` |
| backend lint | `apps/backend` | `uv run ruff check app tests` |
| frontend lint | `apps/frontend` | `npm run lint` |
| backend test | `apps/backend` | `uv run pytest` |
| frontend build | `apps/frontend` | `npm run build` |
| backend compile | `apps/backend` | `uv run python -m compileall app` |
| e2e | 项目根目录 | `npm run e2e` |
| dev | 项目根目录 | `docker compose up` |
| migrate | `apps/backend` | `uv run alembic upgrade head` |

禁止使用含混命令 `uv sync && npm install --prefix apps/frontend` 作为单条 Profile 命令。Profile schema 应支持命令数组或显式 `cwd` 字段。

## 5. `java-spring-vue` Profile 版本

| 依赖 | 锁定候选 | 用途 |
|---|---:|---|
| Java | `21 LTS` | 后端运行时 |
| Maven | `3.9.x` | Java 构建 |
| Spring Boot | `3.5.x` | 后端框架 |
| MyBatis Plus Spring Boot 3 Starter | 实现前二次核验 | ORM 辅助 |
| Flyway Core | 实现前二次核验 | migration |
| MySQL | `8.4 LTS` | 业务数据库 |
| Node.js | `24.x LTS` | 前端运行时 |
| Vue | `3.5.38` | UI |
| Vite | `8.0.16` | 前端构建 |
| `@vitejs/plugin-vue` | `6.0.7` | Vue/Vite 集成 |
| TypeScript | `6.0.3` | 前端类型系统 |

命令必须使用以下 `cwd`：

| 命令 | cwd | command |
|---|---|---|
| backend lint/test | `apps/backend` | `mvn test` |
| backend build | `apps/backend` | `mvn package` |
| frontend install | `apps/frontend` | `npm install` |
| frontend lint | `apps/frontend` | `npm run lint` |
| frontend build | `apps/frontend` | `npm run build` |
| e2e | 项目根目录 | `npm run e2e` |
| dev | 项目根目录 | `docker compose up` |
| migrate | `apps/backend` | `mvn flyway:migrate` |

禁止默认使用 `mvn -pl apps/backend ...`，除非模板根目录生成了 Maven 聚合 `pom.xml`。MVP 骨架优先使用 `mvn -f apps/backend/pom.xml ...` 或在 `apps/backend` cwd 下执行 `mvn ...`。

## 6. 版本核验命令

实现前可以用这些命令重新核验：

```bash
npm view typescript version
npm view commander version
npm view zod version
npm view execa version
npm view pino version
npm view yaml version
npm view vitest version
npm view @playwright/test version
npm view better-sqlite3 version
npm view next version
npm view react version
npm view react-dom version
npm view prisma version
npm view @prisma/client version
npm view vue version
npm view vite version
npm view @vitejs/plugin-vue version
python -m pip index versions fastapi
python -m pip index versions uvicorn
python -m pip index versions sqlalchemy
python -m pip index versions alembic
python -m pip index versions pytest
python -m pip index versions ruff
python -m pip index versions pydantic
```

Maven 版本核验：

```bash
curl https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml
curl https://repo.maven.apache.org/maven2/com/baomidou/mybatis-plus-spring-boot3-starter/maven-metadata.xml
curl https://repo.maven.apache.org/maven2/org/flywaydb/flyway-core/maven-metadata.xml
```

Node.js LTS 核验：

```bash
curl https://raw.githubusercontent.com/nodejs/Release/main/schedule.json
```
