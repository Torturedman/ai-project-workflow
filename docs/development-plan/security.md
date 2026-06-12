# 安全与命令执行约束

## 1. 命令执行

- 所有本地命令默认使用 `execa(file, args, { shell: false })`。
- 只有 Profile 明确声明需要 shell 时才允许 shell。
- 命令参数必须由 parser 拆分，不能把用户输入拼接进 shell 字符串。
- 执行前记录 cwd、command、args、env 白名单。
- 命令 stdout/stderr 必须写入日志文件。

## 2. 环境变量白名单

默认只传递：

- `PATH`
- `HOME`
- `USERPROFILE`
- `TEMP`
- `TMP`
- Profile 需要的数据库 URL
- AI CLI 必需变量

不允许把整个 `process.env` 无过滤传给 Agent 或命令。

## 3. 敏感信息

- 日志写入前必须脱敏。
- Agent 不允许修改 `.env`，只能创建或修改 `.env.example`。
- 如果需要真实密钥，进入 `blocked` 并说明需要用户手动配置。
- 不在日志中请求用户粘贴密钥。
- `report.md` 不允许保存完整 Authorization header、Cookie、API key、数据库密码。

## 4. 必须脱敏的内容

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- JWT
- Bearer token
- 数据库 URL 密码
- AWS token 常见格式
- GitHub token 常见格式
- Cookie header
- Authorization header

## 5. 生成项目安全默认值

- 默认生成 `.env.example`。
- 默认使用本地开发数据库密码占位符。
- 默认不启用生产部署配置。
- 默认不生成真实密钥。
- 默认不提交本地数据库文件、日志、`.env`。

