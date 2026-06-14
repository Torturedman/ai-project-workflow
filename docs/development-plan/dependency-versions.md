# 依赖版本矩阵

本文件定义开发规划使用的运行时、框架和核心依赖版本选择规则。后续 AI 在创建 `package.json`、`pyproject.toml`、`pom.xml`、Dockerfile 或 Profile 配置前必须先读取本文件。

版本核验日期：2026-06-14。  
核验方式：在当前仓库内使用 `.npm-cache/` 执行 `npm view ... --cache .\.npm-cache` 查询 dist-tags、主版本补丁线和关键 peer dependencies；Python、Maven 依赖仍需在实现对应 Profile 前二次核验。

## 1. 版本选择规则

- 版本选择目标是稳定兼容基线，不追求当天最新版本，也不允许使用老旧、EOL 或缺少维护的版本线。
- 运行时必须使用仍在维护期内的 LTS 或稳定线。主控项目和 `node-next` Profile 使用 Node.js 24 LTS，不再使用 Node.js 20；Python Profile 使用 Python 3.12.x；Java Profile 使用 Java 21 LTS。
- 框架类依赖优先选择已被真实开源项目、官方模板、主流生态或兼容矩阵验证过的成熟主版本线；如果最新主版本刚发布且生态验证不足，优先使用前一条仍维护的稳定主版本线。
- 工具库类依赖可以使用当前稳定 dist-tag 的最新补丁版本，但必须确认不是 alpha、beta、rc、canary、next、experimental。
- 文档中的候选版本是首次实现的默认精确锁定值。写入 `package.json`、`pyproject.toml`、`pom.xml` 时必须使用精确版本，不允许使用 `latest`、`^latest` 或无约束范围。
- 如果实现当天发现候选版本存在严重安全问题、版本不存在、peer dependency 冲突、运行时不兼容、构建失败或与其他规划组件冲突，允许修改版本，但必须按 [ai-development-rules.md](ai-development-rules.md) 说明原因、保留错误证据，并同步更新本文和相关 Profile 文档。
- 任何版本升级或降级都必须做横向兼容分析：运行时、框架、构建器、测试工具、ORM、数据库镜像、Docker、Profile 命令和最小验证命令不能互相冲突。
- `latest` 只能用于调研命令输出，不允许写进生成项目模板。
- 每个 Profile 的命令必须声明 `cwd`，不能依赖调用方猜测工作目录。
- Python 3.12 必须通过当前仓库 `.venv` 做目录级隔离，具体步骤见 [environment-setup.md](environment-setup.md)。
- Java Profile 的 Maven 依赖版本在实现前必须用文档中的核验命令二次确认，因为当前环境访问 Maven 元数据可能不稳定。

## 2. 证据等级

后续 AI 确认或调整版本时，必须至少满足以下一个证据等级，并在修改说明中写明：

| 等级 | 可接受证据 | 适用场景 |
|---|---|---|
| A | 官方兼容矩阵、官方模板、官方 release/upgrade 文档 | 运行时、框架、ORM、数据库 |
| B | 知名开源项目在同类栈中的锁定版本或主版本线 | 框架组合、构建工具组合 |
| C | 包注册表 dist-tag、peer dependency、engines、非 prerelease 版本线 | 工具库、测试工具、小型依赖 |
| D | 本仓库最小验证通过，且无 peer/security/runtime 冲突 | 临时候选或生态证据不足的依赖 |

禁止只用“版本更新”作为理由。版本选择必须能回答：

- 为什么不是最新主版本？
- 为什么不是更老的主版本？
- 与本 Profile 其他组件是否兼容？
- 哪些验证命令证明可安装、可构建或可运行？

## 3. 主控项目版本

| 依赖 | 稳定候选基线 | 用途 | 当前证据与约束 |
|---|---:|---|---|
| Node.js | `24.x LTS` | 主控 CLI 运行时 | Node 20 已 EOL；Node 24 是当前 LTS 目标线 |
| npm | 随 Node 24 LTS，要求 `>=11 <12` | 包管理器 | 与 Node 24 同线，避免系统 Node 20 附带 npm 10 |
| TypeScript | `5.9.3` | 主控 TypeScript 编译 | TypeScript 6.0.3 是当前 latest，但 5.9.x 是更成熟的稳定线；实现前可再核验生态兼容 |
| Commander | `15.0.0` | CLI 命令解析 | npm stable dist-tag；CLI 依赖面小 |
| Zod | `4.4.3` | 配置、协议和报告 schema 校验 | npm stable dist-tag；禁止使用 beta/canary |
| Execa | `9.6.1` | 子进程执行 | npm stable dist-tag |
| Pino | `10.3.1` | JSONL 结构化日志 | npm stable dist-tag |
| YAML | `2.9.0` | YAML 配置解析 | npm stable dist-tag |
| Vitest | `3.2.6` | 单元和集成测试 | 4.x 是当前新主版本，3.2.x 是成熟主版本线；与 TypeScript 5.9、Node 24 可二次验证 |
| `@playwright/test` | `1.60.0` | E2E 测试 | npm stable dist-tag；避免 alpha/next |
| `better-sqlite3` | `12.10.1` | SQLite 全局索引 | npm stable dist-tag；实现时需验证 Node 24 原生模块安装 |
| ESLint | `9.39.4` | lint | ESLint 9 是成熟稳定主版本线 |
| typescript-eslint | `8.61.0` | TypeScript lint parser 和规则集 | npm stable dist-tag；用于 ESLint 9 解析 TypeScript |
| tsx | `4.22.4` | 开发期 TypeScript 执行 | npm stable dist-tag |

主控 `package.json` 首次实现默认精确版本：

```json
{
  "engines": {
    "node": ">=24 <25",
    "npm": ">=11 <12"
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
    "typescript": "5.9.3",
    "vitest": "3.2.6",
    "@playwright/test": "1.60.0",
    "eslint": "9.39.4",
    "typescript-eslint": "8.61.0",
    "tsx": "4.22.4"
  }
}
```

## 4. `node-next` Profile 版本

| 依赖 | 稳定候选基线 | 用途 | 当前证据与约束 |
|---|---:|---|---|
| Node.js | `24.x LTS` | 生成项目运行时 | Profile 运行时与主控一致 |
| npm | 随 Node 24 LTS，要求 `>=11 <12` | 包管理器 | 不使用 Node 20/npm 10 作为通过依据 |
| Next.js | `15.5.19` | 全栈 Web 框架 | Next 16.2.9 是 latest；15.5.x 是仍有补丁线的成熟主版本，peer 支持 React 19 |
| React | `19.1.8` | UI | React 19.2.7 是 latest；19.1.x 是更成熟补丁线，满足 Next 15 peer |
| React DOM | `19.1.8` | UI 渲染 | 必须与 React 精确同版 |
| TypeScript | `5.9.3` | 类型系统 | 与主控一致，避免 TypeScript 6 初期生态风险 |
| Prisma CLI | `6.19.3` | migration 和 schema | Prisma 7.8.0 是 latest；6.19.x 是成熟主版本，CLI 和 client 必须同版 |
| `@prisma/client` | `6.19.3` | 数据访问 | 必须与 Prisma CLI 精确同版 |
| PostgreSQL | `16` | 业务数据库 | 成熟稳定主版本；暂不追 PostgreSQL 17/18 |
| `@playwright/test` | `1.60.0` | E2E 测试 | 与主控一致 |
| Vitest | `3.2.6` | 单元测试 | 与主控一致 |
| ESLint | `9.39.4` | lint | 与主控一致 |

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

## 5. `python-fastapi-react` Profile 版本

| 依赖 | 稳定候选基线 | 用途 | 当前证据与约束 |
|---|---:|---|---|
| Python | `3.12.x` | 后端运行时 | 当前目录 `.venv` 隔离，不修改系统 Python |
| uv | `0.11.x` 或实现时稳定版 | Python 包管理 | 当前机器已有 uv 0.11.18；实现时用仓库内 `.uv-cache/` 二次核验 |
| FastAPI | 实现前二次核验稳定候选 | API 框架 | 需要选择仍活跃维护且不老旧的稳定线，并与 Pydantic 2、Starlette、Uvicorn 兼容后锁定精确版本 |
| Uvicorn | 实现前二次核验稳定候选 | ASGI Server | 需要选择仍活跃维护且不老旧的稳定线，并与 FastAPI/Starlette 组合验证 |
| SQLAlchemy | `2.0.x` | ORM | 2.0 是成熟稳定主版本线 |
| Alembic | 实现前二次核验稳定候选 | migration | 需要选择仍活跃维护且不老旧的稳定线，并与 SQLAlchemy 2.0 组合验证 |
| Pydantic | `2.x` 稳定线 | schema 和配置 | 需要与 FastAPI 组合验证，禁止退回 Pydantic 1 |
| Pytest | 实现前二次核验稳定候选 | 后端测试 | 避免直接采用刚发布主版本，也禁止使用缺少维护的旧主版本 |
| Ruff | 实现前二次核验稳定候选 | Python lint | 实现时确认规则集和 Python 3.12 兼容，禁止用过旧版本绕过规则 |
| Node.js | `24.x LTS` | 前端运行时 | 与主控一致 |
| React | `19.1.8` | UI | 与 Next Profile 的 React 稳定线一致 |
| Vite | `7.3.5` | 前端构建 | Vite 8.0.16 是 latest；7.3.x 是成熟主版本线，要求 Node `^20.19.0 || >=22.12.0`，满足 Node 24 |
| TypeScript | `5.9.3` | 前端类型系统 | 与主控一致 |
| PostgreSQL | `16` | 业务数据库 | 与 `node-next` 保持一致 |

Python 依赖在本阶段不写死为已查询到的 latest。实现 `python-fastapi-react` 前必须执行 PyPI 查询、生成 `uv.lock`，并把最终精确版本回填本文。

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

## 6. `java-spring-vue` Profile 版本

| 依赖 | 稳定候选基线 | 用途 | 当前证据与约束 |
|---|---:|---|---|
| Java | `21 LTS` | 后端运行时 | 当前机器已具备 Java 21；实现前仍需验证 |
| Maven | `3.9.x` | Java 构建 | 当前机器已具备 Maven 3.9.x |
| Spring Boot | `3.5.x` | 后端框架 | 需要实现前核验 Maven metadata 和 Java 21 兼容 |
| MyBatis Plus Spring Boot 3 Starter | 实现前二次核验 | ORM 辅助 | 必须确认支持 Spring Boot 3.5.x |
| Flyway Core | 实现前二次核验 | migration | 必须确认支持 MySQL 8.4 LTS |
| MySQL | `8.4 LTS` | 业务数据库 | MySQL LTS 线 |
| Node.js | `24.x LTS` | 前端运行时 | 与主控一致 |
| Vue | `3.5.38` | UI | npm stable dist-tag；避免 Vue 3.6 prerelease |
| Vite | `7.3.5` | 前端构建 | 不直接采用 Vite 8 最新主版本 |
| `@vitejs/plugin-vue` | `6.0.7` | Vue/Vite 集成 | peer 支持 Vite 5/6/7/8 和 Vue 3.2+，可与 Vite 7.3.5 组合 |
| TypeScript | `5.9.3` | 前端类型系统 | 与主控一致 |

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

## 7. 当前核验记录

2026-06-14 在本仓库内执行过以下核验：

- `npm view typescript dist-tags --json --cache .\.npm-cache`：`latest=6.0.3`，但选择 `5.9.3` 作为成熟候选线。
- `npm view next dist-tags --json --cache .\.npm-cache`：`latest=16.2.9`，存在 `next-15-*` 补丁线；选择 `15.5.19`。
- `npm view next@15.5.19 peerDependencies engines --json --cache .\.npm-cache`：支持 React 19，Node `>=20.0.0`。
- `npm view react dist-tags --json --cache .\.npm-cache`：`latest=19.2.7`，存在 `backport=19.1.8`；选择 `19.1.8`。
- `npm view prisma@6 version --cache .\.npm-cache` 与 `npm view @prisma/client@6 version --cache .\.npm-cache`：确认 6.19.3 同线可用。
- `npm view vite dist-tags --json --cache .\.npm-cache`：`latest=8.0.16`，`previous=6.4.3`；结合 `npm view vite@7 version` 选择 7.3.5。
- `npm view vite@7.3.5 engines peerDependencies --json --cache .\.npm-cache`：Node 要求满足 Node 24。
- `npm view @vitejs/plugin-vue@6.0.7 peerDependencies --json --cache .\.npm-cache`：peer 支持 Vite 5/6/7/8 和 Vue 3.2+。

首次运行 `npm view ...` 时，默认用户目录 cache 报 `EPERM`，因此后续 npm 查询和安装应优先使用仓库内 `.npm-cache/`，详见 [environment-setup.md](environment-setup.md)。

## 8. 版本核验命令

实现前可以用这些命令重新核验 Node 生态版本：

```powershell
npm view typescript dist-tags --json --cache .\.npm-cache
npm view commander dist-tags --json --cache .\.npm-cache
npm view zod dist-tags --json --cache .\.npm-cache
npm view execa dist-tags --json --cache .\.npm-cache
npm view pino dist-tags --json --cache .\.npm-cache
npm view yaml dist-tags --json --cache .\.npm-cache
npm view vitest dist-tags --json --cache .\.npm-cache
npm view @playwright/test dist-tags --json --cache .\.npm-cache
npm view better-sqlite3 dist-tags --json --cache .\.npm-cache
npm view typescript-eslint dist-tags --json --cache .\.npm-cache
npm view next dist-tags --json --cache .\.npm-cache
npm view next@15.5.19 peerDependencies engines --json --cache .\.npm-cache
npm view react dist-tags --json --cache .\.npm-cache
npm view react-dom dist-tags --json --cache .\.npm-cache
npm view prisma@6 version --cache .\.npm-cache
npm view @prisma/client@6 version --cache .\.npm-cache
npm view vue dist-tags --json --cache .\.npm-cache
npm view vite dist-tags --json --cache .\.npm-cache
npm view vite@7.3.5 engines peerDependencies --json --cache .\.npm-cache
npm view @vitejs/plugin-vue@6.0.7 peerDependencies --json --cache .\.npm-cache
```

Python 版本核验：

```powershell
$env:UV_CACHE_DIR=(Join-Path (Get-Location) ".uv-cache")
uv python list 3.12
python -m pip index versions fastapi
python -m pip index versions uvicorn
python -m pip index versions sqlalchemy
python -m pip index versions alembic
python -m pip index versions pytest
python -m pip index versions ruff
python -m pip index versions pydantic
```

Maven 版本核验：

```powershell
curl https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml
curl https://repo.maven.apache.org/maven2/com/baomidou/mybatis-plus-spring-boot3-starter/maven-metadata.xml
curl https://repo.maven.apache.org/maven2/org/flywaydb/flyway-core/maven-metadata.xml
```

Node.js LTS 核验：

```powershell
curl https://raw.githubusercontent.com/nodejs/Release/main/schedule.json
```
