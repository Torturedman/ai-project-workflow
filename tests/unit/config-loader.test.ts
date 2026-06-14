import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/config-loader.js";

const tempDirs: string[] = [];

async function createTempProject(): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), "ai-factory-config-"));
  tempDirs.push(projectDir);
  return projectDir;
}

async function writeYaml(path: string, content: string): Promise<void> {
  await writeFile(path, content, "utf8");
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("loadConfig", () => {
  it("returns the built-in defaults when no project or global config exists", async () => {
    const projectDir = await createTempProject();

    const result = await loadConfig({ projectDir, env: {} });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.config.default_profile).toBe("node-next");
    expect(result.config.default_runner).toBe("mock");
    expect(result.config.paths.global_home).toBe("~/.ai-factory");
    expect(result.config.supported_profiles).toEqual([
      "node-next",
      "python-fastapi-react",
      "java-spring-vue",
    ]);
  });

  it("merges CLI, environment, project, global, and default config in priority order", async () => {
    const projectDir = await createTempProject();
    const globalConfigPath = join(projectDir, "global.yaml");

    await writeYaml(
      globalConfigPath,
      [
        "default_profile: java-spring-vue",
        "default_runner: codex-cli",
        "execution:",
        "  max_parallel_agents: 2",
        "logging:",
        "  level: debug",
      ].join("\n"),
    );
    await writeYaml(
      join(projectDir, "ai-factory.config.yaml"),
      [
        "default_profile: python-fastapi-react",
        "execution:",
        "  max_parallel_agents: 4",
        "  command_timeout_seconds: 120",
        "logging:",
        "  retain_project_logs: false",
      ].join("\n"),
    );

    const result = await loadConfig({
      projectDir,
      globalConfigPath,
      env: {
        AI_FACTORY_HOME: "E:/factory-home",
        AI_FACTORY_DEFAULT_RUNNER: "mock",
        AI_FACTORY_LOG_LEVEL: "warn",
      },
      cliOptions: {
        default_profile: "node-next",
        execution: {
          command_timeout_seconds: 60,
        },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.config.default_profile).toBe("node-next");
    expect(result.config.default_runner).toBe("mock");
    expect(result.config.paths.global_home).toBe("E:/factory-home");
    expect(result.config.execution.max_parallel_agents).toBe(4);
    expect(result.config.execution.command_timeout_seconds).toBe(60);
    expect(result.config.logging.level).toBe("warn");
    expect(result.config.logging.retain_project_logs).toBe(false);
  });

  it("returns CONFIG_INVALID for invalid YAML instead of throwing", async () => {
    const projectDir = await createTempProject();
    await writeYaml(join(projectDir, "ai-factory.config.yaml"), "default_profile: [");

    const result = await loadConfig({ projectDir, env: {} });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected invalid config");
    }

    expect(result.error).toMatchObject({
      code: "CONFIG_INVALID",
      retryable: false,
      phase: "config",
    });
    expect(result.error.evidence?.config_file).toBe(join(projectDir, "ai-factory.config.yaml"));
  });

  it("returns CONFIG_NOT_FOUND when an explicit global config path is missing", async () => {
    const projectDir = await createTempProject();
    const missingGlobalConfig = join(projectDir, "missing-global.yaml");

    const result = await loadConfig({
      projectDir,
      env: {
        AI_FACTORY_CONFIG: missingGlobalConfig,
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected missing config");
    }

    expect(result.error).toMatchObject({
      code: "CONFIG_NOT_FOUND",
      retryable: false,
      phase: "config",
    });
    expect(result.error.evidence?.config_file).toBe(missingGlobalConfig);
  });
});
