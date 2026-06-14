import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface ResourcePaths {
  root: string;
  databaseDir: string;
  globalDir: string;
  logsDir: string;
  databaseFile: string;
  globalLogFile: string;
}

export function getRepositoryRoot(): string {
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))));
}

export function getResourcePaths(repoRoot: string = getRepositoryRoot()): ResourcePaths {
  const root = join(repoRoot, "resources");
  const databaseDir = join(root, "database");
  const globalDir = join(root, "global");
  const logsDir = join(root, "logs");

  return {
    root,
    databaseDir,
    globalDir,
    logsDir,
    databaseFile: join(databaseDir, "ai-factory.db"),
    globalLogFile: join(logsDir, "ai-factory-global.jsonl"),
  };
}

export function getDefaultGlobalHome(repoRoot?: string): string {
  return getResourcePaths(repoRoot).globalDir;
}

export function getGlobalDatabasePath(repoRoot?: string): string {
  return getResourcePaths(repoRoot).databaseFile;
}
