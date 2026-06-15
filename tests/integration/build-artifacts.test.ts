import { access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { execa } from "execa";
import { describe, expect, it } from "vitest";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

describe("build artifacts", () => {
  it("includes SQLite migrations required by the compiled store", async () => {
    await execa("npm", ["run", "build"], { cwd: repoRoot, shell: false });

    await expect(access(join(repoRoot, "dist", "persistence", "migrations", "001_init.sql"))).resolves.toBeUndefined();
  });
});
