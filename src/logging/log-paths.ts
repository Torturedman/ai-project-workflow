import { join } from "node:path";

// File log names only keep portable ASCII segments so command/user text cannot create paths.
const unsafeFilenameSegmentPattern = /[^a-z0-9]+/g;
const surroundingDashesPattern = /^-+|-+$/g;
const repeatedDashesPattern = /-+/g;

// Timestamps in log names use compact UTC form, matching examples in logging-database.md.
const timestampSeparatorPattern = /[-:]/g;
const timestampMillisecondsPattern = /\.\d{3}Z$/;

function sanitizeLogSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(unsafeFilenameSegmentPattern, "-")
    .replace(surroundingDashesPattern, "")
    .replace(repeatedDashesPattern, "-");
}

function formatTimestamp(timestamp: Date): string {
  return timestamp.toISOString().replace(timestampSeparatorPattern, "").replace(timestampMillisecondsPattern, "Z");
}

export function getGlobalLogPath(globalHome: string): string {
  return join(globalHome, "logs", "ai-factory-global.jsonl");
}

export function createCommandLogPaths(
  projectDir: string,
  commandName: string,
  timestamp: Date,
): {
  stdout: string;
  stderr: string;
} {
  const safeName = sanitizeLogSegment(commandName) || "command";
  const stamp = formatTimestamp(timestamp);
  const baseDir = join(projectDir, ".ai-factory", "logs", "commands");

  return {
    stdout: join(baseDir, `${safeName}-${stamp}.stdout.log`),
    stderr: join(baseDir, `${safeName}-${stamp}.stderr.log`),
  };
}

export function createAgentLogPaths(
  projectDir: string,
  role: string,
  taskTitle: string,
  invocationId: string,
): {
  stdout: string;
  stderr: string;
  prompt: string;
} {
  const safeTitle = sanitizeLogSegment(taskTitle) || "task";
  const safeRole = sanitizeLogSegment(role) || "agent";
  const baseDir = join(projectDir, ".ai-factory", "logs", "agents", safeRole);
  const fileBase = `${safeTitle}-${invocationId}`;

  return {
    stdout: join(baseDir, `${fileBase}.stdout.log`),
    stderr: join(baseDir, `${fileBase}.stderr.log`),
    prompt: join(baseDir, `${fileBase}.prompt.md`),
  };
}
