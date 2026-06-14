import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("ai-factory CLI help", () => {
  it("prints the top-level commands", async () => {
    const { stdout } = await execFileAsync("node", ["dist/cli/index.js", "--help"]);

    expect(stdout).toContain("ai-factory");
    expect(stdout).toContain("doctor");
    expect(stdout).toContain("profiles");
  });
});
