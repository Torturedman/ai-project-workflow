import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFactoryLayout, getFactoryPaths } from "../../src/protocol/factory-layout.js";
import { writeAgentReport } from "../../src/protocol/report-writer.js";
import { readStatusFile, readTaskGraphFile, writeStatusFile, writeTaskGraphFile } from "../../src/protocol/validators.js";
import { readJsonFile, writeJsonFileAtomic } from "../../src/persistence/file-store.js";

const tempDirs: string[] = [];

async function createProjectDir(): Promise<string> {
  const projectDir = await mkdtemp(join(tmpdir(), "ai-factory-layout-"));
  tempDirs.push(projectDir);
  return projectDir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("factory file layout", () => {
  it("creates the .ai-factory directory tree", async () => {
    const projectDir = await createProjectDir();

    const paths = await createFactoryLayout(projectDir);

    expect(paths.factoryDir).toBe(join(projectDir, ".ai-factory"));
    await expect(readFile(join(paths.factoryDir, "logs", "orchestrator.jsonl"), "utf8")).resolves.toBe("");
    await expect(writeFile(join(paths.factoryDir, "tasks", "task-files", "probe.txt"), "ok")).resolves.toBeUndefined();
    await expect(writeFile(join(paths.factoryDir, "logs", "commands", "probe.log"), "ok")).resolves.toBeUndefined();
    await expect(writeFile(join(paths.factoryDir, "logs", "agents", "probe.log"), "ok")).resolves.toBeUndefined();
  });

  it("does not overwrite existing files when initialized repeatedly", async () => {
    const projectDir = await createProjectDir();
    const paths = getFactoryPaths(projectDir);

    await createFactoryLayout(projectDir);
    await writeFile(paths.statusFile, "{\"version\":\"1.0\"}", "utf8");
    await createFactoryLayout(projectDir);

    await expect(readFile(paths.statusFile, "utf8")).resolves.toBe("{\"version\":\"1.0\"}");
  });
});

describe("file store", () => {
  it("writes and reads JSON files atomically", async () => {
    const projectDir = await createProjectDir();
    const paths = await createFactoryLayout(projectDir);

    await writeJsonFileAtomic(paths.statusFile, { version: "1.0", status: "intake" });

    await expect(readJsonFile(paths.statusFile)).resolves.toEqual({
      version: "1.0",
      status: "intake",
    });
    await expect(readFile(`${paths.statusFile}.tmp`, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("validates status and task graph files while reading and writing", async () => {
    const projectDir = await createProjectDir();
    const paths = await createFactoryLayout(projectDir);
    const status = {
      version: "1.0",
      project_id: "proj_1",
      run_id: "run_1",
      status: "intake",
      raw_request: "build a web app",
      selected_profile: "node-next",
      architecture_mode: "standard",
      approval: {
        required: true,
        approved: false,
        approved_at: null,
      },
      current_phase: "intake",
      frontend_url: null,
      backend_url: null,
      api_docs_url: null,
      last_error: null,
      created_at: "2026-06-14T00:00:00.000Z",
      updated_at: "2026-06-14T00:00:00.000Z",
    };
    const taskGraph = {
      version: "1.0",
      project_id: "proj_1",
      run_id: "run_1",
      tasks: [
        {
          id: "task_1",
          title: "Create API",
          owner: "dev-backend",
          status: "pending",
          depends_on: [],
          stack_profile: "node-next",
          workspace: "workspaces/task_1",
          inputs: [],
          outputs: ["apps/web/src/app/api/health/route.ts"],
          allowed_paths: ["apps/web/**"],
          verification_commands: ["npm test"],
          attempt: 0,
          max_attempts: 3,
        },
      ],
    };

    await writeStatusFile(paths.statusFile, status);
    await writeTaskGraphFile(join(paths.tasksDir, "task-graph.json"), taskGraph);

    await expect(readStatusFile(paths.statusFile)).resolves.toEqual(status);
    await expect(readTaskGraphFile(join(paths.tasksDir, "task-graph.json"))).resolves.toEqual(taskGraph);
  });

  it("returns CONFIG_INVALID or TASK_GRAPH_INVALID when protocol files fail validation", async () => {
    const projectDir = await createProjectDir();
    const paths = await createFactoryLayout(projectDir);

    await writeJsonFileAtomic(paths.statusFile, { version: "1.0", status: "not-valid" });
    await writeJsonFileAtomic(join(paths.tasksDir, "task-graph.json"), { version: "1.0", tasks: "not-array" });

    await expect(readStatusFile(paths.statusFile)).rejects.toMatchObject({ code: "CONFIG_INVALID" });
    await expect(readTaskGraphFile(join(paths.tasksDir, "task-graph.json"))).rejects.toMatchObject({
      code: "TASK_GRAPH_INVALID",
    });
  });

  it("writes agent report.json and report.md", async () => {
    const projectDir = await createProjectDir();
    const paths = await createFactoryLayout(projectDir);

    await writeAgentReport(paths.factoryDir, "dev-backend", {
      json: {
        version: "1.0",
        run_id: "run_1",
        task_id: "task_1",
        role: "dev-backend",
        status: "completed",
        summary: "Created health endpoint",
        changed_files: ["apps/web/src/app/api/health/route.ts"],
        created_files: [],
        verification: [{ command: "npm test", status: "passed", log: ".ai-factory/logs/commands/npm-test.log" }],
        risks: [],
        next_actions: [],
      },
      markdown: "# Report\n",
    });

    await expect(readJsonFile(join(paths.agentsDir, "dev-backend", "report.json"))).resolves.toMatchObject({
      status: "completed",
      role: "dev-backend",
    });
    await expect(readFile(join(paths.agentsDir, "dev-backend", "report.md"), "utf8")).resolves.toBe("# Report\n");
  });
});
