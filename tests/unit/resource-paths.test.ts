import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getDefaultGlobalHome, getGlobalDatabasePath, getResourcePaths } from "../../src/config/resource-paths.js";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

describe("resource paths", () => {
  it("keeps global resources under classified directories in the repository resources directory", () => {
    const paths = getResourcePaths(repoRoot);

    expect(getDefaultGlobalHome(repoRoot)).toBe(join(repoRoot, "resources", "global"));
    expect(getGlobalDatabasePath(repoRoot)).toBe(join(repoRoot, "resources", "database", "ai-factory.db"));
    expect(paths).toEqual({
      root: join(repoRoot, "resources"),
      databaseDir: join(repoRoot, "resources", "database"),
      globalDir: join(repoRoot, "resources", "global"),
      logsDir: join(repoRoot, "resources", "logs"),
      databaseFile: join(repoRoot, "resources", "database", "ai-factory.db"),
      globalLogFile: join(repoRoot, "resources", "logs", "ai-factory-global.jsonl"),
    });
  });
});
