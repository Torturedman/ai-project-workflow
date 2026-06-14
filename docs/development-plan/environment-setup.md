# 环境搭建与最小验证

本文件定义本项目开发环境的最小要求、隔离方式和最小代码验证入口。后续 AI 在执行工程初始化、依赖安装、测试或模板验证前必须读取本文件。

## 1. 当前目录隔离原则

- 不修改系统默认 Python、Node、Java 或 Docker 配置。
- 项目专用 Python 必须放在当前仓库的 `.venv/`。
- 项目专用 Python 版本选择写入 `.python-version`。
- `uv` cache 必须指向可写目录，推荐当前仓库内 `.uv-cache/`，避免 `C:\Users\27940\AppData\Local\uv\cache` 或 `E:\tmp\uv-cache` 权限问题。
- `npm` cache 必须优先指向当前仓库内 `.npm-cache/`，避免用户目录 `C:\Users\27940\AppData\Local\npm-cache` 权限问题。
- 根目录 `.npmrc` 必须把 `cache` 指向 `.\.npm-cache`，这样后续 npm install/view 默认就会落到仓库内 cache。
- `.venv/`、`.uv-cache/` 和 `.npm-cache/` 是本地环境产物，后续实现 `.gitignore` 时必须忽略。
- `.python-version` 是项目版本约束文件，创建后应纳入 Git。
- Node.js 24 LTS 可以通过 nvm、fnm、Volta 或本地工具链切换，但实现前必须确认当前 shell 中 `node --version` 为 `v24.x`。
- 不允许为了通过验证把文档目标降回当前机器已有版本。

## 2. Python 3.12 当前目录隔离

推荐命令：

```powershell
$env:UV_CACHE_DIR=(Join-Path (Get-Location) ".uv-cache")
uv python install 3.12
uv venv --python 3.12 .venv
Set-Content -Path .python-version -Value "3.12" -Encoding ascii
.\.venv\Scripts\python.exe --version
```

预期：

```text
Python 3.12.x
```

后续 Python 命令优先使用：

```powershell
.\.venv\Scripts\python.exe
```

或激活虚拟环境：

```powershell
.\.venv\Scripts\Activate.ps1
python --version
```

如果 `uv python install 3.12` 因网络失败或权限失败无法执行，不能改用系统 Python 3.11 完成 Python Profile 验证。必须记录失败原因，并在最终回复或 blocked 报告中说明需要联网或修复权限。

## 3. 主控 Node.js 24 要求

实现主控代码前必须满足：

```powershell
node --version
npm --version
npm config set cache .\.npm-cache --location project
```

要求：

```text
node: v24.x
npm: >=11
```

当前机器如果仍是 Node.js 20.x，只能进行文档工作，不能声称主控工程初始化验证通过。

如果本机的 `nvm use 24.8.0` 因安装路径包含空格而失败，必须先把 `NVM_HOME`、`NVM_SYMLINK` 和系统 `Path` 迁移到无空格路径：

```powershell
NVM_HOME=E:\code-tool\nvm
NVM_SYMLINK=E:\code-tool\nodejs
Path includes E:\code-tool\nvm
Path includes E:\code-tool\nodejs
```

迁移后重新打开 PowerShell，执行：

```powershell
nvm use 24.8.0
node --version
npm --version
```

如果 `npm view` 或 `npm install` 报用户目录 cache 的 `EPERM`，不能直接判断为依赖版本冲突。必须先改用仓库内 cache 重试：

```powershell
npm view typescript dist-tags --json --cache .\.npm-cache
```

只有在仓库内 cache 重试后仍出现 peer dependency、engines、版本不存在或构建错误，才按依赖版本问题处理。

## 4. 最小环境检查命令

```powershell
git status -sb
git log -1 --oneline
node --version
npm --version
npm view typescript dist-tags --json --cache .\.npm-cache
python --version
uv --version
docker --version
docker compose version
java -version
mvn --version
Test-NetConnection github.com -Port 443
```

判定：

- Git 工作区应无未提交变更，或明确说明变更范围。
- Node/npm 必须满足主控目标版本后才能开始 TypeScript 工程初始化。
- npm 查询或安装必须能使用仓库内 `.npm-cache/`，用户目录 cache 权限错误不能作为依赖版本调整理由。
- Python 3.12 必须通过 `.venv` 满足后才能开始 `python-fastapi-react` 实现或验证。
- Docker/Compose 可用后才能开始模板容器启动验证。
- Java 21/Maven 3.9.x 可用后才能开始 `java-spring-vue` 骨架验证。
- GitHub 443 可连不代表 push 一定成功，只能说明当前端口连通。

## 5. 最小代码验证分层

### 5.1 文档验证

不需要安装依赖。用于文档修改后：

```powershell
# 检查 README 和开发文档相对链接
# 由执行 AI 使用脚本扫描 Markdown 链接是否存在
```

必须验证：

- 开发文档索引可达。
- 新增文档被索引。
- 关键规则可被搜索到。

### 5.2 主控最小代码验证

前置：

- Node.js 24 LTS。
- npm >= 11。

最小验证：

```powershell
npm install
npm run build
npm test
node dist/cli/index.js --help
```

在没有 Node 24 前，不允许把 Node 20 下的运行结果记为通过。

### 5.3 Python Profile 最小验证

前置：

- `.venv` 存在。
- `.\.venv\Scripts\python.exe --version` 为 Python 3.12.x。

最小验证：

```powershell
$env:UV_CACHE_DIR=(Join-Path (Get-Location) ".uv-cache")
.\.venv\Scripts\python.exe --version
uv --version
```

真正实现 `python-fastapi-react` 后再运行：

```powershell
uv sync
uv run pytest
uv run ruff check app tests
```

### 5.4 Java Profile 最小验证

前置：

- Java 21 LTS。
- Maven 3.9.x。

最小验证：

```powershell
java -version
mvn --version
```

真正实现 `java-spring-vue` 后再运行：

```powershell
mvn test
mvn package
```

## 6. 当前环境判断记录格式

后续 AI 做环境判断时，必须输出：

```text
环境判断：
- 可以开始的任务：
- 暂不能开始的任务：
- 阻塞原因：
- 需要安装或切换：
- 最小验证命令：
```

如果执行了环境安装，还必须更新本文或 [dependency-versions.md](dependency-versions.md)，说明实际采用的版本。

## 7. 当前最小环境验证记录

验证日期：2026-06-14。

已验证：

- `NVM_HOME`：`E:\code-tool\nvm`。
- `NVM_SYMLINK`：`E:\code-tool\nodejs`。
- 系统 `Path`：保留 `E:\code-tool\nvm` 和 `E:\code-tool\nodejs`。
- `nvm list`：Node 24.8.0 已安装。
- `nvm use 24.8.0`：已成功，`E:\code-tool\nodejs` 符号链接指向 `E:\code-tool\nvm\v24.8.0`。
- `node --version`：`v24.8.0`。
- `npm --version`：`11.6.0`。
- `npm config get cache`：`E:\agent\ai-project-workflow\ai-project-workflow\.npm-cache`。
- `npm view typescript dist-tags --json --cache .\.npm-cache`：仓库内 npm cache 可用；默认用户目录 npm cache 曾出现 `EPERM`。
- `python --version`：`Python 3.11.2`，系统 Python 不作为本项目 Python Profile 依据。
- `uv --version`：`uv 0.11.18`。
- `UV_CACHE_DIR=.uv-cache; uv python list 3.12`：可发现 `cpython-3.12.13`。
- `uv venv --python 3.12 .venv`：已在当前目录创建 `.venv/`。
- `.\.venv\Scripts\python.exe --version`：`Python 3.12.13`。
- `.python-version`：已写入 `3.12`，应纳入 Git。
- `docker --version`：Docker 29.3.1；存在 `C:\Users\27940\.docker\config.json` 访问权限警告。
- `docker compose version`：Docker Compose v5.1.1。
- `java -version`：Java 21.0.5 LTS。
- `mvn --version`：Apache Maven 3.9.9。

环境判断：

- 可以开始的任务：主控 TypeScript 工程初始化、文档工作、Python 3.12 目录级隔离验证、Java/Maven 版本层面的最小判断、依赖版本调研。
- 暂不能开始的任务：`npm install`、`npm run build`、`npm test`、`node-next` 模板安装/构建/启动验证。
- 阻塞原因：仓库尚无 `package.json` 等主控代码文件，所以还不能做真正的 npm 工程验证；Node.js 24 LTS 和 npm 11 已经通过 nvm symlink 成为系统可用版本。
- 需要安装或切换：无须再切换 Node 版本；新 PowerShell 应直接识别 `node` 和 `npm`。
- 最小验证命令：重新运行 `node --version`、`npm --version`、`npm view typescript dist-tags --json --cache .\.npm-cache`，等 `package.json` 生成后再开始 `npm install`、`npm run build`、`npm test`。
