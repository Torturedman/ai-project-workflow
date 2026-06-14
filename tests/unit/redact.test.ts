import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { createArtifactIndexRecord, hashFileSha256 } from "../../src/persistence/artifact-index.js";
import { createJsonlLogger } from "../../src/logging/logger.js";
import { createAgentLogPaths, createCommandLogPaths, getGlobalLogPath } from "../../src/logging/log-paths.js";
import { redactText, redactValue } from "../../src/logging/redact.js";

const tempDirs: string[] = [];
const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "ai-factory-logging-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("redactText", () => {
  it("redacts API keys, bearer tokens, authorization headers, cookies, database passwords, and common cloud tokens", () => {
    const input = [
      "OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz",
      "ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnopqrstuvwxyz",
      "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature",
      "Cookie: session=abc123; refresh=def456",
      "postgresql://app_user:db-secret@localhost:5432/app",
      "mysql://root:root-secret@localhost:3306/app",
      "github token ghp_abcdefghijklmnopqrstuvwxyz1234567890",
      "aws key AKIAIOSFODNN7EXAMPLE",
    ].join("\n");

    const redacted = redactText(input);

    expect(redacted).toContain("OPENAI_API_KEY=[REDACTED]");
    expect(redacted).toContain("ANTHROPIC_API_KEY=[REDACTED]");
    expect(redacted).toContain("Authorization: [REDACTED]");
    expect(redacted).toContain("Cookie: [REDACTED]");
    expect(redacted).toContain("postgresql://app_user:[REDACTED]@localhost:5432/app");
    expect(redacted).toContain("mysql://root:[REDACTED]@localhost:3306/app");
    expect(redacted).not.toContain("sk-proj-abcdefghijklmnopqrstuvwxyz");
    expect(redacted).not.toContain("sk-ant-api03-abcdefghijklmnopqrstuvwxyz");
    expect(redacted).not.toContain("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature");
    expect(redacted).not.toContain("session=abc123");
    expect(redacted).not.toContain("db-secret");
    expect(redacted).not.toContain("root-secret");
    expect(redacted).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz1234567890");
    expect(redacted).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });
});

describe("redactValue", () => {
  it("recursively redacts nested values and sensitive object keys", () => {
    expect(
      redactValue({
        message: "Bearer secret-token",
        env: {
          OPENAI_API_KEY: "sk-proj-abcdefghijklmnopqrstuvwxyz",
          DATABASE_URL: "postgresql://app:password@localhost:5432/app",
        },
      }),
    ).toEqual({
      message: "Bearer [REDACTED]",
      env: {
        OPENAI_API_KEY: "[REDACTED]",
        DATABASE_URL: "postgresql://app:[REDACTED]@localhost:5432/app",
      },
    });
  });
});

describe("log paths", () => {
  it("creates global, command, and agent log paths using safe filenames", () => {
    const globalHome = join(repoRoot, "resources", "global");
    const projectDir = "E:/workspace/course-booking";
    const timestamp = new Date("2026-06-13T01:59:55.000Z");

    expect(getGlobalLogPath(globalHome)).toBe(join(repoRoot, "resources", "logs", "ai-factory-global.jsonl"));
    expect(createCommandLogPaths(projectDir, "npm test -- auth", timestamp)).toEqual({
      stdout: join(projectDir, ".ai-factory", "logs", "commands", "npm-test-auth-20260613T015955Z.stdout.log"),
      stderr: join(projectDir, ".ai-factory", "logs", "commands", "npm-test-auth-20260613T015955Z.stderr.log"),
    });
    expect(createAgentLogPaths(projectDir, "dev-backend", "auth api", "inv_01HZX8")).toEqual({
      stdout: join(
        projectDir,
        ".ai-factory",
        "logs",
        "agents",
        "dev-backend",
        "auth-api-inv_01HZX8.stdout.log",
      ),
      stderr: join(
        projectDir,
        ".ai-factory",
        "logs",
        "agents",
        "dev-backend",
        "auth-api-inv_01HZX8.stderr.log",
      ),
      prompt: join(
        projectDir,
        ".ai-factory",
        "logs",
        "agents",
        "dev-backend",
        "auth-api-inv_01HZX8.prompt.md",
      ),
    });
  });
});

describe("createJsonlLogger", () => {
  it("writes redacted JSONL log entries", async () => {
    const dir = await createTempDir();
    const logFile = join(dir, "orchestrator.jsonl");
    const logger = await createJsonlLogger({ logFile, level: "info" });

    logger.info("task.started", "Started task", {
      command: "curl -H 'Authorization: Bearer secret-token' http://localhost",
      env: { OPENAI_API_KEY: "sk-proj-abcdefghijklmnopqrstuvwxyz" },
    });
    logger.flush();

    const body = await readFile(logFile, "utf8");
    const entry = JSON.parse(body.trim()) as Record<string, unknown>;

    expect(entry).toMatchObject({
      level: "info",
      event: "task.started",
      message: "Started task",
    });
    expect(body).not.toContain("secret-token");
    expect(body).not.toContain("sk-proj-abcdefghijklmnopqrstuvwxyz");
  });
});

describe("artifact index", () => {
  it("calculates SHA-256 and builds artifact index records without storing file contents", async () => {
    const dir = await createTempDir();
    const artifactPath = join(dir, "report.json");
    await writeFile(artifactPath, "{\"ok\":true}\n", "utf8");

    const record = await createArtifactIndexRecord({
      id: "artifact_1",
      runId: "run_1",
      kind: "agent-report",
      path: ".ai-factory/agents/dev-backend/report.json",
      absolutePath: artifactPath,
      createdAt: "2026-06-14T00:00:00.000Z",
    });

    expect(record).toEqual({
      id: "artifact_1",
      run_id: "run_1",
      kind: "agent-report",
      path: ".ai-factory/agents/dev-backend/report.json",
      sha256: await hashFileSha256(artifactPath),
      created_at: "2026-06-14T00:00:00.000Z",
    });
    expect(JSON.stringify(record)).not.toContain("{\"ok\":true}");
  });
});
