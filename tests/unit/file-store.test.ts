import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFactoryLayout, getFactoryPaths } from "../../src/protocol/factory-layout.js";
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
});
